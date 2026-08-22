"""
Tool 1: Secure File Deletion
Multi-pass overwrite using DoD 5220.22-M and Gutmann patterns.
Includes real filesystem upload, local path validation, demo file generator,
safe path policy, and post-delete verification.
"""

import os
import stat
import hashlib
import time
import uuid
import mimetypes
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Safe Path Policy & Demo Directories ─────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BACKEND_DIR.parent
STORAGE_UPLOADS_DIR = BACKEND_DIR / "storage" / "uploads"
LOCAL_DEMO_DIR = BACKEND_DIR / "demo_files"

# Windows primary demo directory
PRIMARY_WIN_DEMO_DIR = Path("C:/SecureDel/demo-files")

def get_demo_dir() -> Path:
    """Returns the primary demo directory, creating it if necessary."""
    try:
        if os.name == "nt":
            PRIMARY_WIN_DEMO_DIR.mkdir(parents=True, exist_ok=True)
            return PRIMARY_WIN_DEMO_DIR
    except Exception:
        pass
    LOCAL_DEMO_DIR.mkdir(parents=True, exist_ok=True)
    return LOCAL_DEMO_DIR

def get_storage_uploads_dir() -> Path:
    """Ensures and returns the uploads storage directory."""
    STORAGE_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return STORAGE_UPLOADS_DIR

# Ensure storage directories on startup
try:
    get_storage_uploads_dir()
    get_demo_dir()
except Exception:
    pass

FORBIDDEN_ROOTS = [
    r"C:\Windows",
    r"C:\Program Files",
    r"C:\Program Files (x86)",
    r"C:\ProgramData",
    r"C:\Users\Default",
    r"/bin",
    r"/sbin",
    r"/usr",
    r"/etc",
    r"/lib",
    r"/boot",
    r"/sys",
    r"/proc",
]

def is_safe_path(target_path: Path) -> tuple[bool, str]:
    """
    Validates that target_path does not point to critical OS or system directories.
    """
    try:
        resolved = target_path.resolve()
    except Exception as e:
        return False, f"Invalid path resolution: {e}"

    resolved_str = str(resolved).lower()

    # Block drive root directly (e.g. C:\ or /)
    if resolved_str in ["c:\\", "c:/", "/", "d:\\", "d:/"]:
        return False, "Deleting a drive root directory is forbidden."

    # Check forbidden roots
    for forbidden in FORBIDDEN_ROOTS:
        # Avoid resolving forbidden roots on every call as it causes I/O overhead
        forbidden_clean = os.path.normpath(forbidden).lower()
        if resolved_str == forbidden_clean or resolved_str.startswith(forbidden_clean + os.sep):
            return False, f"Access to system-critical directory '{forbidden}' is forbidden."

    # Block deleting backend source code files or database
    backend_resolved = str(BACKEND_DIR.resolve()).lower()
    if resolved_str.startswith(backend_resolved):
        uploads_resolved = str(STORAGE_UPLOADS_DIR.resolve()).lower()
        demo_resolved = str(LOCAL_DEMO_DIR.resolve()).lower()
        # Only allow inside uploads or demo_files when inside backend folder
        if not (resolved_str.startswith(uploads_resolved) or resolved_str.startswith(demo_resolved)):
            return False, "Deleting SecureDel backend application files is forbidden."

    return True, "Path allowed"


# ── Pydantic models ──────────────────────────────────────────────
class ValidatePathRequest(BaseModel):
    path: str

class ValidatePathResponse(BaseModel):
    success: bool
    exists: bool
    isFile: bool
    name: Optional[str] = None
    size: Optional[int] = None
    type: Optional[str] = None
    mime: Optional[str] = None
    path: Optional[str] = None
    status: Optional[str] = None
    error: Optional[str] = None
    message: Optional[str] = None

class DeletePathRequest(BaseModel):
    path: str
    passes: int = 3
    verify: bool = True
    remove_metadata: bool = True
    request_id: Optional[str] = None

