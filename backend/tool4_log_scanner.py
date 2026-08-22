"""
Tool 4: Log File Sensitive Data Scanner & Redactor
Scans log files for passwords, tokens, keys, PII and redacts or deletes them.
Supports real filesystem paths, log directory scanning, and demo test files.
"""

import os
import re
import stat
import time
import uuid
from pathlib import Path
from typing import List, Dict, Optional, Any, Tuple
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Primary Demo & Upload Directories ─────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
DEMO_ROOT = Path("C:/SecureDel-Demo") if os.name == "nt" else BACKEND_DIR / "SecureDel-Demo"
DEMO_LOGS_DIR = DEMO_ROOT / "Logs"
STORAGE_LOGS_UPLOADS = BACKEND_DIR / "storage" / "uploads" / "logs"

def get_demo_logs_dir() -> Path:
    try:
        DEMO_LOGS_DIR.mkdir(parents=True, exist_ok=True)
        return DEMO_LOGS_DIR
    except Exception:
        fallback = BACKEND_DIR / "SecureDel-Demo" / "Logs"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

# ── Sensitive Pattern Library ─────────────────────────────────────
PATTERNS: Dict[str, Dict[str, Any]] = {
    "password": {
        "regex": re.compile(r'(?i)(?:password|passwd|pwd|pass)\s*[=:]\s*[\'"]?([^\s\'"]{4,})'),
        "severity": "CRITICAL",
        "label": "Hardcoded Password",
    },
    "api_key": {
        "regex": re.compile(r'(?i)(?:api[_\-]?key|apikey)\s*[=:]\s*[\'"]?([A-Za-z0-9\-_]{16,})'),
        "severity": "CRITICAL",
        "label": "API Key",
    },
    "aws_key": {
        "regex": re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
        "severity": "CRITICAL",
        "label": "AWS Access Key",
    },
    "openai_key": {
        "regex": re.compile(r'\bsk-[A-Za-z0-9]{20,}\b'),
        "severity": "CRITICAL",
        "label": "OpenAI Secret Key",
    },
    "github_token": {
        "regex": re.compile(r'\bghp_[A-Za-z0-9]{36}\b'),
        "severity": "CRITICAL",
        "label": "GitHub Personal Token",
    },
    "jwt": {
        "regex": re.compile(r'\beyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]*\b'),
        "severity": "HIGH",
        "label": "JWT Web Token",
    },
    "bearer_token": {
        "regex": re.compile(r'(?i)bearer\s+([A-Za-z0-9\-_.+/=]{20,})'),
        "severity": "HIGH",
        "label": "Bearer Authorization Header",
    },
    "private_key": {
        "regex": re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
        "severity": "CRITICAL",
        "label": "Private Key Certificate",
    },
    "db_url": {
        "regex": re.compile(r'(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s]+:[^@\s]+@[^\s]+'),
        "severity": "CRITICAL",
        "label": "Database Connection URL",
    },
    "email": {
        "regex": re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[a-zA-Z]{2,}\b'),
        "severity": "MEDIUM",
        "label": "Email Address (PII)",
    },
    "secret": {
        "regex": re.compile(r'(?i)(?:secret|token|auth|credential)\s*[=:]\s*[\'"]?([A-Za-z0-9\-_]{12,})'),
        "severity": "HIGH",
        "label": "Secret / Token Parameter",
    },
}

