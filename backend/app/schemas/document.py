from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.auth import UserResponse

class SensitiveFindingResponse(BaseModel):
    id: int
    document_id: int
    data_type: str
    detected_value_masked: str
    count: int
    risk_level: str
    details: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ProtectionActionCreate(BaseModel):
    action_type: str # MASK, REDACT, RESTRICT_ACCESS
    access_level: Optional[str] = None # When action_type == RESTRICT_ACCESS
    details: Optional[str] = None

class ProtectionActionResponse(BaseModel):
    id: int
    document_id: int
    action_type: str
    performed_by: int
    performed_at: datetime
    details: Optional[str] = None
    performer_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentResponse(BaseModel):
    id: int
    filename: str
    file_type: str
    uploaded_by: int
    upload_time: datetime
    storage_path: str
    file_size_bytes: int
    risk_level: str
    access_level: str
    status: str
    risk_score: float
    risk_explanation: Optional[str] = None
    uploader: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(DocumentResponse):
    extracted_text: Optional[str] = None
    protected_text: Optional[str] = None
    findings: List[SensitiveFindingResponse] = []
    actions: List[ProtectionActionResponse] = []

class DocumentAnalyzeResponse(BaseModel):
    document_id: int
    filename: str
    status: str
    risk_score: float
    risk_level: str
    risk_explanation: str
    findings_count: int
    findings: List[SensitiveFindingResponse]
    recommended_actions: List[str]
    workflow_steps: List[dict]

