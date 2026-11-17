import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import (
    Document, SensitiveFinding, ProtectionAction,
    RiskLevel, AccessLevel, DocumentStatus, ActionType
)
from app.models.audit import AuditResult
from app.schemas.document import (
    DocumentResponse, DocumentDetailResponse, DocumentAnalyzeResponse,
    SensitiveFindingResponse, ProtectionActionResponse, ProtectionActionCreate
)
from app.utils.deps import get_current_user, check_document_access
from app.services.audit_service import record_audit_log
from app.services.protection_service import apply_masking_to_text, apply_redaction_to_text
from app.agents.workflow import run_document_workflow

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "csv", "xlsx"}
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB limit

def get_current_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)

@router.post("/upload", response_model=DocumentDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    access_level: Optional[str] = Form(AccessLevel.INTERNAL.value),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads a document (PDF, DOCX, TXT, CSV, XLSX), validates format,
    stores safely on disk, creates DB record, and executes the LangGraph multi-agent workflow.
    """
    filename = file.filename or "unknown_file"
    file_ext = filename.split(".")[-1].lower() if "." in filename else ""

    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Validate access level
    acc_lvl = (access_level or AccessLevel.INTERNAL.value).lower()
    if acc_lvl not in [AccessLevel.PUBLIC.value, AccessLevel.INTERNAL.value, AccessLevel.CONFIDENTIAL.value, AccessLevel.RESTRICTED.value]:
        acc_lvl = AccessLevel.INTERNAL.value

    # Only Admin can set RESTRICTED at upload time
    if acc_lvl == AccessLevel.RESTRICTED.value and current_user.role != UserRole.ADMIN.value:
        acc_lvl = AccessLevel.CONFIDENTIAL.value

    # Generate unique storage filename
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Save file safely
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file to storage: {str(e)}"
        )

    file_size = os.path.getsize(file_path)

    if file_size > MAX_FILE_SIZE_BYTES:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size} bytes) exceeds maximum limit of 25 MB."
        )

    # Create document in DB with status pending
    doc = Document(
        filename=filename,
        file_type=file_ext,
        uploaded_by=current_user.id,
        upload_time=get_current_utc(),
        storage_path=file_path,
        file_size_bytes=file_size,
        risk_level=RiskLevel.LOW.value,
        access_level=acc_lvl,
        status=DocumentStatus.PENDING.value
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Record upload audit log
    await record_audit_log(
        db=db,
        action="UPLOAD_DOCUMENT",
        resource=f"document:{doc.filename}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details=f"Uploaded {doc.file_type.upper()} ({file_size} bytes) with initial access level {doc.access_level}"
    )

    # Execute LangGraph Multi-Agent Workflow
    try:
        doc.status = DocumentStatus.ANALYZING.value
        await db.commit()

        workflow_result = await run_document_workflow(
            document_id=doc.id,
            filename=doc.filename,
            file_type=doc.file_type,
            file_path=doc.storage_path,
            uploaded_by=current_user.id
        )

        # Update document with extracted intelligence and risk assessment
        doc.extracted_text = workflow_result["extracted_text"]
        doc.risk_score = workflow_result["risk_score"]
        doc.risk_level = workflow_result["risk_level"]
        doc.risk_explanation = workflow_result["risk_explanation"]
        doc.status = DocumentStatus.COMPLETED.value

        # Save Sensitive Findings
        for f_data in workflow_result.get("findings", []):
            finding = SensitiveFinding(
                document_id=doc.id,
                data_type=f_data["data_type"],
                detected_value_masked=f_data["detected_value_masked"],
                count=f_data["count"],
                risk_level=f_data["risk_level"],
                details=f_data.get("details", "")
            )
            db.add(finding)

        await db.commit()
        await db.refresh(doc)

        # Record workflow completion audit log
        await record_audit_log(
            db=db,
            action="ANALYZE_DOCUMENT",
            resource=f"document:{doc.filename}",
            result=AuditResult.SUCCESS.value,
            user_id=current_user.id,
            details=f"LangGraph analysis completed: Risk={doc.risk_level} ({doc.risk_score}/100), Findings={len(workflow_result.get('findings', []))}"
        )

    except Exception as exc:
        doc.status = DocumentStatus.FAILED.value
        doc.risk_explanation = f"Analysis pipeline error: {str(exc)}"
        await db.commit()
        await record_audit_log(
            db=db,
            action="ANALYZE_DOCUMENT",
            resource=f"document:{doc.filename}",
            result=AuditResult.FAILED.value,
            user_id=current_user.id,
            details=f"Workflow failed: {str(exc)}"
        )

    # Fetch document with eager loading
    stmt = (
        select(Document)
        .options(
            selectinload(Document.findings),
            selectinload(Document.actions),
            selectinload(Document.uploader)
        )
        .where(Document.id == doc.id)
    )
    res = await db.execute(stmt)
    full_doc = res.scalar_one()

    return full_doc

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    risk_level: Optional[str] = Query(None),
    access_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List documents filtered by user role and access permissions:
    - Admin: All documents
    - Manager: Public, Internal, Confidential, or documents uploaded by self
    - Employee: Public, Internal, or documents uploaded by self
    """
    stmt = (
        select(Document)
        .options(selectinload(Document.uploader))
        .order_by(Document.upload_time.desc())
    )

    # RBAC filter at database query level
    user_role = current_user.role.lower()
    if user_role == UserRole.ADMIN.value:
        pass # All documents
    elif user_role == UserRole.MANAGER.value:
        # Managers cannot view restricted documents unless uploaded by them
        stmt = stmt.where(
            (Document.access_level != AccessLevel.RESTRICTED.value) |
            (Document.uploaded_by == current_user.id)
        )
    elif user_role == UserRole.EMPLOYEE.value:
        # Employees cannot view confidential or restricted files unless uploaded by them
        stmt = stmt.where(
            (Document.access_level.in_([AccessLevel.PUBLIC.value, AccessLevel.INTERNAL.value])) |
            (Document.uploaded_by == current_user.id)
        )

    if risk_level:
        stmt = stmt.where(Document.risk_level == risk_level.upper())
    if access_level:
        stmt = stmt.where(Document.access_level == access_level.lower())
    if search:
        stmt = stmt.where(Document.filename.ilike(f"%{search}%"))

    result = await db.execute(stmt)
    documents = result.scalars().all()
    return documents

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed document view including extracted/protected text, findings, and protection actions.
    Enforces RBAC and logs VIEW_DOCUMENT audit event.
    """
    stmt = (
        select(Document)
        .options(
            selectinload(Document.findings),
            selectinload(Document.actions),
            selectinload(Document.uploader)
        )
        .where(Document.id == document_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check RBAC access
    has_access = check_document_access(doc, current_user)
    if not has_access:
        await record_audit_log(
            db=db,
            action="VIEW_DOCUMENT",
            resource=f"document:{doc.filename}",
            result=AuditResult.DENIED.value,
            user_id=current_user.id,
            details=f"Access denied: User role '{current_user.role}' cannot view {doc.access_level} document."
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: You do not have permission to view this {doc.access_level} document."
        )

    # Record allowed audit log
    await record_audit_log(
        db=db,
        action="VIEW_DOCUMENT",
        resource=f"document:{doc.filename}",
        result=AuditResult.ALLOWED.value,
        user_id=current_user.id,
        details=f"Viewed document {doc.filename} (Access: {doc.access_level}, Risk: {doc.risk_level})"
    )

    return doc

@router.post("/{document_id}/analyze", response_model=DocumentAnalyzeResponse)
async def reanalyze_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Re-executes the LangGraph Multi-Agent workflow on an existing document.
    """
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not check_document_access(doc, current_user):
        raise HTTPException(status_code=403, detail="Permission denied to analyze this document")

    # Clear old findings
    del_stmt = select(SensitiveFinding).where(SensitiveFinding.document_id == doc.id)
    old_findings_res = await db.execute(del_stmt)
    for old_f in old_findings_res.scalars().all():
        await db.delete(old_f)
    await db.commit()

    # Run LangGraph workflow
    workflow_result = await run_document_workflow(
        document_id=doc.id,
        filename=doc.filename,
        file_type=doc.file_type,
        file_path=doc.storage_path,
        uploaded_by=current_user.id
    )

    doc.extracted_text = workflow_result["extracted_text"]
    doc.risk_score = workflow_result["risk_score"]
    doc.risk_level = workflow_result["risk_level"]
    doc.risk_explanation = workflow_result["risk_explanation"]
    doc.status = DocumentStatus.COMPLETED.value

    saved_findings = []
    for f_data in workflow_result.get("findings", []):
        finding = SensitiveFinding(
            document_id=doc.id,
            data_type=f_data["data_type"],
            detected_value_masked=f_data["detected_value_masked"],
            count=f_data["count"],
            risk_level=f_data["risk_level"],
            details=f_data.get("details", "")
        )
        db.add(finding)
        saved_findings.append(finding)

    await db.commit()
    await db.refresh(doc)

    await record_audit_log(
        db=db,
        action="ANALYZE_DOCUMENT",
        resource=f"document:{doc.filename}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details=f"Re-analysis completed via LangGraph. New Risk Level: {doc.risk_level}"
    )

    return DocumentAnalyzeResponse(
        document_id=doc.id,
        filename=doc.filename,
        status=doc.status,
        risk_score=doc.risk_score,
        risk_level=doc.risk_level,
        risk_explanation=doc.risk_explanation or "",
        findings_count=len(saved_findings),
        findings=[SensitiveFindingResponse.model_validate(f) for f in saved_findings],
        recommended_actions=workflow_result.get("recommended_actions", []),
        workflow_steps=workflow_result.get("workflow_history", [])
    )

@router.post("/{document_id}/protect", response_model=DocumentDetailResponse)
async def protect_document(
    document_id: int,
    action_in: ProtectionActionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Applies protection actions:
    - MASK: Replaces sensitive data with masked representations in protected_text
    - REDACT: Replaces sensitive data with [REDACTED] tokens in protected_text
    - RESTRICT_ACCESS: Updates document access_level to confidential/restricted (Admin/Manager only)
    """
    stmt = (
        select(Document)
        .options(
            selectinload(Document.findings),
            selectinload(Document.actions),
            selectinload(Document.uploader)
        )
        .where(Document.id == document_id)
    )
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    action_type = action_in.action_type.upper().strip()
    if action_type not in [ActionType.MASK.value, ActionType.REDACT.value, ActionType.RESTRICT_ACCESS.value]:
        raise HTTPException(status_code=400, detail="Invalid action type. Allowed: MASK, REDACT, RESTRICT_ACCESS")

    # Check roles for actions
    user_role = current_user.role.lower()
    if action_type == ActionType.RESTRICT_ACCESS.value and user_role not in [UserRole.ADMIN.value, UserRole.MANAGER.value]:
        raise HTTPException(status_code=403, detail="Only Admins and Managers can restrict document access levels")

    action_detail = ""

    if action_type == ActionType.MASK.value:
        source_text = doc.extracted_text or ""
        doc.protected_text = apply_masking_to_text(source_text)
        action_detail = "Applied data masking to sensitive entities (emails, phones, PAN, Aadhaar demo patterns)"

    elif action_type == ActionType.REDACT.value:
        source_text = doc.extracted_text or ""
        doc.protected_text = apply_redaction_to_text(source_text)
        action_detail = "Applied full data redaction to sensitive identifiers ([REDACTED] replacements)"

    elif action_type == ActionType.RESTRICT_ACCESS.value:
        new_level = (action_in.access_level or AccessLevel.RESTRICTED.value).lower()
        if new_level not in [AccessLevel.CONFIDENTIAL.value, AccessLevel.RESTRICTED.value]:
            new_level = AccessLevel.RESTRICTED.value
        old_level = doc.access_level
        doc.access_level = new_level
        action_detail = f"Changed document access level from '{old_level}' to '{new_level}'"

    # Record Protection Action in DB
    prot_action = ProtectionAction(
        document_id=doc.id,
        action_type=action_type,
        performed_by=current_user.id,
        performed_at=get_current_utc(),
        details=action_detail
    )
    db.add(prot_action)
    await db.commit()
    await db.refresh(doc)

    # Record Audit Log
    await record_audit_log(
        db=db,
        action=f"APPLY_{action_type}",
        resource=f"document:{doc.filename}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details=action_detail
    )

    return doc

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a document from the system (Admin or uploader only).
    """
    stmt = select(Document).where(Document.id == document_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if current_user.role != UserRole.ADMIN.value and doc.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied to delete this document")

    filename = doc.filename
    storage_path = doc.storage_path

    await db.delete(doc)
    await db.commit()

    # Remove file from disk if exists
    if os.path.exists(storage_path):
        try:
            os.remove(storage_path)
        except Exception:
            pass

    await record_audit_log(
        db=db,
        action="DELETE_DOCUMENT",
        resource=f"document:{filename}",
        result=AuditResult.SUCCESS.value,
        user_id=current_user.id,
        details=f"Document {filename} was deleted by {current_user.email}"
    )

    return {"message": f"Document '{filename}' deleted successfully"}
