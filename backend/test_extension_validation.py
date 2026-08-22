import httpx
import sys

base = "http://127.0.0.1:8000"

print("=" * 65)
print("SECUREDEL: COMPREHENSIVE EXTENSION VALIDATION TEST SUITE")
print("=" * 65)

# Generate demo files so physical files exist
print("Generating demo files...")
httpx.post(f"{base}/api/delete/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/browser/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/recent/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/logs/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/secrets/generate-demo", timeout=5.0)
httpx.post(f"{base}/api/temp/generate-demo", timeout=5.0)

all_passed = True

# 1. Valid paths (including uppercase extensions)
valid_tests = [
    ("Tool 1 (Secure File Wiper - .txt)", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.txt"}),
    ("Tool 1 (Secure File Wiper - .TXT case check)", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.TXT"}),
    ("Tool 2 (Browser Cache - Dir)", "/api/browser/validate-path", {"path": r"C:\SecureDel-Demo\BrowserCache"}),
    ("Tool 3 (Recent Files - .json)", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.json"}),
    ("Tool 3 (Recent Files - .JSON)", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.JSON"}),
    ("Tool 4 (Log Scanner - Dir)", "/api/logs/validate-path", {"path": r"C:\SecureDel-Demo\Logs"}),
    ("Tool 5 (Secret Scanner - Dir)", "/api/secrets/validate-path", {"path": r"C:\SecureDel-Demo\TestRepository"}),
    ("Tool 6 (Temp Cleaner - Dir)", "/api/temp/validate-path", {"path": r"C:\SecureDel-Demo\Temp"}),
]

print("\n--- 1. VALID PATH TESTS ---")
for name, endpoint, payload in valid_tests:
    try:
        resp = httpx.post(f"{base}{endpoint}", json=payload, timeout=5.0)
        data = resp.json()
        success = data.get("success") and data.get("exists")
        if not success:
            all_passed = False
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {name}: success={data.get('success')}, exists={data.get('exists')}")
    except Exception as e:
        print(f"[FAIL] {name} -> Exception: {e}")
        all_passed = False

# 2. Invalid Extension Tests (Should be rejected with INVALID_EXTENSION)
invalid_ext_tests = [
    ("Tool 1: Reject .pdf", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.pdf"}),
    ("Tool 1: Reject .log", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.log"}),
    ("Tool 2: Reject .pdf", "/api/browser/validate-path", {"path": r"C:\SecureDel-Demo\BrowserCache\test.pdf"}),
    ("Tool 3: Reject .txt", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.txt"}),
    ("Tool 3: Reject .pdf", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.pdf"}),
    ("Tool 4: Reject .pdf", "/api/logs/validate-path", {"path": r"C:\SecureDel-Demo\Logs\test.pdf"}),
    ("Tool 4: Reject .sqlite", "/api/logs/validate-path", {"path": r"C:\SecureDel-Demo\Logs\test.sqlite"}),
    ("Tool 5: Reject .pdf", "/api/secrets/validate-path", {"path": r"C:\SecureDel-Demo\TestRepository\document.pdf"}),
    ("Tool 5: Reject .mp4", "/api/secrets/validate-path", {"path": r"C:\SecureDel-Demo\TestRepository\video.mp4"}),
    ("Tool 6: Reject .pdf", "/api/temp/validate-path", {"path": r"C:\SecureDel-Demo\Temp\report.pdf"}),
    ("Tool 6: Reject .log", "/api/temp/validate-path", {"path": r"C:\SecureDel-Demo\Temp\app.log"}),
]

print("\n--- 2. INVALID EXTENSION TESTS ---")
for name, endpoint, payload in invalid_ext_tests:
    try:
        resp = httpx.post(f"{base}{endpoint}", json=payload, timeout=5.0)
        data = resp.json()
        correctly_rejected = (data.get("success") is False and data.get("error") == "INVALID_EXTENSION")
        if not correctly_rejected:
            all_passed = False
        status = "[PASS]" if correctly_rejected else "[FAIL]"
        print(f"{status} {name} -> error={data.get('error')}, message={data.get('message')}")
    except Exception as e:
        print(f"[FAIL] {name} -> Exception: {e}")
        all_passed = False

print("\n" + "=" * 65)
if all_passed:
    print("ALL TESTS PASSED! EXTENSION VALIDATION FULLY VERIFIED.")
else:
    print("SOME TESTS FAILED.")
print("=" * 65)
