"""
Tool 1: Secure File Deletion
Multi-pass overwrite using DoD 5220.22-M and Gutmann patterns.
"""

import os
import stat
import hashlib
import time
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Pydantic models ──────────────────────────────────────────────
class DeleteRequest(BaseModel):
    paths: List[str]
    passes: int = 3          # 3 = DoD, 7 = DoD extended, 35 = Gutmann
    verify: bool = True
    remove_metadata: bool = True
    request_id: Optional[str] = None

class FileResult(BaseModel):
    path: str
    success: bool
    passes_done: int
    original_size: int
    sha256_before: Optional[str]
    sha256_after: Optional[str]
    error: Optional[str] = None
    time_taken: float

class DeleteResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    results: List[FileResult]

# ── Core logic ────────────────────────────────────────────────────
DOD_PATTERNS = [
    b'\x00',        # Pass 1: zeros
    b'\xFF',        # Pass 2: ones
    None,           # Pass 3: random
]

GUTMANN_PATTERNS = [
    None, None, None, None,               # Passes 1-4:  random
    b'\x55', b'\xAA',                     # Passes 5-6:  0x55, 0xAA
    b'\x92\x49\x24', b'\x49\x24\x92',    # Passes 7-8
    b'\x24\x92\x49',                      # Pass  9
    b'\x00', b'\x11', b'\x22', b'\x33',  # Passes 10-13
    b'\x44', b'\x55', b'\x66', b'\x77',  # Passes 14-17
    b'\x88', b'\x99', b'\xAA', b'\xBB',  # Passes 18-21
    b'\xCC', b'\xDD', b'\xEE', b'\xFF',  # Passes 22-25
    b'\x92\x49\x24', b'\x49\x24\x92',    # Passes 26-27
    b'\x24\x92\x49', b'\x6D\xB6\xDB',    # Passes 28-29
    b'\xB6\xDB\x6D', b'\xDB\x6D\xB6',    # Passes 30-31
    None, None, None, None,               # Passes 32-35: random
]

def _sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()

def _pattern_label(pattern: Optional[bytes]) -> str:
    if pattern is None:
        return "RANDOM"
    if pattern == b'\x00':
        return "0x00"
    if pattern == b'\xFF':
        return "0xFF"
    return "FIXED"


