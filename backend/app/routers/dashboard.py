from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, distinct
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document, SensitiveFinding, ProtectionAction, RiskLevel, AccessLevel
from app.models.audit import AuditLog
from app.schemas.dashboard import DashboardStatsResponse, RiskDistributionItem, CategoryCountItem
from app.schemas.document import DocumentResponse
from app.schemas.audit import AuditLogResponse
from app.utils.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardStatsResponse)
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Computes genuine real-time statistics directly from PostgreSQL/database records.
    Filters metrics based on user role:
    - Admin: organization-wide statistics
    - Manager: authorized documents statistics
    - Employee: accessible documents statistics
    """
    user_role = current_user.role.lower()

    # Base query for accessible documents
    doc_filter = []
    if user_role == UserRole.MANAGER.value:
        doc_filter.append(
            (Document.access_level != AccessLevel.RESTRICTED.value) |
            (Document.uploaded_by == current_user.id)
        )
    elif user_role == UserRole.EMPLOYEE.value:
        doc_filter.append(
            (Document.access_level.in_([AccessLevel.PUBLIC.value, AccessLevel.INTERNAL.value])) |
            (Document.uploaded_by == current_user.id)
        )

    # 1. Total Documents
    total_docs_stmt = select(func.count(Document.id))
    if doc_filter:
        total_docs_stmt = total_docs_stmt.where(*doc_filter)
    total_docs_res = await db.execute(total_docs_stmt)
    total_documents = total_docs_res.scalar() or 0

    # 2. Risk Distribution breakdown
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    risk_stmt = select(Document.risk_level, func.count(Document.id)).group_by(Document.risk_level)
    if doc_filter:
        risk_stmt = risk_stmt.where(*doc_filter)
    risk_res = await db.execute(risk_stmt)
    for lvl, count in risk_res.all():
        lvl_key = (lvl or "LOW").upper()
        if lvl_key in risk_counts:
            risk_counts[lvl_key] = count
        else:
            risk_counts["LOW"] += count

    high_risk_documents = risk_counts["HIGH"]
    critical_documents = risk_counts["CRITICAL"]

    risk_dist_items = []
    for lvl in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
        cnt = risk_counts[lvl]
        pct = round((cnt / total_documents * 100), 1) if total_documents > 0 else 0.0
        risk_dist_items.append(RiskDistributionItem(level=lvl, count=cnt, percentage=pct))

    # 3. Sensitive Documents (docs that have at least one SensitiveFinding)
    sens_docs_stmt = select(func.count(distinct(SensitiveFinding.document_id))).join(Document)
    if doc_filter:
        sens_docs_stmt = sens_docs_stmt.where(*doc_filter)
    sens_docs_res = await db.execute(sens_docs_stmt)
    sensitive_documents = sens_docs_res.scalar() or 0

    clean_documents = max(total_documents - sensitive_documents, 0)

    # 4. Sensitive Categories Breakdown
    cat_stmt = (
        select(
            SensitiveFinding.data_type,
            func.sum(SensitiveFinding.count).label("total_detected"),
            SensitiveFinding.risk_level
        )
        .join(Document)
        .group_by(SensitiveFinding.data_type, SensitiveFinding.risk_level)
        .order_by(func.sum(SensitiveFinding.count).desc())
    )
    if doc_filter:
        cat_stmt = cat_stmt.where(*doc_filter)
    cat_res = await db.execute(cat_stmt)
    
    sensitive_categories: List[CategoryCountItem] = []
    for dtype, count_sum, rlevel in cat_res.all():
        sensitive_categories.append(
            CategoryCountItem(
                category=dtype,
                count=int(count_sum or 0),
                risk_level=rlevel
            )
        )

    # 5. Total counts
    findings_stmt = select(func.sum(SensitiveFinding.count)).join(Document)
    if doc_filter:
        findings_stmt = findings_stmt.where(*doc_filter)
    findings_res = await db.execute(findings_stmt)
    total_findings_count = int(findings_res.scalar() or 0)

    actions_stmt = select(func.count(ProtectionAction.id)).join(Document)
    if doc_filter:
        actions_stmt = actions_stmt.where(*doc_filter)
    actions_res = await db.execute(actions_stmt)
    total_actions_count = actions_res.scalar() or 0

    # 6. Recent Documents (5 latest)
    recent_docs_stmt = (
        select(Document)
        .options(selectinload(Document.uploader))
        .order_by(Document.upload_time.desc())
        .limit(5)
    )
    if doc_filter:
        recent_docs_stmt = recent_docs_stmt.where(*doc_filter)
    recent_docs_res = await db.execute(recent_docs_stmt)
    recent_documents = [DocumentResponse.model_validate(d) for d in recent_docs_res.scalars().all()]

    # 7. Recent Security Audit Events (8 latest)
    events_stmt = (
        select(AuditLog)
        .options(selectinload(AuditLog.user))
        .order_by(AuditLog.timestamp.desc())
        .limit(8)
    )
    if user_role == UserRole.EMPLOYEE.value:
        events_stmt = events_stmt.where(AuditLog.user_id == current_user.id)
    events_res = await db.execute(events_stmt)
    recent_events = [AuditLogResponse.model_validate(e) for e in events_res.scalars().all()]

    return DashboardStatsResponse(
        total_documents=total_documents,
        sensitive_documents=sensitive_documents,
        high_risk_documents=high_risk_documents,
        critical_documents=critical_documents,
        clean_documents=clean_documents,
        risk_distribution=risk_dist_items,
        sensitive_categories=sensitive_categories,
        recent_documents=recent_documents,
        recent_events=recent_events,
        total_findings_count=total_findings_count,
        total_protection_actions_count=total_actions_count
    )