def _redact_str(val: str) -> str:
    if len(val) <= 4:
        return "████"
    show = min(4, len(val) // 4)
    return val[:show] + "█" * max(4, len(val) - show)

# ── Scan a single file ────────────────────────────────────────────
def scan_single_log_file(path: str, selected_patterns: Optional[List[str]] = None) -> Dict:
    p = Path(path)
    if not p.exists() or not p.is_file():
        return {"path": path, "filename": p.name, "error": "File not found", "matches": [], "lines_count": 0}

    findings = []
    lines_count = 0
    size_bytes = p.stat().st_size

    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for lineno, line in enumerate(f, 1):
                lines_count += 1
                line_str = line.rstrip("\r\n")

                for pname, pdata in PATTERNS.items():
                    if selected_patterns and pname not in selected_patterns:
                        continue

                    for match in pdata["regex"].finditer(line_str):
                        raw_match = match.group(0)
                        redacted_preview = line_str.replace(raw_match, _redact_str(raw_match)).strip()
                        findings.append({
                            "line": lineno,
                            "type": pdata["label"],
                            "pattern_id": pname,
                            "severity": pdata["severity"],
                            "match": _redact_str(raw_match),
                            "preview": redacted_preview[:120],
                        })
    except Exception as e:
        return {"path": path, "filename": p.name, "error": str(e), "matches": [], "lines_count": lines_count}

    return {
        "path": str(p.resolve()),
        "filename": p.name,
        "size_bytes": size_bytes,
        "size_kb": round(size_bytes / 1024, 1),
        "lines_count": lines_count,
        "matches": findings,
        "total_matches": len(findings),
    }

# ── Secure-delete / Redact Helper ─────────────────────────────────
def _secure_delete(path: str, passes: int = 3) -> bool:
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

# ── Pydantic models ───────────────────────────────────────────────
class ValidateLogPathRequest(BaseModel):
    path: str

class ValidateLogPathResponse(BaseModel):
    success: bool
    exists: bool
    isDir: bool
    name: Optional[str] = None
    path: Optional[str] = None
    fileCount: int = 0
    totalBytes: int = 0
    files: List[Dict[str, Any]] = []
    error: Optional[str] = None
    message: Optional[str] = None

class ScanRequest(BaseModel):
    paths: List[str]
    recursive: bool = True
    patterns: Optional[List[str]] = None
    extensions: List[str] = [".log", ".txt", ".out", ".err", ".json", ".env", ".conf", ".cfg"]
    request_id: Optional[str] = None

class RedactRequest(BaseModel):
    paths: List[str]
    action: str = "redact"  # "redact" or "delete"
    passes: int = 3
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────

@router.get("/patterns")
def list_patterns():
    """List all available sensitive data patterns."""
    return {
        "patterns": [
            {"id": k, "label": v["label"], "severity": v["severity"]}
            for k, v in PATTERNS.items()
        ],
        "total": len(PATTERNS)
    }

@router.post("/validate-path", response_model=ValidateLogPathResponse)
@router.post("/validate", response_model=ValidateLogPathResponse)
def validate_log_path(req: ValidateLogPathRequest):
    """
    Validates a log file or directory path and inspects real filesystem entries.
    """
    raw = req.path.strip().strip('"').strip("'")
    if not raw:
        return ValidateLogPathResponse(
            success=False, exists=False, isDir=False,
            error="INVALID_PATH", message="Please enter a valid file or directory path."
        )

    p = Path(raw)

    ALLOWED_EXTENSIONS = {".log", ".txt", ".out", ".err"}
    ext_lower = p.suffix.lower()
    if ext_lower and ext_lower not in ALLOWED_EXTENSIONS:
        return ValidateLogPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="INVALID_EXTENSION",
            message=f"Invalid file extension '{ext_lower}'. Log Sensitive Data Scanner only supports: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not p.exists():
        return ValidateLogPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="PATH_NOT_FOUND", message="The specified log file or directory does not exist."
        )

    files_list = []
    total_bytes = 0

    if p.is_file():
        total_bytes = p.stat().st_size
        files_list.append({
            "name": p.name,
            "path": str(p.resolve()),
            "size": total_bytes,
        })
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
                                if len(files_list) < 100:
                                    files_list.append({
                                        "name": entry.name,
                                        "path": entry.path,
                                        "size": sz,
                                    })
                        except (PermissionError, OSError):
                            pass
            except (PermissionError, OSError):
                pass

    return ValidateLogPathResponse(
        success=True, exists=True, isDir=p.is_dir(), name=p.name,
        path=str(p.resolve()), fileCount=len(files_list), totalBytes=total_bytes,
        files=files_list[:100], message="Log path validated."
    )

