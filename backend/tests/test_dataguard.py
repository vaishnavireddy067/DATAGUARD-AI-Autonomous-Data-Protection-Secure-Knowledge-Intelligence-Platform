import pytest
import io
import docx
import openpyxl
import pypdf
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "HEALTHY"
        assert "DataGuard AI" in data["service"]

@pytest.mark.asyncio
async def test_auth_login_and_roles():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Login as Admin
        admin_login = await ac.post("/api/auth/login", json={
            "email": "admin@dataguard.ai",
            "password": "Admin@123"
        })
        assert admin_login.status_code == 200
        admin_data = admin_login.json()
        assert "access_token" in admin_data
        assert admin_data["user"]["role"] == "admin"
        admin_token = admin_data["access_token"]

        # 2. Login as Employee
        emp_login = await ac.post("/api/auth/login", json={
            "email": "employee@dataguard.ai",
            "password": "Employee@123"
        })
        assert emp_login.status_code == 200
        emp_data = emp_login.json()
        assert emp_data["user"]["role"] == "employee"
        emp_token = emp_data["access_token"]

        # 3. Check /auth/me
        me_res = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "admin@dataguard.ai"

        # 4. Check admin-only route /api/users
        users_admin = await ac.get("/api/users", headers={"Authorization": f"Bearer {admin_token}"})
        assert users_admin.status_code == 200
        assert len(users_admin.json()) >= 3

        # 5. Check employee forbidden from /api/users
        users_emp = await ac.get("/api/users", headers={"Authorization": f"Bearer {emp_token}"})
        assert users_emp.status_code == 403

@pytest.mark.asyncio
async def test_all_supported_file_formats():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Login
        admin_login = await ac.post("/api/auth/login", json={
            "email": "admin@dataguard.ai",
            "password": "Admin@123"
        })
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. CSV test
        csv_content = (
            "name,email,phone,salary,pan\n"
            "Anugu Vaishnavi,vaishnavi@company.com,+91 9876543210,$120000,ABCDE1234F\n"
            "Alex Smith,alex@company.com,+91 9123456789,$95000,XYZPK9876Q\n"
        )
        csv_upload = await ac.post(
            "/api/documents/upload",
            files={"file": ("customer_dataset.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
            data={"access_level": "internal"},
            headers=headers
        )
        assert csv_upload.status_code == 201
        csv_doc = csv_upload.json()
        assert csv_doc["file_type"] == "csv"
        assert csv_doc["status"] == "completed"
        assert csv_doc["risk_level"] in ["HIGH", "CRITICAL"]

        # 2. DOCX test
        doc_obj = docx.Document()
        doc_obj.add_heading("Confidential Medical & Billing Statement", level=1)
        doc_obj.add_paragraph("Patient Contact: patient@healthcare.org, Phone: +91 9848022338")
        doc_obj.add_paragraph("Billing A/C: 987654321098 and PAN: ABCDE5678G")
        docx_io = io.BytesIO()
        doc_obj.save(docx_io)
        docx_io.seek(0)

        docx_upload = await ac.post(
            "/api/documents/upload",
            files={"file": ("medical_billing.docx", docx_io, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            data={"access_level": "confidential"},
            headers=headers
        )
        assert docx_upload.status_code == 201
        docx_doc = docx_upload.json()
        assert docx_doc["file_type"] == "docx"
        assert len(docx_doc["findings"]) >= 3

        # 3. XLSX test
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Executive Salaries"
        ws.append(["Employee", "Corporate Email", "Direct Phone", "PAN Number"])
        ws.append(["Vaishnavi", "lead@company.ai", "+91 9988776655", "BNZPK4321M"])
        xlsx_io = io.BytesIO()
        wb.save(xlsx_io)
        xlsx_io.seek(0)

        xlsx_upload = await ac.post(
            "/api/documents/upload",
            files={"file": ("executive_salaries.xlsx", xlsx_io, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"access_level": "restricted"},
            headers=headers
        )
        assert xlsx_upload.status_code == 201
        xlsx_doc = xlsx_upload.json()
        assert xlsx_doc["file_type"] == "xlsx"
        assert xlsx_doc["access_level"] == "restricted"

        # 4. RBAC Check on Restricted Document:
        # Employee should be forbidden from accessing restricted document
        emp_login = await ac.post("/api/auth/login", json={
            "email": "employee@dataguard.ai",
            "password": "Employee@123"
        })
        emp_headers = {"Authorization": f"Bearer {emp_login.json()['access_token']}"}
        emp_get = await ac.get(f"/api/documents/{xlsx_doc['id']}", headers=emp_headers)
        assert emp_get.status_code == 403
