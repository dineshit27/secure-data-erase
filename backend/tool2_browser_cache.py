"""
Tool 2: Browser Cache & Cookie Wiper
Detects and securely wipes cache, cookies, sessions for all major browsers.
"""

import os
import sys
import time
import shutil
import stat
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Browser path registry ─────────────────────────────────────────
def get_browser_paths() -> Dict[str, Dict[str, List[str]]]:
    home = Path.home()
    is_win = sys.platform == "win32"
    is_mac = sys.platform == "darwin"

    local  = Path(os.environ.get("LOCALAPPDATA", "")) if is_win else Path()
    roaming = Path(os.environ.get("APPDATA", ""))     if is_win else Path()

    browsers: Dict[str, Dict[str, List[str]]] = {}

    if is_win:
        browsers = {
            "chrome": {
                "cache":   [str(local / "Google/Chrome/User Data/Default/Cache"),
                            str(local / "Google/Chrome/User Data/Default/Code Cache")],
                "cookies": [str(local / "Google/Chrome/User Data/Default/Cookies"),
                            str(local / "Google/Chrome/User Data/Default/Cookies-journal")],
                "sessions":[str(local / "Google/Chrome/User Data/Default/Session Storage"),
                            str(local / "Google/Chrome/User Data/Default/Local Storage")],
            },
            "edge": {
                "cache":   [str(local / "Microsoft/Edge/User Data/Default/Cache")],
                "cookies": [str(local / "Microsoft/Edge/User Data/Default/Cookies")],
                "sessions":[str(local / "Microsoft/Edge/User Data/Default/Session Storage")],
            },
            "brave": {
                "cache":   [str(local / "BraveSoftware/Brave-Browser/User Data/Default/Cache")],
                "cookies": [str(local / "BraveSoftware/Brave-Browser/User Data/Default/Cookies")],
                "sessions":[str(local / "BraveSoftware/Brave-Browser/User Data/Default/Session Storage")],
            },
            "firefox": {
                "cache":   [str(local / "Mozilla/Firefox/Profiles")],   # walk profiles
                "cookies": [str(roaming / "Mozilla/Firefox/Profiles")],
                "sessions":[str(roaming / "Mozilla/Firefox/Profiles")],
            },
        }
    elif is_mac:
        lib = home / "Library"
        browsers = {
            "chrome": {
                "cache":   [str(lib / "Caches/Google/Chrome/Default/Cache")],
                "cookies": [str(lib / "Application Support/Google/Chrome/Default/Cookies")],
                "sessions":[str(lib / "Application Support/Google/Chrome/Default/Session Storage")],
            },
            "firefox": {
                "cache":   [str(lib / "Caches/Firefox/Profiles")],
                "cookies": [str(lib / "Application Support/Firefox/Profiles")],
                "sessions":[str(lib / "Application Support/Firefox/Profiles")],
            },
            "safari": {
                "cache":   [str(lib / "Caches/com.apple.Safari")],
                "cookies": [str(lib / "Cookies")],
                "sessions":[str(lib / "Safari/LocalStorage")],
            },
        }
    else:  # Linux
        browsers = {
            "chrome": {
                "cache":   [str(home / ".cache/google-chrome/Default/Cache"),
                            str(home / ".cache/google-chrome/Default/Code Cache")],
                "cookies": [str(home / ".config/google-chrome/Default/Cookies")],
                "sessions":[str(home / ".config/google-chrome/Default/Session Storage"),
                            str(home / ".config/google-chrome/Default/Local Storage")],
            },
            "chromium": {
                "cache":   [str(home / ".cache/chromium/Default/Cache")],
                "cookies": [str(home / ".config/chromium/Default/Cookies")],
                "sessions":[str(home / ".config/chromium/Default/Session Storage")],
            },
            "brave": {
                "cache":   [str(home / ".cache/BraveSoftware/Brave-Browser/Default/Cache")],
                "cookies": [str(home / ".config/BraveSoftware/Brave-Browser/Default/Cookies")],
                "sessions":[str(home / ".config/BraveSoftware/Brave-Browser/Default/Session Storage")],
            },
            "firefox": {
                "cache":   [str(home / ".cache/mozilla/firefox")],
                "cookies": [str(home / ".mozilla/firefox")],
                "sessions":[str(home / ".mozilla/firefox")],
            },
        }
    return browsers

# ── Secure overwrite helper ───────────────────────────────────────
def _secure_wipe_file(path: str, passes: int = 3) -> bool:
    try:
        size = os.path.getsize(path)
        if size == 0:
            os.remove(path)
            return True
        os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        for _ in range(passes):
            with open(path, "r+b") as f:
                f.seek(0)
                written = 0
                while written < size:
                    chunk = min(65536, size - written)
                    f.write(os.urandom(chunk))
                    written += chunk
                f.flush()
                os.fsync(f.fileno())
        os.remove(path)
        return True
    except Exception:
        return False