@router.post("/generate-demo")
def generate_demo_logs():
    """
    Creates realistic demonstration log files in C:\\SecureDel-Demo\\Logs\\.
    """
    logs_dir = get_demo_logs_dir()

    app_log = logs_dir / "application.log"
    auth_log = logs_dir / "auth.log"
    server_log = logs_dir / "server.log"

    app_log_content = """[2026-08-14 08:12:01.402] [INFO]  [server] Application server initialized on port 8080
[2026-08-14 08:12:05.112] [INFO]  [db] Connecting to postgresql://dbadmin:Sup3rS3cretP@ss!@10.0.1.45:5432/app_production
[2026-08-14 08:13:22.891] [DEBUG] [auth] User login attempt: user=admin@company.com
[2026-08-14 08:13:23.004] [INFO]  [auth] Login successful for admin@company.com, token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
[2026-08-14 08:15:40.119] [WARN]  [aws] S3 backup sync initialized with AccessKey=AKIAIOSFODNN7EXAMPLE
[2026-08-14 08:18:10.550] [INFO]  [http] Request received: GET /api/v1/metrics
[2026-08-14 08:20:00.001] [ERROR] [payment] Stripe charge error with key sk_test_mock_dummy_sample_stripe_key
"""

    auth_log_content = """[2026-08-14 09:00:10] [AUTH] Processing authentication header: Bearer dGVzdF9iZWFyZXJfdG9rZW5fYXV0aF85ODQzNzI5MTg=
[2026-08-14 09:05:33] [AUTH] Failed login for user root with password=Password123!
[2026-08-14 09:10:44] [AUTH] Password reset requested for engineer@example.com
[2026-08-14 09:12:00] [AUTH] API request with api_key=ak_live_894372918374829103948291
"""

    server_log_content = """[2026-08-14 10:00:00] [SYSTEM] Server health check OK (Memory: 42%, CPU: 12%)
[2026-08-14 10:15:00] [SYSTEM] Backup routine completed successfully.
[2026-08-14 10:30:00] [SYSTEM] Rotating log files.
"""

    app_log.write_text(app_log_content, encoding="utf-8")
    auth_log.write_text(auth_log_content, encoding="utf-8")
    server_log.write_text(server_log_content, encoding="utf-8")

    return {
        "success": True,
        "path": str(logs_dir.resolve()),
        "dir_path": str(logs_dir.resolve()),
        "files": ["application.log", "auth.log", "server.log"],
        "message": "Demo log files generated on physical disk."
    }

@router.post("/scan")
def scan_logs(req: ScanRequest):
    """
    Scans real log files line-by-line for sensitive data and returns real findings.
    """
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="log-scanner",
            stage=stage,
            endpoint="/api/logs/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    all_files: List[str] = []
    ext_set = set(req.extensions)

    for p in req.paths:
        pp = Path(p.strip().strip('"').strip("'"))
        if pp.is_file():
            all_files.append(str(pp.resolve()))
        elif pp.is_dir():
            glob = "**/*" if req.recursive else "*"
            for f in pp.glob(glob):
                if f.is_file() and (not req.extensions or f.suffix.lower() in ext_set):
                    all_files.append(str(f.resolve()))

    emit("run_start", {"files_total": len(all_files)})

    results = []
    total_lines = 0
    critical_count = 0
    high_count = 0
    medium_count = 0

    for idx, f in enumerate(all_files, 1):
        r = scan_single_log_file(f, req.patterns)
        total_lines += r.get("lines_count", 0)
        matches = r.get("matches", [])
        for m in matches:
            sev = m.get("severity")
            if sev == "CRITICAL":
                critical_count += 1
            elif sev == "HIGH":
                high_count += 1
            else:
                medium_count += 1

        results.append(r)
        emit("file_scanned", {"file": Path(f).name, "index": idx, "total": len(all_files), "matches": len(matches)})

    flagged = [r for r in results if r.get("total_matches", 0) > 0]
    total_findings = sum(r.get("total_matches", 0) for r in results)

    emit(
        "run_complete",
        {
            "files_scanned": len(all_files),
            "lines_scanned": total_lines,
            "total_findings": total_findings,
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
        },
        status="success",
    )

    return {
        "success": True,
        "files_scanned": len(all_files),
        "lines_scanned": total_lines,
        "total_findings": total_findings,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "flagged_files": flagged,
        "results": results,
    }

@router.post("/redact")
def redact_or_delete_logs(req: RedactRequest):
    """
    Redacts secrets in place or securely deletes flagged log files on disk.
    """
    results = []
    for path_str in req.paths:
        p = Path(path_str.strip().strip('"').strip("'"))
        if not p.exists() or not p.is_file():
            continue

        if req.action == "delete":
            ok = _secure_delete(str(p), req.passes)
            results.append({"path": str(p), "name": p.name, "deleted": ok, "verified": not p.exists()})
        else:
            # Redact in place
            try:
                content = p.read_text(encoding="utf-8", errors="replace")
                modified = content
                for pname, pdata in PATTERNS.items():
                    modified = pdata["regex"].sub(f"<{pname.upper()}_REDACTED>", modified)
                p.write_text(modified, encoding="utf-8")
                results.append({"path": str(p), "name": p.name, "redacted": True, "verified": True})
            except Exception as e:
                results.append({"path": str(p), "name": p.name, "error": str(e), "verified": False})

    return {
        "success": True,
        "action": req.action,
        "processed_count": len(results),
        "results": results,
    }

@router.post("/upload")
async def upload_log_file(file: UploadFile = File(...)):
    """
    Upload a log file to controlled storage.
    """
    upload_id = uuid.uuid4().hex[:12]
    target_dir = STORAGE_LOGS_UPLOADS / upload_id
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = os.path.basename(file.filename or "application.log")
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