def _overwrite_file(
    path: str,
    passes: int,
    progress_cb: Optional[Callable[[str, Dict[str, Any]], None]] = None,
) -> int:
    """Overwrite file with chosen number of passes. Returns passes completed."""
    size = os.path.getsize(path)
    if size == 0:
        return 0

    patterns = GUTMANN_PATTERNS if passes == 35 else DOD_PATTERNS
    # If custom pass count, cycle DoD patterns
    if passes not in (3, 7, 35):
        patterns = (DOD_PATTERNS * ((passes // 3) + 1))[:passes]

    done = 0
    for i in range(passes):
        pattern = patterns[i % len(patterns)]
        if progress_cb:
            progress_cb(
                "pass_start",
                {
                    "path": path,
                    "pass_index": i + 1,
                    "passes_total": passes,
                    "pattern": _pattern_label(pattern),
                },
            )

        with open(path, "r+b") as f:
            f.seek(0)
            written = 0
            while written < size:
                chunk = min(65536, size - written)
                data = os.urandom(chunk) if pattern is None else (pattern * chunk)[:chunk]
                f.write(data)
                written += chunk
            f.flush()
            os.fsync(f.fileno())
        done += 1

        if progress_cb:
            progress_cb(
                "pass_complete",
                {
                    "path": path,
                    "pass_index": done,
                    "passes_total": passes,
                    "percent": int((done / passes) * 100),
                },
            )

    return done

def _strip_metadata(path: str):
    """Strip file timestamps and extended attributes."""
    try:
        now = time.time()
        os.utime(path, (now, now))
        # On Linux, remove extended attributes
        if hasattr(os, "listxattr"):
            for attr in os.listxattr(path):
                try:
                    os.removexattr(path, attr)
                except Exception:
                    pass
    except Exception:
        pass

def secure_delete_file(
    path: str,
    passes: int,
    verify: bool,
    remove_metadata: bool,
    progress_cb: Optional[Callable[[str, Dict[str, Any]], None]] = None,
) -> FileResult:
    start = time.time()
    p = Path(path)

    if not p.exists():
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "File not found"})
        return FileResult(path=path, success=False, passes_done=0,
                          original_size=0, sha256_before=None, sha256_after=None,
                          error="File not found", time_taken=0.0)

    if not p.is_file():
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "Not a regular file"})
        return FileResult(path=path, success=False, passes_done=0,
                          original_size=0, sha256_before=None, sha256_after=None,
                          error="Not a regular file", time_taken=0.0)

    try:
        original_size = p.stat().st_size
        if progress_cb:
            progress_cb(
                "file_start",
                {"path": path, "size": original_size, "passes_total": passes},
            )

        sha_before = _sha256(path) if verify else None

        # Make writable in case it's read-only
        os.chmod(path, stat.S_IWRITE | stat.S_IREAD)

        if remove_metadata:
            _strip_metadata(path)

        passes_done = _overwrite_file(path, passes, progress_cb)

        sha_after = _sha256(path) if verify else None

        # Final rename to random name before delete (hides original filename in MFT)
        random_name = p.parent / os.urandom(8).hex()
        os.rename(path, random_name)
        os.remove(random_name)

        elapsed = round(time.time() - start, 3)
        if progress_cb:
            progress_cb(
                "file_complete",
                {
                    "path": path,
                    "passes_done": passes_done,
                    "time_taken": elapsed,
                    "sha256_before": sha_before,
                    "sha256_after": sha_after,
                },
            )
        return FileResult(
            path=path, success=True, passes_done=passes_done,
            original_size=original_size,
            sha256_before=sha_before, sha256_after=sha_after,
            time_taken=elapsed
        )

    except Exception as e:
        elapsed = round(time.time() - start, 3)
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": str(e), "time_taken": elapsed})
        return FileResult(path=path, success=False, passes_done=0,
                          original_size=0, sha256_before=None, sha256_after=None,
                          error=str(e), time_taken=elapsed)

# ── Routes ────────────────────────────────────────────────────────
@router.post("/wipe", response_model=DeleteResponse)
def wipe_files(req: DeleteRequest):
    """Securely delete one or more files with multi-pass overwriting."""
    if req.passes < 1 or req.passes > 35:
        raise HTTPException(400, "passes must be between 1 and 35")

    def _emit(stage: str, details: Dict[str, Any], status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="file-wiper",
            stage=stage,
            endpoint="/api/delete/wipe",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    _emit("run_start", {"files_total": len(req.paths), "passes": req.passes})

    results = [
        secure_delete_file(
            p,
            req.passes,
            req.verify,
            req.remove_metadata,
            progress_cb=_emit,
        )
        for p in req.paths
    ]
    succeeded = sum(1 for r in results if r.success)

    _emit(
        "run_complete",
        {
            "files_total": len(results),
            "succeeded": succeeded,
            "failed": len(results) - succeeded,
            "passes": req.passes,
        },
        status="success" if succeeded == len(results) else "error",
    )

    return DeleteResponse(
        total=len(results), succeeded=succeeded,
        failed=len(results) - succeeded, results=results
    )

@router.post("/wipe-folder")
def wipe_folder(path: str, passes: int = 3, recursive: bool = True):
    """Securely delete all files in a folder."""
    p = Path(path)
    if not p.exists() or not p.is_dir():
        raise HTTPException(400, "Invalid directory path")

    pattern = "**/*" if recursive else "*"
    files = [str(f) for f in p.glob(pattern) if f.is_file()]

    results = [secure_delete_file(f, passes, True, True) for f in files]
    succeeded = sum(1 for r in results if r.success)

    # Remove now-empty directories
    try:
        import shutil
        shutil.rmtree(path, ignore_errors=True)
    except Exception:
        pass

    return {"total": len(results), "succeeded": succeeded,
            "failed": len(results) - succeeded, "results": results}