def _wipe_path(path: str, passes: int) -> Dict:
    p = Path(path)
    wiped_files, failed_files, total_bytes = 0, 0, 0

    if not p.exists():
        return {"path": path, "exists": False, "wiped": 0, "failed": 0, "bytes": 0}

    if p.is_file():
        size = p.stat().st_size
        ok = _secure_wipe_file(str(p), passes)
        return {"path": path, "exists": True,
                "wiped": 1 if ok else 0, "failed": 0 if ok else 1, "bytes": size}

    if p.is_dir():
        for f in p.rglob("*"):
            if f.is_file():
                size = f.stat().st_size
                total_bytes += size
                if _secure_wipe_file(str(f), passes):
                    wiped_files += 1
                else:
                    failed_files += 1
        try:
            shutil.rmtree(str(p), ignore_errors=True)
        except Exception:
            pass

    return {"path": path, "exists": True,
            "wiped": wiped_files, "failed": failed_files, "bytes": total_bytes}

# ── Pydantic models ───────────────────────────────────────────────
class WipeRequest(BaseModel):
    browsers: List[str] = ["chrome", "firefox", "edge", "brave", "chromium", "safari"]
    wipe_cache: bool = True
    wipe_cookies: bool = True
    wipe_sessions: bool = True
    passes: int = 3
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────
@router.get("/detect")
def detect_browsers():
    """Detect which browsers are installed and their cache locations."""
    registry = get_browser_paths()
    found = {}
    for browser, categories in registry.items():
        detected_paths = {}
        for category, paths in categories.items():
            existing = [p for p in paths if Path(p).exists()]
            if existing:
                detected_paths[category] = existing
        if detected_paths:
            found[browser] = detected_paths
    return {"detected_browsers": found, "platform": sys.platform}

@router.post("/wipe")
def wipe_browser_data(req: WipeRequest):
    """Securely wipe cache, cookies, and sessions for selected browsers."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="browser-cleaner",
            stage=stage,
            endpoint="/api/browser/wipe",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    registry = get_browser_paths()
    report = {}
    grand_total = {"wiped_files": 0, "failed_files": 0, "bytes_wiped": 0}
    emit("run_start", {"browsers": req.browsers, "passes": req.passes})

    for browser in req.browsers:
        if browser not in registry:
            emit("browser_skipped", {"browser": browser, "reason": "not_detected"})
            continue
        emit("browser_start", {"browser": browser})
        browser_result = {}
        categories = registry[browser]

        if req.wipe_cache and "cache" in categories:
            emit("category_start", {"browser": browser, "category": "cache", "targets": len(categories["cache"])})
            results = [_wipe_path(p, req.passes) for p in categories["cache"]]
            browser_result["cache"] = results
            emit("category_complete", {"browser": browser, "category": "cache", "results": len(results)})

        if req.wipe_cookies and "cookies" in categories:
            emit("category_start", {"browser": browser, "category": "cookies", "targets": len(categories["cookies"])})
            results = [_wipe_path(p, req.passes) for p in categories["cookies"]]
            browser_result["cookies"] = results
            emit("category_complete", {"browser": browser, "category": "cookies", "results": len(results)})

        if req.wipe_sessions and "sessions" in categories:
            emit("category_start", {"browser": browser, "category": "sessions", "targets": len(categories["sessions"])})
            results = [_wipe_path(p, req.passes) for p in categories["sessions"]]
            browser_result["sessions"] = results
            emit("category_complete", {"browser": browser, "category": "sessions", "results": len(results)})

        # Aggregate
        for cat_results in browser_result.values():
            for r in cat_results:
                grand_total["wiped_files"] += r.get("wiped", 0)
                grand_total["failed_files"] += r.get("failed", 0)
                grand_total["bytes_wiped"]  += r.get("bytes", 0)

        report[browser] = browser_result

        emit(
            "browser_complete",
            {
                "browser": browser,
                "wiped_files": sum(r.get("wiped", 0) for cat in browser_result.values() for r in cat),
                "failed_files": sum(r.get("failed", 0) for cat in browser_result.values() for r in cat),
            },
        )

    emit(
        "run_complete",
        {"summary": grand_total, "browsers_processed": list(report.keys())},
        status="success" if grand_total["failed_files"] == 0 else "error",
    )

    return {
        "summary": grand_total,
        "browsers_processed": list(report.keys()),
        "details": report,
        "passes_used": req.passes,
    }
