export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AccessLevel = 'public' | 'internal' | 'confidential' | 'restricted';
export type DocumentStatus = 'pending' | 'analyzing' | 'detecting' | 'assessing_risk' | 'protecting' | 'completed' | 'failed';
export type ActionType = 'MASK' | 'REDACT' | 'RESTRICT_ACCESS';

export interface SensitiveFinding {
  id: number;
  document_id: number;
  data_type: string;
  detected_value_masked: string;
  count: number;
  risk_level: RiskLevel;
  details?: string;
}

export interface ProtectionAction {
  id: number;
  document_id: number;
  action_type: ActionType;
  performed_by: number;
  performed_at: string;
  details?: string;
  performer_name?: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  file_type: string;
  uploaded_by: number;
  upload_time: string;
  storage_path: string;
  file_size_bytes: number;
  risk_level: RiskLevel;
  access_level: AccessLevel;
  status: DocumentStatus;
  risk_score: number;
  risk_explanation?: string;
  uploader?: User;
}

export interface DocumentDetail extends DocumentItem {
  extracted_text?: string;
  protected_text?: string;
  findings: SensitiveFinding[];
  actions: ProtectionAction[];
}

export interface WorkflowStep {
  agent: string;
  stage: string;
  status: string;
  timestamp: string;
  summary: string;
}

export interface DocumentAnalyzeResponse {
  document_id: number;
  filename: string;
  status: string;
  risk_score: number;
  risk_level: RiskLevel;
  risk_explanation: string;
  findings_count: number;
  findings: SensitiveFinding[];
  recommended_actions: string[];
  workflow_steps: WorkflowStep[];
}

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource: string;
  timestamp: string;
  result: 'SUCCESS' | 'ALLOWED' | 'DENIED' | 'FAILED';
  details?: string;
  user?: User;
}

export interface RiskDistributionItem {
  level: RiskLevel;
  count: number;
  percentage: number;
}

export interface CategoryCountItem {
  category: string;
  count: number;
  risk_level: RiskLevel;
}

export interface DashboardStats {
  total_documents: number;
  sensitive_documents: number;
  high_risk_documents: number;
  critical_documents: number;
  clean_documents: number;
  risk_distribution: RiskDistributionItem[];
  sensitive_categories: CategoryCountItem[];
  recent_documents: DocumentItem[];
  recent_events: AuditLog[];
  total_findings_count: number;
  total_protection_actions_count: number;
}
