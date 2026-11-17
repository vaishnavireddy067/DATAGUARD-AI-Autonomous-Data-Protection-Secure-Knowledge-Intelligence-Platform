import requests

BASE_URL = 'http://127.0.0.1:8000/api'

admin_token = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin@dataguard.ai', 'password': 'Admin@123'}).json()['access_token']
headers = {'Authorization': f'Bearer {admin_token}'}

# 1. Upload a document with sensitive PII
content = (
    "SECURITY TESTING MEMO\n"
    "Lead: Vaishnavi\n"
    "Direct Email: vaishnavi@company.com\n"
    "Emergency Phone: +91 9876543210\n"
    "Income Tax PAN: ABCDE1234F\n"
    "Account Reference: Account Number 98765432101234\n"
)
upload_res = requests.post(
    f'{BASE_URL}/documents/upload',
    files={'file': ('protection_test_memo.txt', content.encode('utf-8'), 'text/plain')},
    data={'access_level': 'internal'},
    headers=headers
)
assert upload_res.status_code == 201
doc_id = upload_res.json()['id']
print(f"Uploaded Doc ID: {doc_id}")

# 2. Test MASK Action
print("\n--- Testing MASK Action ---")
mask_res = requests.post(f'{BASE_URL}/documents/{doc_id}/protect', json={'action_type': 'MASK'}, headers=headers)
assert mask_res.status_code == 200
masked_doc = mask_res.json()
print("Masked Text:")
print(masked_doc['protected_text'])
assert "vai***@company.com" in masked_doc['protected_text']
assert "+91 98765*****" in masked_doc['protected_text']
assert "ABC*****4F" in masked_doc['protected_text']
assert "XXXX-XXXX-1234" in masked_doc['protected_text']
assert "vaishnavi@company.com" not in masked_doc['protected_text']
print("PASS: MASK correctly obfuscated email, phone, PAN, and account without raw leaks.")

# 3. Test REDACT Action
print("\n--- Testing REDACT Action ---")
redact_res = requests.post(f'{BASE_URL}/documents/{doc_id}/protect', json={'action_type': 'REDACT'}, headers=headers)
assert redact_res.status_code == 200
redacted_doc = redact_res.json()
print("Redacted Text:")
print(redacted_doc['protected_text'])
assert "[REDACTED_EMAIL]" in redacted_doc['protected_text']
assert "[REDACTED_PHONE]" in redacted_doc['protected_text']
assert "[REDACTED_PAN]" in redacted_doc['protected_text']
assert "[REDACTED_ACCOUNT]" in redacted_doc['protected_text']
print("PASS: REDACT correctly scrubbed all identifiers to [REDACTED] tokens.")

# 4. Test RESTRICT_ACCESS Action
print("\n--- Testing RESTRICT_ACCESS Action ---")
restrict_res = requests.post(f'{BASE_URL}/documents/{doc_id}/protect', json={'action_type': 'RESTRICT_ACCESS', 'access_level': 'restricted'}, headers=headers)
assert restrict_res.status_code == 200
restricted_doc = restrict_res.json()
assert restricted_doc['access_level'] == 'restricted'
print(f"PASS: Access classification successfully restricted to '{restricted_doc['access_level']}'.")

# 5. Verify Database Records in Protection Actions History
print("\n--- Verifying Document History & DB Actions ---")
doc_get = requests.get(f'{BASE_URL}/documents/{doc_id}', headers=headers).json()
actions = doc_get['actions']
print(f"Total protection actions recorded in document history: {len(actions)}")
action_types = [a['action_type'] for a in actions]
assert "MASK" in action_types
assert "REDACT" in action_types
assert "RESTRICT_ACCESS" in action_types
print("PASS: All actions are stored in the database and visible in history.")

# 6. Verify Audit Logs for Protection Actions
print("\n--- Verifying Audit Logs for Protection Actions ---")
audit_logs = requests.get(f'{BASE_URL}/audit-logs', headers=headers).json()
doc_logs = [l for l in audit_logs if f"document:{doc_get['filename']}" in l['resource']]
logged_actions = [l['action'] for l in doc_logs]
print(f"Logged actions for this document: {logged_actions}")
assert "APPLY_MASK" in logged_actions
assert "APPLY_REDACT" in logged_actions
assert "APPLY_RESTRICT_ACCESS" in logged_actions
print("PASS: Audit logs created for all protection actions.")

print("\n>>> ALL PROTECTION ACTIONS VERIFIED AND PASSING! <<<")
