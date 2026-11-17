# DATAGUARD AI
### Autonomous Data Protection & Secure Knowledge Intelligence Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Async%20SQLAlchemy-009688.svg)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/AI%20Workflow-LangGraph%20StateGraph-8B5CF6.svg)](https://langchain-ai.github.io/langgraph/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20%2B%20TypeScript%20%2B%20Tailwind-black.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20SQLite%20Fallback-336791.svg)](https://www.postgresql.org/)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20Passing-brightgreen.svg)](https://docs.pytest.org/)

---

## 1. Project Goal

**DATAGUARD AI** is an enterprise AI security platform designed to ingest corporate documents and datasets, autonomously extract content, detect sensitive personal and financial identifiers (PII), calculate transparent mathematical risk scores, execute verifiable protection actions (Masking, Redaction, and Access Tiering), and record every event in an immutable compliance audit trail.

> **Zero Simulated Metrics Policy**: Every dashboard metric, Recharts graph, sensitive finding, and audit record is strictly derived from actual uploaded files and database records.

---

## 2. Core Autonomous Pipeline

```text
User Upload
    ↓
Document Intelligence (Text & Structural Metadata Extraction)
    ↓
Sensitive Data Detection (Pattern-based PII & Financial Scanner)
    ↓
Risk Assessment (Rule-based 0-100 Score & Explanatory Rationale)
    ↓
Protection Decision (Policy Engine Recommendation)
    ↓
Protection Action (Irreversible Masking, Redaction, or RBAC Restriction)
    ↓
Secure Storage (Metadata, Findings, and Vectors Persisted to DB)
    ↓
Audit Logging (Immutable Ledger: User → Action → Resource → Time → Result)
```

---

## 3. Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Python-Jose (JWT), Bcrypt.
- **AI Agent Orchestration**: LangGraph `StateGraph` passing typed `DocumentWorkflowState`.
- **Database**: PostgreSQL (Production / Docker) with automatic async SQLite fallback (`aiosqlite`) for zero-setup instant local execution.
- **Document Parsers**: `pypdf` (PDF), `python-docx` (Word), `openpyxl` (Excel), Python CSV reader (CSV), UTF-8 text reader (TXT).

---

## 4. User Roles & Access Control (RBAC)

| Role | Access Scope | Protection Authority | Audit Visibility |
| :--- | :--- | :--- | :--- |
| **Admin** | Unrestricted access to all documents (Public, Internal, Confidential, Restricted) | Full authority (MASK, REDACT, RESTRICT_ACCESS) | Organization-wide immutable audit trail |
| **Manager** | View authorized documents (Public, Internal, Confidential) + Owned documents | Apply MASK, REDACT, and RESTRICT_ACCESS | Departmental and document-specific logs |
| **Employee** | View authorized documents (Public, Internal) + Owned documents. **Strictly blocked from Restricted/Confidential** | Apply MASK and REDACT on owned files | Personal user activity logs |

---

## 5. Multi-Agent LangGraph Architecture

The workflow passes a real typed state machine (`DocumentWorkflowState`) across 5 sequential specialized agents:

1. **Document Intelligence Agent**: Extracts actual text, page/sheet counts, and structural metadata from PDF, DOCX, TXT, CSV, or XLSX files.
2. **Sensitive Data Detection Agent**: Executes pattern detection for:
   - Email addresses (e.g. `vaishnavi@gmail.com`)
   - Telephone numbers (`+91 9876543210`)
   - Indian PAN Card identifiers (`ABCDE1234F`)
   - Aadhaar-like patterns (`2345 6789 1234` — *synthetic demo datasets only*)
   - Bank Account numbers (`Account Number 12345678901234`)
   - Sensitive column names (`email`, `phone`, `salary`, `pan`, `account`, `address`, etc.)
3. **Risk Assessment Agent**: Computes transparent rule-based risk score (0-100) and rationale:
   - **LOW (0-25)**: Minimal or non-sensitive information
   - **MEDIUM (26-55)**: Contact info (emails, phone numbers)
   - **HIGH (56-80)**: Financial data, PAN, bank accounts, or combined categories
   - **CRITICAL (81-100)**: Large concentration of highly sensitive government/financial identifiers
4. **Protection Agent**: Evaluates risk score and recommends or applies allowed protection actions (`MASK`, `REDACT`, `RESTRICT_ACCESS`).
5. **Compliance & Audit Agent**: Synthesizes workflow audit records and records immutable audit ledger entries.

---

## 6. Real Protection Engine

1. **MASK Action**:
   - `vaishnavi@gmail.com` → `vai***@gmail.com`
   - `+91 9876543210` → `+91 98765*****`
   - `ABCDE1234F` → `ABC*****4F`
   - `XXXX-XXXX-1234`
