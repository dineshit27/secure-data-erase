import httpx
import sys

base = "http://127.0.0.1:8000"

tests = [
    ("Tool 1 (Secure File Deletion)", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.txt"}),
    ("Tool 2 (Browser Cache Wiper)", "/api/browser/validate-path", {"path": r"C:\SecureDel-Demo\BrowserCache"}),
    ("Tool 3 (Recent Files Cleaner)", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.json"}),
    ("Tool 4 (Log Scanner)", "/api/logs/validate-path", {"path": r"C:\SecureDel-Demo\Logs"}),
    ("Tool 5 (Secret Leak Detector)", "/api/secrets/validate-path", {"path": r"C:\SecureDel-Demo\TestRepository"}),
    ("Tool 6 (Temp File Cleaner)", "/api/temp/validate-path", {"path": r"C:\SecureDel-Demo\Temp"}),
]

print("=" * 60)
print("VERIFYING VALIDATE BUTTON ENDPOINTS (REAL HTTP API)")
print("=" * 60)

# Generate demo data first so physical test files exist on disk
httpx.post(f"{base}/api/delete/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/browser/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/recent/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/logs/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/secrets/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/temp/generate-demo", timeout=5.0)

all_passed = True

print("\n--- 1. VALID PATH TESTS ---")
for name, endpoint, payload in tests:
    try:
        resp = httpx.post(f"{base}{endpoint}", json=payload, timeout=5.0)
        data = resp.json()
        success = data.get("success") and data.get("exists")
        if not success:
            all_passed = False
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {name}")
        print(f"       Endpoint: {endpoint}")
        print(f"       Target:   {payload['path']}")
        print(f"       Exists:   {data.get('exists')} | Name: {data.get('name')}")
        if "fileCount" in data:
            print(f"       Files:    {data.get('fileCount')} | Total Bytes: {data.get('totalBytes')}")
        elif "size" in data:
            print(f"       Size:     {data.get('size')} bytes")
        print()
    except Exception as e:
        print(f"[FAIL] {name} -> Exception: {e}")
        all_passed = False

print("\n--- 2. NON-EXISTENT PATH TESTS ---")
for name, endpoint, _ in tests:
    try:
        fake_path = r"C:\NonExistent_FakeDirectory_9999\missing_file.xyz"
        resp = httpx.post(f"{base}{endpoint}", json={"path": fake_path}, timeout=5.0)
        data = resp.json()
        correctly_rejected = (data.get("success") is False or data.get("exists") is False)
        if not correctly_rejected:
            all_passed = False
        status = "[PASS]" if correctly_rejected else "[FAIL]"
        print(f"{status} {name} correctly rejected missing path (error={data.get('error')})")
    except Exception as e:
        print(f"[FAIL] {name} -> Exception: {e}")
        all_passed = False

print("\n" + "=" * 60)
if all_passed:
    print("ALL VALIDATION BUTTONS AND ENDPOINTS VERIFIED WORKING 100%!")
else:
    print("SOME VALIDATION TESTS FAILED.")
print("=" * 60)
