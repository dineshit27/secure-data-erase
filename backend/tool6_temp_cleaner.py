"""
Tool 6: Temp File Secure Cleaner
Detects, monitors, and securely overwrites temporary files with sensitive data.
Supports real temporary directory paths, custom folder scanning, and demo directories.
"""

import os
import re
import sys
import stat
import time
import shutil
import tempfile
import uuid
import threading
from pathlib import Path
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Primary Demo & Upload Directories ─────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
DEMO_ROOT = Path("C:/SecureDel-Demo") if os.name == "nt" else BACKEND_DIR / "SecureDel-Demo"
DEMO_TEMP_DIR = DEMO_ROOT / "Temp"
STORAGE_TEMP_UPLOADS = BACKEND_DIR / "storage" / "uploads" / "temp"

def get_demo_temp_dir() -> Path:
    try:
        DEMO_TEMP_DIR.mkdir(parents=True, exist_ok=True)
        return DEMO_TEMP_DIR
    except Exception:
        fallback = BACKEND_DIR / "SecureDel-Demo" / "Temp"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

# ── Temp directories by platform ─────────────────────────────────
def get_temp_dirs() -> List[str]:
    dirs = [tempfile.gettempdir()]
    if sys.platform == "win32":
        extra = [
            os.environ.get("TEMP", ""),
            os.environ.get("TMP", ""),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Temp"),
        ]
    elif sys.platform == "darwin":
        extra = ["/private/tmp", "/var/folders"]
    else:
        extra = ["/tmp", "/var/tmp", "/dev/shm"]

    all_dirs = []
    for d in dirs + extra:
        if d and Path(d).exists():
            all_dirs.append(d)
    return list(dict.fromkeys(all_dirs))

# ── Sensitive patterns to flag inside temp files ──────────────────
SENSITIVE_IN_TEMP = [
    re.compile(r'(?i)(?:password|passwd|pwd)\s*[=:]\s*\S+'),
    re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
    re.compile(r'(?i)bearer\s+[A-Za-z0-9\-._~+/]{20,}'),
    re.compile(r'\beyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b'),
    re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z0-9]{2,}\b'),
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'(?i)(?:api[_\-]?key|secret)\s*[=:]\s*[A-Za-z0-9\-_.]{16,}'),
]

def _classify_temp(name: str) -> str:
    ext = name.split(".")[-1].lower() if "." in name else ""
    if ext in ["tmp", "temp"]:
        return "Temp File"
    if ext in ["bak", "old", "orig"]:
        return "Backup File"
    if ext in ["swp", "swo", "lock"]:
        return "Swap / Lock"
    if ext in ["log", "out", "err"]:
        return "Log File"
    if ext in ["cache", "dat"]:
        return "Cache File"
    return "Temporary Item"

# ── Core Helpers ──────────────────────────────────────────────────
def _secure_wipe(path: str, passes: int = 3) -> bool:
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

def _scan_temp_dir(
    temp_dir: str,
    older_than_minutes: int = 0,
    sensitive_only: bool = False,
    max_size_mb: int = 100
) -> List[Dict]:
    results = []
    cutoff = datetime.now() - timedelta(minutes=older_than_minutes) if older_than_minutes > 0 else None

    try:
        for f in Path(temp_dir).rglob("*"):
            if not f.is_file():
                continue
            try:
                stat_info = f.stat()
                size_mb = stat_info.st_size / (1024 * 1024)
                if size_mb > max_size_mb:
                    continue

                modified = datetime.fromtimestamp(stat_info.st_mtime)
                if cutoff and modified > cutoff:
                    continue

                is_sensitive = False
                if sensitive_only:
                    try:
                        content = f.read_text(encoding="utf-8", errors="ignore")[:65536]
                        is_sensitive = any(p.search(content) for p in SENSITIVE_IN_TEMP)
                    except Exception:
                        pass
                    if not is_sensitive:
                        continue

                results.append({
                    "name": f.name,
                    "path": str(f.resolve()),
                    "size_bytes": stat_info.st_size,
                    "category": _classify_temp(f.name),
                    "modified": modified.isoformat(),
                    "age_minutes": round((datetime.now() - modified).total_seconds() / 60, 1),
                    "sensitive": is_sensitive,
                })
            except Exception:
                continue
    except PermissionError:
        pass

    return results

