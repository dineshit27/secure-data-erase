"""
Tool 2: Browser Cache & Cookie Wiper
Detects and securely wipes cache, cookies, sessions for all major browsers
as well as custom cache directory paths and demo test directories.
"""

import os
import sys
import time
import shutil
import stat
import uuid
from pathlib import Path
from typing import List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Primary Demo & Upload Directories ─────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
DEMO_ROOT = Path("C:/SecureDel-Demo") if os.name == "nt" else BACKEND_DIR / "SecureDel-Demo"
DEMO_CACHE_DIR = DEMO_ROOT / "BrowserCache"
STORAGE_CACHE_UPLOADS = BACKEND_DIR / "storage" / "uploads" / "cache"

def get_demo_cache_dir() -> Path:
    try:
        DEMO_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        return DEMO_CACHE_DIR
    except Exception:
        fallback = BACKEND_DIR / "SecureDel-Demo" / "BrowserCache"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

# ── Browser path registry ─────────────────────────────────────────
def get_browser_paths() -> Dict[str, Dict[str, List[str]]]:
    home = Path.home()
    is_win = sys.platform == "win32"
    is_mac = sys.platform == "darwin"

    local = Path(os.environ.get("LOCALAPPDATA", "")) if is_win else Path()
    roaming = Path(os.environ.get("APPDATA", "")) if is_win else Path()

    browsers: Dict[str, Dict[str, List[str]]] = {}

    if is_win:
        browsers = {
            "chrome": {
                "cache": [str(local / "Google/Chrome/User Data/Default/Cache"),
                          str(local / "Google/Chrome/User Data/Default/Code Cache")],
                "cookies": [str(local / "Google/Chrome/User Data/Default/Cookies"),
                            str(local / "Google/Chrome/User Data/Default/Cookies-journal")],
                "sessions": [str(local / "Google/Chrome/User Data/Default/Session Storage"),
                             str(local / "Google/Chrome/User Data/Default/Local Storage")],
            },
            "edge": {
                "cache": [str(local / "Microsoft/Edge/User Data/Default/Cache")],
                "cookies": [str(local / "Microsoft/Edge/User Data/Default/Cookies")],
                "sessions": [str(local / "Microsoft/Edge/User Data/Default/Session Storage")],
            },
            "brave": {
                "cache": [str(local / "BraveSoftware/Brave-Browser/User Data/Default/Cache")],
                "cookies": [str(local / "BraveSoftware/Brave-Browser/User Data/Default/Cookies")],
                "sessions": [str(local / "BraveSoftware/Brave-Browser/User Data/Default/Session Storage")],
            },
            "firefox": {
                "cache": [str(local / "Mozilla/Firefox/Profiles")],
                "cookies": [str(roaming / "Mozilla/Firefox/Profiles")],
                "sessions": [str(roaming / "Mozilla/Firefox/Profiles")],
            },
        }
    elif is_mac:
        lib = home / "Library"
        browsers = {
            "chrome": {
                "cache": [str(lib / "Caches/Google/Chrome/Default/Cache")],
                "cookies": [str(lib / "Application Support/Google/Chrome/Default/Cookies")],
                "sessions": [str(lib / "Application Support/Google/Chrome/Default/Session Storage")],
            },
            "firefox": {
                "cache": [str(lib / "Caches/Firefox/Profiles")],
                "cookies": [str(lib / "Application Support/Firefox/Profiles")],
                "sessions": [str(lib / "Application Support/Firefox/Profiles")],
            },
            "safari": {
                "cache": [str(lib / "Caches/com.apple.Safari")],
                "cookies": [str(lib / "Cookies")],
                "sessions": [str(lib / "Safari/LocalStorage")],
            },
        }
    else:  # Linux
        browsers = {
            "chrome": {
                "cache": [str(home / ".cache/google-chrome/Default/Cache"),
                          str(home / ".cache/google-chrome/Default/Code Cache")],
                "cookies": [str(home / ".config/google-chrome/Default/Cookies")],
                "sessions": [str(home / ".config/google-chrome/Default/Session Storage"),
                             str(home / ".config/google-chrome/Default/Local Storage")],
            },
            "chromium": {
                "cache": [str(home / ".cache/chromium/Default/Cache")],
                "cookies": [str(home / ".config/chromium/Default/Cookies")],
                "sessions": [str(home / ".config/chromium/Default/Session Storage")],
            },
            "brave": {
                "cache": [str(home / ".cache/BraveSoftware/Brave-Browser/Default/Cache")],
                "cookies": [str(home / ".config/BraveSoftware/Brave-Browser/Default/Cookies")],
                "sessions": [str(home / ".config/BraveSoftware/Brave-Browser/Default/Session Storage")],
            },
            "firefox": {
                "cache": [str(home / ".cache/mozilla/firefox")],
                "cookies": [str(home / ".mozilla/firefox")],
                "sessions": [str(home / ".mozilla/firefox")],
            },
        }
    return browsers

