import requests
import json
import os

BASE_URL = 'http://127.0.0.1:8000/api'

# 1. Login
print('--- 1. Testing Login ---')
login_res = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin@dataguard.ai', 'password': 'Admin@123'})
assert login_res.status_code == 200, f'Login failed: {login_res.text}'
token = login_res.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}
print('Login successful. Token acquired.')

# 2. Upload CSV
print('--- 2. Testing File Upload & Extraction ---')
csv_content = 'name,email,mobile,pan,salary\nVaishnavi Anugu,vaishnavi@company.com,+91 9876543210,ABCDE1234F,$145000\nRajesh Kumar,rajesh.k@company.com,+91 9123456789,XYZPK9876Q,$120000\n'
files = {'file': ('audit_test_payroll.csv', csv_content.encode('utf-8'), 'text/csv')}
data = {'access_level': 'confidential'}

upload_res = requests.post(f'{BASE_URL}/documents/upload', files=files, data=data, headers=headers)
assert upload_res.status_code == 201, f'Upload failed: {upload_res.text}'
doc = upload_res.json()
print(f"Document ID: {doc['id']}")
print(f"Filename: {doc['filename']}")
print(f"Storage Path: {doc['storage_path']}")
assert os.path.exists(doc['storage_path']), f"File not saved to disk at {doc['storage_path']}"
print('File successfully verified on disk.')

# 3. Check extraction
print('--- 3. Verifying Extracted Content ---')
assert 'Vaishnavi Anugu' in doc['extracted_text'], 'Real content not extracted'
print('Extracted content verified against uploaded CSV.')

# 4. Check findings
print('--- 4. Verifying Sensitive Findings ---')
findings = doc['findings']
print(f"Total findings categories: {len(findings)}")
for f in findings:
    print(f"  - Type: {f['data_type']}, Count: {f['count']}, Masked: {f['detected_value_masked']}, Risk: {f['risk_level']}")
assert len(findings) >= 3, 'Expected at least 3 sensitive categories'

# 5. Check risk score & explanation
print('--- 5. Verifying Risk Assessment ---')
print(f"Risk Score: {doc['risk_score']}/100")
print(f"Risk Level: {doc['risk_level']}")
print(f"Explanation: {doc['risk_explanation']}")
assert doc['risk_score'] > 40, 'Expected non-zero risk score'

# 6. Check Audit Logs
print('--- 6. Verifying Audit Logs ---')
audit_res = requests.get(f'{BASE_URL}/audit-logs', headers=headers)
assert audit_res.status_code == 200
logs = audit_res.json()
print(f"Recent audit logs count: {len(logs)}")
matching_logs = [l for l in logs if doc['filename'] in l['resource']]
print(f"Audit logs for this document: {len(matching_logs)}")
for l in matching_logs:
    print(f"  - Action: {l['action']}, Resource: {l['resource']}, Result: {l['result']}, Time: {l['timestamp']}")

print('\n>>> ALL REAL WORKFLOW CHECKS PASSED SUCCESSFULLY! <<<')