# ── Pydantic models ───────────────────────────────────────────────
class ValidateTempPathRequest(BaseModel):
    path: str

class ValidateTempPathResponse(BaseModel):
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

class ScanTempRequest(BaseModel):
    directories: Optional[List[str]] = None
    older_than_minutes: int = 0
    sensitive_only: bool = False
    max_size_mb: int = 100
    request_id: Optional[str] = None

class WipeTempRequest(BaseModel):
    directories: Optional[List[str]] = None
    older_than_minutes: int = 0
    sensitive_only: bool = False
    passes: int = 3
    max_size_mb: int = 100
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────

@router.get("/dirs")
def get_temp_directories():
    return {"temp_dirs": get_temp_dirs(), "platform": sys.platform}

@router.post("/validate-path", response_model=ValidateTempPathResponse)
@router.post("/validate", response_model=ValidateTempPathResponse)
def validate_temp_path(req: ValidateTempPathRequest):
    """
    Validates a temp directory path and reads real files from disk.
    """
    raw = req.path.strip().strip('"').strip("'")
    if not raw:
        return ValidateTempPathResponse(
            success=False, exists=False, isDir=False,
            error="INVALID_PATH", message="Please enter a valid directory path."
        )

    p = Path(raw)

    ALLOWED_EXTENSIONS = {".tmp", ".temp", ".bak", ".old", ".swp"}
    ext_lower = p.suffix.lower()
    if ext_lower and ext_lower not in ALLOWED_EXTENSIONS:
        return ValidateTempPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="INVALID_EXTENSION",
            message=f"Invalid file extension '{ext_lower}'. Temp File Eliminator only supports: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not p.exists():
        return ValidateTempPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="PATH_NOT_FOUND", message="The specified temp directory does not exist."
        )

    files_list = []
    total_bytes = 0
    file_count = 0

    if p.is_file():
        try:
            sz = p.stat().st_size
            files_list.append({
                "name": p.name,
                "path": str(p.resolve()),
                "size_bytes": sz,
                "category": _classify_temp(p.name),
                "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
                "age_minutes": 0,
                "sensitive": False,
            })
            total_bytes = sz
            file_count = 1
        except Exception:
            pass
    elif p.is_dir():
        dirs_to_visit = [str(p)]
        visited = 0
        while dirs_to_visit and visited < 1000:
            cur = dirs_to_visit.pop(0)
            try:
                with os.scandir(cur) as it:
                    for entry in it:
                        visited += 1
                        try:
                            if entry.is_dir(follow_symlinks=False):
                                if len(dirs_to_visit) < 20:
                                    dirs_to_visit.append(entry.path)
                            elif entry.is_file(follow_symlinks=False):
                                sz = entry.stat(follow_symlinks=False).st_size
                                total_bytes += sz
                                file_count += 1
                                if len(files_list) < 100:
                                    files_list.append({
                                        "name": entry.name,
                                        "path": entry.path,
                                        "size_bytes": sz,
                                        "category": _classify_temp(entry.name),
                                        "modified": datetime.fromtimestamp(entry.stat(follow_symlinks=False).st_mtime).isoformat(),
                                        "age_minutes": 0,
                                        "sensitive": False,
                                    })
                        except (PermissionError, OSError):
                            pass
            except (PermissionError, OSError):
                pass

    return ValidateTempPathResponse(
        success=True, exists=True, isDir=p.is_dir(), name=p.name,
        path=str(p.resolve()), fileCount=file_count, dirCount=0,
        totalBytes=total_bytes, files=files_list,
        message="Temporary directory validated."
    )