class DeleteRequest(BaseModel):
    paths: List[str]
    passes: int = 3          # 3 = DoD, 7 = DoD extended, 35 = Gutmann
    verify: bool = True
    remove_metadata: bool = True
    request_id: Optional[str] = None

class FileResult(BaseModel):
    path: str
    name: Optional[str] = None
    success: bool
    deleted: bool
    verified: bool
    exists_after: bool
    passes_done: int
    original_size: int
    sha256_before: Optional[str] = None
    sha256_after: Optional[str] = None
    error: Optional[str] = None
    time_taken: float

class DeleteResponse(BaseModel):
    total: int
    succeeded: int
    failed: int
    results: List[FileResult]

class GenerateDemoResponse(BaseModel):
    success: bool
    path: str
    name: str
    size: int
    type: str
    content: str
    status: str
    message: Optional[str] = None

class UploadResponse(BaseModel):
    success: bool
    upload_id: str
    name: str
    size: int
    path: str
    status: str


# ── Core Multi-pass Overwrite Logic ──────────────────────────────
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
    filename = p.name

    if not p.exists():
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "FILE_NOT_FOUND"})
        return FileResult(
            path=path, name=filename, success=False, deleted=False, verified=False,
            exists_after=False, passes_done=0, original_size=0,
            error="The specified path does not exist.", time_taken=0.0
        )

    if not p.is_file():
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "DIRECTORY_DETECTED"})
        return FileResult(
            path=path, name=filename, success=False, deleted=False, verified=False,
            exists_after=True, passes_done=0, original_size=0,
            error="Directory detected. This tool requires a file.", time_taken=0.0
        )

    # Check safe path policy
    safe, reason = is_safe_path(p)
    if not safe:
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "FORBIDDEN_PATH", "reason": reason})
        return FileResult(
            path=path, name=filename, success=False, deleted=False, verified=False,
            exists_after=True, passes_done=0, original_size=0,
            error=reason, time_taken=0.0
        )

    try:
        original_size = p.stat().st_size
        if progress_cb:
            progress_cb(
                "file_start",
                {"path": path, "name": filename, "size": original_size, "passes_total": passes},
            )

        sha_before = _sha256(path) if verify and original_size > 0 else None

        # Make writable in case it's read-only
        try:
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass

        if remove_metadata:
            _strip_metadata(path)

        passes_done = 0
        if original_size > 0:
            passes_done = _overwrite_file(path, passes, progress_cb)

        sha_after = _sha256(path) if verify and original_size > 0 else None

        # Rename to random name in the same directory before removal (obfuscates MFT entry)
        random_name = p.parent / (uuid.uuid4().hex + ".tmp")
        try:
            os.rename(path, random_name)
            target_to_remove = random_name
        except Exception:
            target_to_remove = p

        # Perform physical filesystem removal
        os.remove(target_to_remove)

        # ── REAL VERIFICATION ──
        original_exists = p.exists()
        random_exists = target_to_remove.exists()
        file_still_exists = original_exists or random_exists

        elapsed = round(time.time() - start, 3)

        if file_still_exists:
            if progress_cb:
                progress_cb("file_error", {
                    "path": path,
                    "error": "FILE_STILL_EXISTS",
                    "detail": "The file still exists after the deletion attempt."
                })
            return FileResult(
                path=path, name=filename, success=False, deleted=False, verified=False,
                exists_after=True, passes_done=passes_done,
                original_size=original_size, sha256_before=sha_before,
                sha256_after=sha_after, error="The file still exists after the deletion attempt.",
                time_taken=elapsed
            )

        # Physical deletion confirmed and verified
        if progress_cb:
            progress_cb(
                "file_complete",
                {
                    "path": path,
                    "name": filename,
                    "passes_done": passes_done,
                    "time_taken": elapsed,
                    "sha256_before": sha_before,
                    "sha256_after": sha_after,
                    "verified": True,
                    "exists": False,
                },
            )

        return FileResult(
            path=path, name=filename, success=True, deleted=True, verified=True,
            exists_after=False, passes_done=passes_done,
            original_size=original_size, sha256_before=sha_before,
            sha256_after=sha_after, time_taken=elapsed
        )

    except PermissionError:
        elapsed = round(time.time() - start, 3)
        msg = "SecureDel does not have permission to access or delete this file."
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "PERMISSION_DENIED", "detail": msg})
        return FileResult(
            path=path, name=filename, success=False, deleted=False, verified=False,
            exists_after=p.exists(), passes_done=0, original_size=0,
            error=msg, time_taken=elapsed
        )
    except Exception as e:
        elapsed = round(time.time() - start, 3)
        if progress_cb:
            progress_cb("file_error", {"path": path, "error": "DELETE_FAILED", "detail": str(e)})
        return FileResult(
            path=path, name=filename, success=False, deleted=False, verified=False,
            exists_after=p.exists(), passes_done=0, original_size=0,
            error=str(e), time_taken=elapsed
        )


