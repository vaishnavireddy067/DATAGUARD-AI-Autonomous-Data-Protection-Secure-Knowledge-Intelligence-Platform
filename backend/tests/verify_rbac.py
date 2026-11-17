import requests

BASE_URL = 'http://127.0.0.1:8000/api'

# 1. Login as all 3 roles
admin_token = requests.post(f'{BASE_URL}/auth/login', json={'email': 'admin@dataguard.ai', 'password': 'Admin@123'}).json()['access_token']
manager_token = requests.post(f'{BASE_URL}/auth/login', json={'email': 'manager@dataguard.ai', 'password': 'Manager@123'}).json()['access_token']
emp_token = requests.post(f'{BASE_URL}/auth/login', json={'email': 'employee@dataguard.ai', 'password': 'Employee@123'}).json()['access_token']

admin_headers = {'Authorization': f'Bearer {admin_token}'}
manager_headers = {'Authorization': f'Bearer {manager_token}'}
emp_headers = {'Authorization': f'Bearer {emp_token}'}

print("=== RBAC Test 1: Self-Promotion / Role Modification ===")
# Try to update role using Employee token
emp_change_res = requests.put(f'{BASE_URL}/users/3/role', json={'role': 'admin'}, headers=emp_headers)
print(f"Employee trying to promote self to Admin: Status {emp_change_res.status_code}")
assert emp_change_res.status_code == 403, f"Expected 403 Forbidden, got {emp_change_res.status_code}"
print("PASS: Employee blocked from promoting self (HTTP 403 Forbidden).")

# Try to list users using Employee token
emp_users_res = requests.get(f'{BASE_URL}/users', headers=emp_headers)
assert emp_users_res.status_code == 403
print("PASS: Employee blocked from listing user directory (HTTP 403 Forbidden).")

print("\n=== RBAC Test 2: Upload Documents at Each Classification Level ===")
# Admin uploads a Restricted document
restricted_upload = requests.post(
    f'{BASE_URL}/documents/upload',
    files={'file': ('board_secret.txt', b'Top Secret Board Strategy', 'text/plain')},
    data={'access_level': 'restricted'},
    headers=admin_headers
)
assert restricted_upload.status_code == 201
restricted_id = restricted_upload.json()['id']
print(f"Created Restricted Doc ID: {restricted_id}")

# Admin uploads a Confidential document
confidential_upload = requests.post(
    f'{BASE_URL}/documents/upload',
    files={'file': ('dept_payroll.txt', b'Department Payroll Data', 'text/plain')},
    data={'access_level': 'confidential'},
    headers=admin_headers
)
assert confidential_upload.status_code == 201
confidential_id = confidential_upload.json()['id']
print(f"Created Confidential Doc ID: {confidential_id}")

# Admin uploads an Internal document
internal_upload = requests.post(
    f'{BASE_URL}/documents/upload',
    files={'file': ('company_guidelines.txt', b'General Company Guidelines', 'text/plain')},
    data={'access_level': 'internal'},
    headers=admin_headers
)
assert internal_upload.status_code == 201
internal_id = internal_upload.json()['id']
print(f"Created Internal Doc ID: {internal_id}")

# Admin uploads a Public document
public_upload = requests.post(
    f'{BASE_URL}/documents/upload',
    files={'file': ('public_press_release.txt', b'Public Press Release 2026', 'text/plain')},
    data={'access_level': 'public'},
    headers=admin_headers
)
assert public_upload.status_code == 201
public_id = public_upload.json()['id']
print(f"Created Public Doc ID: {public_id}")

print("\n=== RBAC Test 3: Document Access Checks ===")
# Employee tests:
print("Testing Employee Access:")
res_emp_pub = requests.get(f'{BASE_URL}/documents/{public_id}', headers=emp_headers)
assert res_emp_pub.status_code == 200, f"Expected 200, got {res_emp_pub.status_code}"
print("  - Employee accessing Public: ALLOWED (200)")

res_emp_int = requests.get(f'{BASE_URL}/documents/{internal_id}', headers=emp_headers)
assert res_emp_int.status_code == 200, f"Expected 200, got {res_emp_int.status_code}"
print("  - Employee accessing Internal: ALLOWED (200)")

res_emp_conf = requests.get(f'{BASE_URL}/documents/{confidential_id}', headers=emp_headers)
assert res_emp_conf.status_code == 403, f"Expected 403, got {res_emp_conf.status_code}"
print("  - Employee accessing Confidential: BLOCKED (403 Forbidden)")

res_emp_rest = requests.get(f'{BASE_URL}/documents/{restricted_id}', headers=emp_headers)
assert res_emp_rest.status_code == 403, f"Expected 403, got {res_emp_rest.status_code}"
print("  - Employee accessing Restricted: BLOCKED (403 Forbidden)")

# Manager tests:
print("\nTesting Manager Access:")
res_mgr_conf = requests.get(f'{BASE_URL}/documents/{confidential_id}', headers=manager_headers)
assert res_mgr_conf.status_code == 200, f"Expected 200, got {res_mgr_conf.status_code}"
print("  - Manager accessing Confidential: ALLOWED (200)")

res_mgr_rest = requests.get(f'{BASE_URL}/documents/{restricted_id}', headers=manager_headers)
assert res_mgr_rest.status_code == 403, f"Expected 403, got {res_mgr_rest.status_code}"
print("  - Manager accessing Restricted: BLOCKED (403 Forbidden)")

# Admin tests:
print("\nTesting Admin Access:")
res_adm_rest = requests.get(f'{BASE_URL}/documents/{restricted_id}', headers=admin_headers)
assert res_adm_rest.status_code == 200, f"Expected 200, got {res_adm_rest.status_code}"
print("  - Admin accessing Restricted: ALLOWED (200)")

print("\n>>> ALL RBAC SECURITY BOUNDARIES VERIFIED AND PASSING! <<<")
