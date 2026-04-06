"""
Tool 6: Temp File Secure Cleaner
Detects, monitors, and securely overwrites temporary files with sensitive data.
"""

import os
import re
import sys
import stat
import time
import tempfile
import threading
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Temp directories by platform ─────────────────────────────────
def get_temp_dirs() -> List[str]:
    dirs = [tempfile.gettempdir()]

    if sys.platform == "win32":
        extra = [
            os.environ.get("TEMP", ""),
            os.environ.get("TMP", ""),
            os.path.join(os.environ.get("LOCALAPPDATA", ""), "Temp"),
            r"C:\Windows\Temp",
        ]
    elif sys.platform == "darwin":
        extra = ["/private/tmp", "/var/folders"]
    else:
        extra = ["/tmp", "/var/tmp", "/dev/shm"]

    all_dirs = []
    for d in dirs + extra:
        if d and Path(d).exists():
            all_dirs.append(d)
    return list(dict.fromkeys(all_dirs))  # deduplicate, preserve order

# ── Sensitive patterns to flag inside temp files ──────────────────
SENSITIVE_IN_TEMP = [
    re.compile(r'(?i)(password|passwd|pwd)\s*[=:]\s*\S+'),
    re.compile(r'AKIA[0-9A-Z]{16}'),
    re.compile(r'(?i)bearer\s+[A-Za-z0-9\-._~+/]{20,}'),
    re.compile(r'eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+'),
    re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z0-9]{2,}\b'),
    re.compile(r'-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'(?i)(api[_\-]?key|secret)\s*[=:]\s*[A-Za-z0-9\-_.]{16,}'),
]

# ── Background monitor state ──────────────────────────────────────
_monitor_thread: Optional[threading.Thread] = None
_monitor_running = False
_monitor_log: List[Dict] = []

# ── Core helpers ──────────────────────────────────────────────────
def _secure_wipe(path: str, passes: int = 3) -> bool:
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

def _contains_sensitive(path: str) -> bool:
    try:
        if os.path.getsize(path) > 10 * 1024 * 1024:  # skip >10MB
            return False
        content = Path(path).read_text(encoding="utf-8", errors="replace")
        return any(p.search(content) for p in SENSITIVE_IN_TEMP)
    except Exception:
        return False

def _is_binary(path: str) -> bool:
    try:
        with open(path, "rb") as f:
            chunk = f.read(1024)
        return b'\x00' in chunk
    except Exception:
        return True

def _scan_temp_dir(temp_dir: str, older_than_minutes: int = 0,
                   sensitive_only: bool = False, max_size_mb: int = 100
                   ) -> List[Dict]:
    """List temp files matching criteria."""
    results = []
    cutoff = datetime.now() - timedelta(minutes=older_than_minutes) \
             if older_than_minutes > 0 else None

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
                    if _is_binary(str(f)):
                        continue
                    is_sensitive = _contains_sensitive(str(f))
                    if not is_sensitive:
                        continue

                results.append({
                    "path": str(f),
                    "size_bytes": stat_info.st_size,
                    "modified": modified.isoformat(),
                    "age_minutes": round((datetime.now() - modified).total_seconds() / 60, 1),
                    "sensitive": is_sensitive,
                })
            except Exception:
                continue
    except PermissionError:
        pass

    return results

def _monitor_loop(interval_seconds: int, auto_wipe: bool, passes: int):
    """Background thread: periodically scan and optionally wipe new temp files."""
    global _monitor_running, _monitor_log
    while _monitor_running:
        for temp_dir in get_temp_dirs():
            try:
                files = _scan_temp_dir(temp_dir, older_than_minutes=0,
                                       sensitive_only=True)
                for f in files:
                    entry = {
                        "timestamp": datetime.now().isoformat(),
                        "path": f["path"],
                        "size_bytes": f["size_bytes"],
                        "action": "detected",
                    }
                    if auto_wipe:
                        ok = _secure_wipe(f["path"], passes)
                        entry["action"] = "wiped" if ok else "wipe_failed"
                    _monitor_log.append(entry)
                    # Keep log bounded
                    if len(_monitor_log) > 1000:
                        _monitor_log = _monitor_log[-500:]
            except Exception:
                pass
        time.sleep(interval_seconds)

# ── Pydantic models ───────────────────────────────────────────────
class ScanTempRequest(BaseModel):
    directories: Optional[List[str]] = None   # None = auto-detect
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