# ── Routes ────────────────────────────────────────────────────────

@router.post("/validate-path", response_model=ValidatePathResponse)
@router.post("/validate", response_model=ValidatePathResponse)
def validate_path(req: ValidatePathRequest):
    """
    Validates a filesystem path, verifies existence, checks safe path policy,
    and returns real metadata.
    """
    raw_path = req.path.strip().strip('"').strip("'")
    if not raw_path:
        return ValidatePathResponse(
            success=False, exists=False, isFile=False,
            error="INVALID_PATH", message="Please enter a valid file path."
        )

    p = Path(raw_path)

    ALLOWED_EXTENSIONS = {".txt"}
    ext_lower = p.suffix.lower()
    if not ext_lower or ext_lower not in ALLOWED_EXTENSIONS:
        return ValidatePathResponse(
            success=False, exists=False, isFile=False, path=raw_path,
            error="INVALID_EXTENSION",
            message=f"Invalid file extension '{ext_lower or 'none'}'. Secure File Wiper only supports: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not p.exists():
        return ValidatePathResponse(
            success=False, exists=False, isFile=False, path=raw_path,
            error="FILE_NOT_FOUND", message="The specified path does not exist."
        )

    if p.is_dir():
        return ValidatePathResponse(
            success=False, exists=True, isFile=False, path=str(p.resolve()),
            name=p.name, error="DIRECTORY_DETECTED", message="Directory detected. This tool requires a file."
        )

    if not p.is_file():
        return ValidatePathResponse(
            success=False, exists=True, isFile=False, path=str(p.resolve()),
            name=p.name, error="NOT_REGULAR_FILE", message="The path is not a regular file."
        )

    # Check safe path policy
    safe, reason = is_safe_path(p)
    if not safe:
        return ValidatePathResponse(
            success=False, exists=True, isFile=True, path=str(p.resolve()),
            name=p.name, error="FORBIDDEN_PATH", message=reason
        )

    try:
        stat_info = p.stat()
        size = stat_info.st_size
        ext = p.suffix.lstrip(".").upper() or "FILE"
        mime_type, _ = mimetypes.guess_type(str(p))

        # Check readability
        with open(str(p), "rb") as f:
            f.read(min(1024, size))

        canonical_path = str(p.resolve())

        return ValidatePathResponse(
            success=True, exists=True, isFile=True,
            name=p.name, size=size, type=ext, mime=mime_type or "application/octet-stream",
            path=canonical_path, status="READY"
        )
    except PermissionError:
        return ValidatePathResponse(
            success=False, exists=True, isFile=True, path=str(p.resolve()),
            name=p.name, error="PERMISSION_DENIED",
            message="SecureDel does not have permission to access this file."
        )
    except Exception as e:
        return ValidatePathResponse(
            success=False, exists=True, isFile=True, path=str(p.resolve()),
            name=p.name, error="VALIDATION_FAILED", message=str(e)
        )


@router.post("/generate-demo", response_model=GenerateDemoResponse)
def generate_demo():
    """
    Creates a physical demo test file (demo_secret.txt) in the controlled demo directory
    with the exact requested demonstration content.
    """
    demo_dir = get_demo_dir()
    demo_file = demo_dir / "demo_secret.txt"

    content = (
        "SECUREDEL DEMONSTRATION FILE\n\n"
        "This file contains fictional data for testing\n"
        "the SecureDel Secure File Deletion feature.\n\n"
        "Test ID: SECUREDEL-DEMO-001\n"
        "Environment: DEMO\n"
        "Status: READY_FOR_DELETION\n\n"
        "No real credentials or confidential information\n"
        "are contained in this file."
    )

    try:
        demo_file.write_text(content, encoding="utf-8")
        if not demo_file.exists():
            raise HTTPException(500, "Failed to create demo file on disk.")

        size = demo_file.stat().st_size
        canonical_path = str(demo_file.resolve())

        return GenerateDemoResponse(
            success=True,
            path=canonical_path,
            name="demo_secret.txt",
            size=size,
            type="TXT",
            content=content,
            status="READY",
            message="Demo file generated successfully on filesystem."
        )
    except Exception as e:
        raise HTTPException(500, f"Error creating demo file: {str(e)}")


@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Receives an uploaded file, stores it physically in SecureDel controlled storage,
    and returns its upload ID and stored path.
    """
    upload_id = uuid.uuid4().hex[:12]
    target_dir = get_storage_uploads_dir() / upload_id
    target_dir.mkdir(parents=True, exist_ok=True)

    filename = os.path.basename(file.filename or "uploaded_file.dat")
    target_path = target_dir / filename

    try:
        with open(target_path, "wb") as f:
            while chunk := await file.read(65536):
                f.write(chunk)

        if not target_path.exists():
            raise HTTPException(500, "Uploaded file could not be saved to disk.")

        size = target_path.stat().st_size
        canonical_path = str(target_path.resolve())

        return UploadResponse(
            success=True,
            upload_id=upload_id,
            name=filename,
            size=size,
            path=canonical_path,
            status="READY"
        )
    except Exception as e:
        raise HTTPException(500, f"Upload failed: {str(e)}")


@router.post("/path", response_model=FileResult)
@router.post("/delete-path", response_model=FileResult)
def delete_single_path(req: DeletePathRequest):
    """
    Securely deletes a single file at the specified filesystem path with verification.
    """
    raw_path = req.path.strip().strip('"').strip("'")
    if not raw_path:
        raise HTTPException(400, "Path cannot be empty.")

    if req.passes < 1 or req.passes > 35:
        raise HTTPException(400, "Passes must be between 1 and 35.")

    def _emit(stage: str, details: Dict[str, Any], status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="file-wiper",
            stage=stage,
            endpoint="/api/delete/path",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    _emit("run_start", {"path": raw_path, "passes": req.passes})

    result = secure_delete_file(
        raw_path,
        req.passes,
        req.verify,
        req.remove_metadata,
        progress_cb=_emit,
    )

    _emit(
        "run_complete",
        {
            "path": raw_path,
            "success": result.success,
            "deleted": result.deleted,
            "verified": result.verified,
            "passes_done": result.passes_done,
        },
        status="success" if result.success else "error",
    )

    return result


@router.post("/wipe", response_model=DeleteResponse)
def wipe_files(req: DeleteRequest):
    """Securely delete one or more files with multi-pass overwriting and verification."""
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
            p.strip().strip('"').strip("'"),
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
    p = Path(path.strip().strip('"').strip("'"))
    if not p.exists() or not p.is_dir():
        raise HTTPException(400, "Invalid directory path")

    safe, reason = is_safe_path(p)
    if not safe:
        raise HTTPException(403, reason)

    pattern = "**/*" if recursive else "*"
    files = [str(f) for f in p.glob(pattern) if f.is_file()]

    results = [secure_delete_file(f, passes, True, True) for f in files]
    succeeded = sum(1 for r in results if r.success)

    # Remove now-empty directories
    try:
        import shutil
        shutil.rmtree(str(p), ignore_errors=True)
    except Exception:
        pass

    return {"total": len(results), "succeeded": succeeded,
            "failed": len(results) - succeeded, "results": results}
