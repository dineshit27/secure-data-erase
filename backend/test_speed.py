import time
import httpx

base = "http://127.0.0.1:8000"

tests = [
    ("Tool 1 (Secure Delete)", "/api/delete/validate-path", {"path": r"C:\SecureDel\demo-files\demo_secret.txt"}),
    ("Tool 2 (Browser Cache)", "/api/browser/validate-path", {"path": r"C:\SecureDel-Demo\BrowserCache"}),
    ("Tool 3 (Recent Files)", "/api/recent/validate-path", {"path": r"C:\SecureDel-Demo\RecentFiles\recent-files.json"}),
    ("Tool 4 (Log Scanner)", "/api/logs/validate-path", {"path": r"C:\SecureDel-Demo\Logs"}),
    ("Tool 5 (Secret Scanner)", "/api/secrets/validate-path", {"path": r"C:\SecureDel-Demo\TestRepository"}),
    ("Tool 6 (Temp Cleaner)", "/api/temp/validate-path", {"path": r"C:\SecureDel-Demo\Temp"}),
]

with httpx.Client(base_url=base, timeout=3.0) as client:
    # First generate demo files
    for ep in ["/api/delete/generate-demo", "/api/browser/generate-demo", "/api/recent/generate-demo", 
               "/api/logs/generate-demo", "/api/secrets/generate-demo", "/api/temp/generate-demo"]:
        try:
            client.post(ep)
        except Exception:
            pass

    print("=== TESTING VALIDATION SPEED ===")
    for name, ep, body in tests:
        t0 = time.perf_counter()
        res = client.post(ep, json=body)
        dt = (time.perf_counter() - t0) * 1000
        data = res.json()
        print(f"{name:30}: {dt:6.2f} ms | success={data.get('success')} | exists={data.get('exists')}")