# ── Secure Overwrite Helper ───────────────────────────────────────
def _secure_wipe_file(path: str, passes: int = 3) -> bool:
    try:
        size = os.path.getsize(path)
        if size == 0:
            os.remove(path)
            return True
        try:
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass
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
        for f in list(p.rglob("*")):
            if f.is_file():
                try:
                    size = f.stat().st_size
                    total_bytes += size
                    if _secure_wipe_file(str(f), passes):
                        wiped_files += 1
                    else:
                        failed_files += 1
                except Exception:
                    failed_files += 1
        try:
            shutil.rmtree(str(p), ignore_errors=True)
        except Exception:
            pass

    return {"path": path, "exists": True,
            "wiped": wiped_files, "failed": failed_files, "bytes": total_bytes}

# ── Pydantic models ───────────────────────────────────────────────
class ValidateCachePathRequest(BaseModel):
    path: str

class ValidateCachePathResponse(BaseModel):
    success: bool
    exists: bool
    isDir: bool
    name: Optional[str] = None
    path: Optional[str] = None
    fileCount: int = 0
    dirCount: int = 0
    totalBytes: int = 0
    files: List[Dict[str, Any]] = []
    error: Optional[str] = None
    message: Optional[str] = None

class WipeCachePathRequest(BaseModel):
    path: str
    passes: int = 3
    request_id: Optional[str] = None

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

@router.post("/validate-path", response_model=ValidateCachePathResponse)
@router.post("/validate", response_model=ValidateCachePathResponse)
def validate_cache_path(req: ValidateCachePathRequest):
    """
    Validates a cache directory path and returns real filesystem stats.
    """
    raw = req.path.strip().strip('"').strip("'")
    if not raw:
        return ValidateCachePathResponse(
            success=False, exists=False, isDir=False,
            error="INVALID_PATH", message="Please enter a valid directory path."
        )

    p = Path(raw)

    ALLOWED_EXTENSIONS = {".cache", ".dat", ".sqlite"}
    ext_lower = p.suffix.lower()
    if ext_lower and ext_lower not in ALLOWED_EXTENSIONS:
        return ValidateCachePathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="INVALID_EXTENSION",
            message=f"Invalid file extension '{ext_lower}'. Browser Cache Wiper only supports: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not p.exists():
        return ValidateCachePathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="PATH_NOT_FOUND", message="The specified cache directory does not exist."
        )

    if not p.is_dir():
        # If user passed a single cache file
        size = p.stat().st_size
        return ValidateCachePathResponse(
            success=True, exists=True, isDir=False, name=p.name,
            path=str(p.resolve()), fileCount=1, dirCount=0, totalBytes=size,
            files=[{"name": p.name, "path": str(p.resolve()), "size": size}],
            message="Single cache file found."
        )

    files_list = []
    dir_count = 0
    total_bytes = 0
    canonical_path = str(p.resolve())

    dirs_to_visit = [str(p)]
    visited = 0
    max_scan = 2000

    while dirs_to_visit and visited < max_scan:
        current_dir = dirs_to_visit.pop(0)
        try:
            with os.scandir(current_dir) as it:
                for entry in it:
                    visited += 1
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            dir_count += 1
                            if len(dirs_to_visit) < 50:
                                dirs_to_visit.append(entry.path)
                        elif entry.is_file(follow_symlinks=False):
                            sz = entry.stat(follow_symlinks=False).st_size
                            total_bytes += sz
                            if len(files_list) < 100:
                                rel = os.path.relpath(entry.path, str(p))
                                files_list.append({
                                    "name": entry.name,
                                    "relative_path": rel,
                                    "path": entry.path,
                                    "size": sz,
                                })
                    except (PermissionError, OSError):
                        pass
        except (PermissionError, OSError):
            pass

    return ValidateCachePathResponse(
        success=True, exists=True, isDir=True, name=p.name,
        path=canonical_path, fileCount=len(files_list) if visited >= max_scan and len(files_list) > 0 else (visited - dir_count),
        dirCount=dir_count, totalBytes=total_bytes, files=files_list[:100]
    )

