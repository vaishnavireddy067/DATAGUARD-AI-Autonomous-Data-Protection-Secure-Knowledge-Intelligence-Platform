from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.audit import AuditLogResponse
from app.schemas.document import DocumentResponse

class RiskDistributionItem(BaseModel):
    level: str
    count: int
    percentage: float

class CategoryCountItem(BaseModel):
    category: str
    count: int
    risk_level: str

class DashboardStatsResponse(BaseModel):
    total_documents: int
    sensitive_documents: int
    high_risk_documents: int
    critical_documents: int
    clean_documents: int
    risk_distribution: List[RiskDistributionItem]
    sensitive_categories: List[CategoryCountItem]
    recent_documents: List[DocumentResponse]
    recent_events: List[AuditLogResponse]
    total_findings_count: int
    total_protection_actions_count: int