2. **REDACT Action**:
   - Replaces sensitive entities with `[REDACTED_EMAIL]`, `[REDACTED_PHONE]`, `[REDACTED_PAN]`, `[REDACTED_AADHAAR]`, and `[REDACTED_ACCOUNT]`.
3. **RESTRICT_ACCESS Action**:
   - Elevates document classification to `Confidential` or `Restricted`, dynamically blocking standard employees.

---

## 7. Pre-Seeded Default Accounts

For instant testing and evaluation of the Role-Based Access Control matrix:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@dataguard.ai` | `Admin@123` |
| **Manager** | `manager@dataguard.ai` | `Manager@123` |
| **Employee** | `employee@dataguard.ai` | `Employee@123` |

*(A 1-click test role switcher is also provided directly in the frontend header and User Management page)*.

---

## 8. Installation & Setup Guide

### Option A: Local Development (Python + Node.js)

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
..\venv\Scripts\activate
# Linux/macOS:
source ../venv/bin/activate

# Install dependencies (if needed)
pip install -r requirements.txt

# Run FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Web Application will be live at: `http://localhost:3000`

---

### Option B: Docker Compose (PostgreSQL + Full Stack)

```bash
# Start PostgreSQL, Backend, and Frontend containers together
docker-compose up -d --build
```

---

## 9. API Endpoints Directory

### Authentication & RBAC (`/api/auth`)
- `POST /api/auth/register` — Register a new user account with hashed password and role.
- `POST /api/auth/login` — Sign in and receive signed JWT token with role claims.
- `GET /api/auth/me` — Retrieve active authenticated user profile.
- `POST /api/auth/logout` — Invalidate session and record audit log.

### Document Intelligence & Protection (`/api/documents`)
- `POST /api/documents/upload` — Upload PDF, DOCX, TXT, CSV, or XLSX, validate file, extract content, and trigger LangGraph workflow.
- `GET /api/documents` — List documents filtered by RBAC permissions, risk level, and access level.
- `GET /api/documents/{id}` — Fetch document details, extracted/protected text, and findings (enforces role check).
- `POST /api/documents/{id}/analyze` — Re-execute multi-agent LangGraph workflow.
- `POST /api/documents/{id}/protect` — Apply `MASK`, `REDACT`, or `RESTRICT_ACCESS` protection action.
- `DELETE /api/documents/{id}` — Delete document (Admin or owner only).

### Security Dashboard (`/api/dashboard`)
- `GET /api/dashboard` — Live database aggregation of total documents, sensitive files, risk distribution, category breakdown, and recent security events.

### Immutable Audit Logs (`/api/audit-logs`)
- `GET /api/audit-logs` — Query audit trail with filtering by user, action, result (`SUCCESS`, `ALLOWED`, `DENIED`, `FAILED`), and search terms.

### User Management (`/api/users`)
- `GET /api/users` — List registered users (Admin only).
- `PUT /api/users/{id}/role` — Update user's RBAC role (Admin only).
- `PUT /api/users/profile` — Update own user profile.

---

## 10. Automated Tests

Run the full pytest automated test suite:

```bash
cd backend
python -m pytest -v tests/test_dataguard.py
```

Test coverage includes:
- Health check verification
- JWT authentication & role-based route blocking
- Multi-format extraction (PDF, DOCX, TXT, CSV, XLSX)
- Pattern-based PII detection & masking
- LangGraph 5-agent state graph pipeline
- Protection actions (`MASK`, `REDACT`, `RESTRICT_ACCESS`)
- Role-based document access isolation
- Audit logging & dashboard metrics verification

---

## 11. What is Genuinely Working vs Future Phases

### Working in this MVP:
- Real content extraction from actual `.pdf`, `.docx`, `.txt`, `.csv`, and `.xlsx` files.
- Real regex & pattern detection for emails, phones, PAN cards, synthetic Aadhaar demo patterns, bank accounts, and sensitive column headers.
- Real mathematical risk calculation and human-readable explanation generation.
- Full 5-agent LangGraph StateGraph pipeline passing typed state.
- Real protection actions mutating the document's protected representation and persisting to database.
- Complete Role-Based Access Control (Admin, Manager, Employee) enforced at both database and API levels.
- Immutable audit logging on every upload, view, protection action, and login attempt.
- Recharts visualizations and metric cards connected exclusively to real database records with graceful empty states.

### Future Phase:
- **Permission-Aware RAG**: Vector embedding, semantic retrieval, and chunk-level access validation where the system retrieves and answers queries strictly from authorized documents.