@router.post("/generate-demo")
def generate_demo_cache():
    """
    Generates realistic test browser cache files in C:\\SecureDel-Demo\\BrowserCache\\.
    """
    cache_dir = get_demo_cache_dir()
    subdirs = ["html", "css", "images", "sessions", "media"]
    for sub in subdirs:
        (cache_dir / sub).mkdir(parents=True, exist_ok=True)

    demo_files = [
        ("html/cached_index.html", b"<html><body><h1>Cached Dashboard</h1><p>Demo cache entry</p></body></html>" * 50),
        ("html/cached_profile.html", b"<html><body><h1>User Profile</h1><p>Cached session data</p></body></html>" * 40),
        ("css/bundle.min.css", b"body{margin:0;font-family:sans-serif;} .header{background:#0f172a;}" * 100),
        ("css/theme_dark.css", b":root{--bg:#090d16;--primary:#00ffcc;} .glow{filter:blur(4px);}" * 80),
        ("images/logo_cache.dat", os.urandom(1024 * 18)),
        ("images/avatar_thumb.dat", os.urandom(1024 * 12)),
        ("images/banner_bg.dat", os.urandom(1024 * 45)),
        ("sessions/session_token.tmp", b"session_id=demo_sess_89437291&user=demo_tester&expires=2026-12-31"),
        ("sessions/local_storage.json", b'{"theme":"dark","last_login":"2026-08-14T10:00:00Z","cart_items":3}'),
        ("media/cached_audio_chunk.dat", os.urandom(1024 * 30)),
    ]

    for rel_path, data in demo_files:
        f_path = cache_dir / rel_path
        f_path.write_bytes(data)

    total_bytes = sum(len(d) for _, d in demo_files)

    return {
        "success": True,
        "path": str(cache_dir.resolve()),
        "name": cache_dir.name,
        "fileCount": len(demo_files),
        "dirCount": len(subdirs),
        "totalBytes": total_bytes,
        "message": "Demo browser cache generated on real filesystem."
    }

@router.post("/wipe-path")
def wipe_custom_cache_path(req: WipeCachePathRequest):
    """
    Securely wipes the specified cache directory path and verifies removal.
    """
    raw = req.path.strip().strip('"').strip("'")
    p = Path(raw)
    if not p.exists():
        raise HTTPException(404, "Directory or file does not exist.")

    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="browser-cleaner",
            stage=stage,
            endpoint="/api/browser/wipe-path",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    emit("run_start", {"path": str(p), "passes": req.passes})

    # Count files before
    files_before = [f for f in p.rglob("*") if f.is_file()] if p.is_dir() else ([p] if p.is_file() else [])
    total_files = len(files_before)
    total_bytes = sum(f.stat().st_size for f in files_before if f.exists())

    result = _wipe_path(str(p), req.passes)

    # Verification: check if files are gone
    remaining = [f for f in p.rglob("*") if f.is_file()] if p.exists() and p.is_dir() else ([p] if p.exists() else [])
    verified = len(remaining) == 0

    emit(
        "run_complete",
        {
            "path": str(p),
            "wiped_files": result.get("wiped", 0),
            "failed_files": result.get("failed", 0),
            "verified": verified,
            "remaining": len(remaining),
        },
        status="success" if verified else "error",
    )

    return {
        "success": verified,
        "verified": verified,
        "path": str(p),
        "total_files_before": total_files,
        "wiped_files": result.get("wiped", 0),
        "failed_files": len(remaining),
        "bytes_wiped": total_bytes,
        "passes": req.passes,
        "remaining_files": len(remaining),
    }

@router.post("/upload")
async def upload_cache_file(file: UploadFile = File(...)):
    """
    Upload a cache file copy into controlled storage.
    """
    upload_id = uuid.uuid4().hex[:12]
    target_dir = STORAGE_CACHE_UPLOADS / upload_id
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = os.path.basename(file.filename or "cache.dat")
    target_path = target_dir / filename

    with open(target_path, "wb") as f:
        while chunk := await file.read(65536):
            f.write(chunk)

    size = target_path.stat().st_size
    return {
        "success": True,
        "upload_id": upload_id,
        "name": filename,
        "path": str(target_path.resolve()),
        "size": size,
    }

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
            results = [_wipe_path(p, req.passes) for p in categories["cache"]]
            browser_result["cache"] = results

        if req.wipe_cookies and "cookies" in categories:
            results = [_wipe_path(p, req.passes) for p in categories["cookies"]]
            browser_result["cookies"] = results

        if req.wipe_sessions and "sessions" in categories:
            results = [_wipe_path(p, req.passes) for p in categories["sessions"]]
            browser_result["sessions"] = results

        for cat_results in browser_result.values():
            for r in cat_results:
                grand_total["wiped_files"] += r.get("wiped", 0)
                grand_total["failed_files"] += r.get("failed", 0)
                grand_total["bytes_wiped"] += r.get("bytes", 0)

        report[browser] = browser_result

    verified = grand_total["failed_files"] == 0
    emit(
        "run_complete",
        {"summary": grand_total, "browsers_processed": list(report.keys())},
        status="success" if verified else "error",
    )

    return {
        "success": verified,
        "verified": verified,
        "summary": grand_total,
        "browsers_processed": list(report.keys()),
        "details": report,
        "passes_used": req.passes,
    }