class MonitorRequest(BaseModel):
    start: bool = True
    auto_wipe: bool = False
    interval_seconds: int = 30
    passes: int = 3
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────
@router.get("/dirs")
def get_temp_directories():
    """Get temp directories detected on this system."""
    return {"temp_dirs": get_temp_dirs(), "platform": sys.platform}

@router.post("/scan")
def scan_temp_files(req: ScanTempRequest):
    """Scan temp directories and list files (optionally only sensitive ones)."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage=stage,
            endpoint="/api/temp/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    dirs = req.directories or get_temp_dirs()
    all_files = []
    emit("run_start", {"directories": dirs, "sensitive_only": req.sensitive_only})
    for d in dirs:
        emit("directory_start", {"directory": d})
        files = _scan_temp_dir(d, req.older_than_minutes, req.sensitive_only, req.max_size_mb)
        all_files.extend(files)
        emit("directory_complete", {"directory": d, "files_found": len(files)})

    total_bytes = sum(f["size_bytes"] for f in all_files)
    emit(
        "run_complete",
        {"files_found": len(all_files), "total_size_bytes": total_bytes},
        status="success",
    )
    return {
        "directories_scanned": dirs,
        "files_found": len(all_files),
        "total_size_bytes": total_bytes,
        "total_size_mb": round(total_bytes / (1024 * 1024), 2),
        "files": all_files,
    }

@router.post("/wipe")
def wipe_temp_files(req: WipeTempRequest):
    """Securely wipe temp files matching criteria."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage=stage,
            endpoint="/api/temp/wipe",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    dirs = req.directories or get_temp_dirs()
    targets = []
    emit("run_start", {"directories": dirs, "passes": req.passes, "sensitive_only": req.sensitive_only})
    for d in dirs:
        emit("directory_start", {"directory": d})
        files = _scan_temp_dir(d, req.older_than_minutes, req.sensitive_only, req.max_size_mb)
        targets.extend(files)
        emit("directory_complete", {"directory": d, "targets": len(files)})

    wiped, failed = 0, 0
    bytes_wiped = 0
    results = []
    for f in targets:
        size = f["size_bytes"]
        ok = _secure_wipe(f["path"], req.passes)
        if ok:
            wiped += 1
            bytes_wiped += size
        else:
            failed += 1
        results.append({"path": f["path"], "size_bytes": size,
                         "wiped": ok, "passes": req.passes})
        emit("file_wiped", {"path": f["path"], "size_bytes": size, "wiped": ok})

    emit(
        "run_complete",
        {
            "files_targeted": len(targets),
            "wiped": wiped,
            "failed": failed,
            "bytes_wiped": bytes_wiped,
            "passes_used": req.passes,
        },
        status="success" if failed == 0 else "error",
    )

    return {
        "files_targeted": len(targets),
        "wiped": wiped,
        "failed": failed,
        "bytes_wiped": bytes_wiped,
        "passes_used": req.passes,
        "results": results,
    }

@router.post("/monitor")
def control_monitor(req: MonitorRequest):
    """Start or stop background temp file monitor."""
    global _monitor_thread, _monitor_running

    if req.start:
        if _monitor_running:
            run_store.publish_progress(
                tool_id="temp-cleaner",
                stage="monitor_status",
                endpoint="/api/temp/monitor",
                request_id=req.request_id,
                details={"status": "already_running", "interval": req.interval_seconds},
                status="success",
            )
            return {"status": "already_running",
                    "auto_wipe": req.auto_wipe,
                    "interval": req.interval_seconds}
        _monitor_running = True
        _monitor_thread = threading.Thread(
            target=_monitor_loop,
            args=(req.interval_seconds, req.auto_wipe, req.passes),
            daemon=True
        )
        _monitor_thread.start()
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage="monitor_started",
            endpoint="/api/temp/monitor",
            request_id=req.request_id,
            details={"auto_wipe": req.auto_wipe, "interval_seconds": req.interval_seconds},
            status="success",
        )
        return {"status": "started", "auto_wipe": req.auto_wipe,
                "interval_seconds": req.interval_seconds}
    else:
        _monitor_running = False
        run_store.publish_progress(
            tool_id="temp-cleaner",
            stage="monitor_stopped",
            endpoint="/api/temp/monitor",
            request_id=req.request_id,
            details={},
            status="success",
        )
        return {"status": "stopped"}

@router.get("/monitor/log")
def get_monitor_log(limit: int = 100):
    """Return the last N entries from the background monitor log."""
    return {"entries": _monitor_log[-limit:], "total": len(_monitor_log)}
