import {
  AuthResponse,
  User,
  DocumentItem,
  DocumentDetail,
  DocumentAnalyzeResponse,
  DashboardStats,
  AuditLog,
  ActionType,
  AccessLevel
} from '@/types';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_BASE_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dataguard_token');
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('dataguard_token', token);
  } else {
    localStorage.removeItem('dataguard_token');
  }
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('dataguard_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem('dataguard_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('dataguard_user');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === 'string') {
        errorDetail = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
      } else if (errJson.detail) {
        errorDetail = JSON.stringify(errJson.detail);
      }
    } catch {
      // keep fallback
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  register: async (name: string, email: string, password: string, role: string = 'employee'): Promise<AuthResponse> => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
    setStoredToken(data.access_token);
    setStoredUser(data.user);
    return data;
  },

  getMe: async (): Promise<User> => {
    return request<User>('/auth/me');
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setStoredUser(null);
    }
  },

  // Documents
  uploadDocument: async (file: File, accessLevel: AccessLevel = 'internal'): Promise<DocumentDetail> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('access_level', accessLevel);

    return request<DocumentDetail>('/documents/upload', {
      method: 'POST',
      body: formData
    });
  },

  listDocuments: async (filters?: { risk_level?: string; access_level?: string; search?: string }): Promise<DocumentItem[]> => {
    const params = new URLSearchParams();
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.access_level) params.append('access_level', filters.access_level);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<DocumentItem[]>(`/documents${query}`);
  },

  getDocument: async (id: number): Promise<DocumentDetail> => {
    return request<DocumentDetail>(`/documents/${id}`);
  },

  analyzeDocument: async (id: number): Promise<DocumentAnalyzeResponse> => {
    return request<DocumentAnalyzeResponse>(`/documents/${id}/analyze`, {
      method: 'POST'
    });
  },

  protectDocument: async (id: number, actionType: ActionType, accessLevel?: AccessLevel): Promise<DocumentDetail> => {
    return request<DocumentDetail>(`/documents/${id}/protect`, {
      method: 'POST',
      body: JSON.stringify({ action_type: actionType, access_level: accessLevel })
    });
  },

  deleteDocument: async (id: number): Promise<{ message: string }> => {
    return request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE'
    });
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/dashboard');
  },

  // Audit Logs
  getAuditLogs: async (filters?: { user_id?: number; action?: string; result?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const params = new URLSearchParams();
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.result) params.append('result', filters.result);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<AuditLog[]>(`/audit-logs${query}`);
  },

  // Users
  listUsers: async (): Promise<User[]> => {
    return request<User[]>('/users');
  },

  updateUserRole: async (userId: number, role: string): Promise<User> => {
    return request<User>(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  }
};