@router.post("/generate-demo")
def generate_demo_temp_files():
    """
    Generates realistic temporary files in C:\\SecureDel-Demo\\Temp\\.
    """
    temp_dir = get_demo_temp_dir()

    demo_files = [
        ("app_cache_session_01.tmp", os.urandom(1024 * 64)),
        ("report_export_draft.bak", b"Draft financial figures and customer metrics.\n" * 120),
        ("installer_debug_trace.log", b"[DEBUG] Temporary setup extraction trace\n" * 80),
        ("browser_chunk_upload.tmp", os.urandom(1024 * 128)),
        ("swap_memory_page.swp", os.urandom(1024 * 256)),
        ("temp_credential_dump.tmp", b"auth_temp_pass=TempAdminPass!99\nuser=staging_test\n"),
        ("system_update_patch.old", os.urandom(1024 * 90)),
        ("editor_recovery_buffer.tmp", b"Unsaved buffer content for demo document.\n" * 50),
    ]

    for filename, data in demo_files:
        fp = temp_dir / filename
        fp.write_bytes(data)

    total_bytes = sum(len(d) for _, d in demo_files)

    return {
        "success": True,
        "path": str(temp_dir.resolve()),
        "name": temp_dir.name,
        "fileCount": len(demo_files),
        "totalBytes": total_bytes,
        "message": "Demo temp files generated on physical disk."
    }

@router.post("/scan")
def scan_temp_files(req: ScanTempRequest):
    """
    Scans temporary directories for files and calculates real disk metrics.
    """
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage=stage,
            endpoint="/api/temp/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    dirs = req.directories or [str(get_demo_temp_dir())]
    all_files = []
    emit("run_start", {"directories": dirs})

    for d in dirs:
        files = _scan_temp_dir(d, req.older_than_minutes, req.sensitive_only, req.max_size_mb)
        all_files.extend(files)

    total_bytes = sum(f["size_bytes"] for f in all_files)
    emit("run_complete", {"files_found": len(all_files), "total_bytes": total_bytes}, status="success")

    return {
        "success": True,
        "directories_scanned": dirs,
        "files_found": len(all_files),
        "total_size_bytes": total_bytes,
        "total_size_mb": round(total_bytes / (1024 * 1024), 2),
        "files": all_files,
    }

@router.post("/wipe")
def wipe_temp_files(req: WipeTempRequest):
    """
    Securely overwrites and cleans temporary files on disk, verifying removal.
    """
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage=stage,
            endpoint="/api/temp/wipe",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    dirs = req.directories or [str(get_demo_temp_dir())]
    targets = []
    for d in dirs:
        files = _scan_temp_dir(d, req.older_than_minutes, req.sensitive_only, req.max_size_mb)
        targets.extend(files)

    emit("run_start", {"files_total": len(targets), "passes": req.passes})

    wiped_count = 0
    failed_count = 0
    wiped_bytes = 0

    for f in targets:
        fp = Path(f["path"])
        if fp.exists():
            sz = f["size_bytes"]
            if _secure_wipe(str(fp), req.passes):
                wiped_count += 1
                wiped_bytes += sz
            else:
                failed_count += 1

    verified = failed_count == 0
    emit(
        "run_complete",
        {"wiped_count": wiped_count, "failed_count": failed_count, "verified": verified},
        status="success" if verified else "error"
    )

    return {
        "success": verified,
        "verified": verified,
        "wiped_files": wiped_count,
        "failed_files": failed_count,
        "wiped_bytes": wiped_bytes,
        "wiped_mb": round(wiped_bytes / (1024 * 1024), 2),
        "passes": req.passes,
        "message": f"Successfully cleaned {wiped_count} temporary files."
    }

@router.post("/upload")
async def upload_temp_file(file: UploadFile = File(...)):
    """
    Upload a temp file to controlled storage.
    """
    upload_id = uuid.uuid4().hex[:12]
    target_dir = STORAGE_TEMP_UPLOADS / upload_id
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = os.path.basename(file.filename or "temp_file.tmp")
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
