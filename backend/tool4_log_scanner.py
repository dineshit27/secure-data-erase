"""
Tool 4: Log File Sensitive Data Scanner & Redactor
Scans log files for passwords, tokens, keys, PII and redacts or deletes them.
"""

import os
import re
import stat
import time
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Sensitive pattern library ─────────────────────────────────────
PATTERNS: Dict[str, re.Pattern] = {
    # Auth & tokens
    "password":        re.compile(r'(?i)(password|passwd|pwd)\s*[=:]\s*\S+'),
    "api_key":         re.compile(r'(?i)(api[_\-]?key|apikey)\s*[=:]\s*[A-Za-z0-9\-_.]{8,}'),
    "bearer_token":    re.compile(r'(?i)bearer\s+[A-Za-z0-9\-._~+/]+=*'),
    "basic_auth":      re.compile(r'(?i)basic\s+[A-Za-z0-9+/]+=*'),
    "jwt":             re.compile(r'eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+'),
    "secret":          re.compile(r'(?i)(secret|client_secret)\s*[=:]\s*\S+'),

    # Cloud / service provider keys
    "aws_access_key":  re.compile(r'AKIA[0-9A-Z]{16}'),
    "aws_secret":      re.compile(r'(?i)aws.{0,20}secret.{0,20}[=:]\s*[A-Za-z0-9/+]{40}'),
    "github_token":    re.compile(r'gh[ps]_[A-Za-z0-9]{36}'),
    "google_api_key":  re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
    "stripe_key":      re.compile(r'sk_(live|test)_[0-9a-zA-Z]{24,}'),
    "slack_token":     re.compile(r'xox[baprs]-[0-9A-Za-z\-]+'),
    "twilio_sid":      re.compile(r'AC[0-9a-fA-F]{32}'),

    # PII
    "email":           re.compile(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}\b'),
    "credit_card":     re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b'),
    "ssn":             re.compile(r'\b\d{3}-\d{2}-\d{4}\b'),
    "phone_number":    re.compile(r'\b(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?)?\d{3}[\s.\-]?\d{4}\b'),

    # Database / connection strings
    "db_connection":   re.compile(r'(?i)(mysql|postgres|mongodb|redis|mssql)://[^\s]+'),
    "connection_str":  re.compile(r'(?i)(connection.?string|conn.?str)\s*[=:]\s*\S+'),

    # Private keys
    "private_key":     re.compile(r'-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
    "certificate":     re.compile(r'-----BEGIN CERTIFICATE-----'),
}

# ── Scan a single file ────────────────────────────────────────────
def scan_file(path: str, selected_patterns: Optional[List[str]] = None
              ) -> Dict:
    """Return all matching sensitive lines with their pattern name and line number."""
    matches = []
    patterns = {k: v for k, v in PATTERNS.items()
                if not selected_patterns or k in selected_patterns}
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for lineno, line in enumerate(f, 1):
                for pname, regex in patterns.items():
                    if regex.search(line):
                        matches.append({
                            "line_number": lineno,
                            "pattern": pname,
                            "preview": line.strip()[:120],  # truncated for safety
                        })
    except Exception as e:
        return {"path": path, "error": str(e), "matches": []}
    return {"path": path, "matches": matches, "total_matches": len(matches)}

# ── Redact a file in-place ────────────────────────────────────────
def redact_file(path: str, selected_patterns: Optional[List[str]] = None,
                passes: int = 1) -> Dict:
    """Replace sensitive values in-place with [REDACTED]."""
    patterns = {k: v for k, v in PATTERNS.items()
                if not selected_patterns or k in selected_patterns}

    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            original_lines = f.readlines()

        redacted_lines = []
        redacted_count = 0
        for line in original_lines:
            new_line = line
            for pname, regex in patterns.items():
                if regex.search(new_line):
                    new_line = regex.sub(f"[REDACTED:{pname}]", new_line)
                    redacted_count += 1
            redacted_lines.append(new_line)

        # Write redacted content back
        os.chmod(path, stat.S_IWRITE | stat.S_IREAD)
        with open(path, "w", encoding="utf-8") as f:
            f.writelines(redacted_lines)

        return {"path": path, "redacted_entries": redacted_count, "success": True}
    except Exception as e:
        return {"path": path, "success": False, "error": str(e), "redacted_entries": 0}

# ── Secure-delete a file ──────────────────────────────────────────
def _secure_delete(path: str, passes: int = 3) -> bool:
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

# ── Pydantic models ───────────────────────────────────────────────
class ScanRequest(BaseModel):
    paths: List[str]                        # Files or directories
    recursive: bool = True
    patterns: Optional[List[str]] = None   # None = all patterns
    extensions: List[str] = [".log", ".txt", ".out", ".err", ".json",
                              ".yml", ".yaml", ".env", ".conf", ".cfg",
                              ".ini", ".toml", ".properties"]
    request_id: Optional[str] = None

class RedactRequest(BaseModel):
    paths: List[str]
    recursive: bool = True
    patterns: Optional[List[str]] = None
    action: str = "redact"   # "redact" or "delete"
    passes: int = 3
    extensions: List[str] = [".log", ".txt", ".out", ".err", ".json",
                              ".yml", ".yaml", ".env", ".conf", ".cfg",
                              ".ini", ".toml", ".properties"]
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────
@router.get("/patterns")
def list_patterns():
    """List all available sensitive data patterns."""
    return {"patterns": list(PATTERNS.keys()),
            "total": len(PATTERNS)}

@router.post("/scan")
def scan_logs(req: ScanRequest):
    """Scan log files and directories for sensitive data."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="log-scanner",
            stage=stage,
            endpoint="/api/logs/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    ext_set = set(req.extensions)
    all_files: List[str] = []
    emit("run_start", {"paths": req.paths, "recursive": req.recursive})

    for p in req.paths:
        pp = Path(p)
        if pp.is_file():
            all_files.append(str(pp))
        elif pp.is_dir():
            glob = "**/*" if req.recursive else "*"
            for f in pp.glob(glob):
                if f.is_file() and (not req.extensions or f.suffix in ext_set):
                    all_files.append(str(f))

    results = []
    for f in all_files:
        r = scan_file(f, req.patterns)
        results.append(r)
        emit("file_scanned", {"path": f, "matches": r.get("total_matches", 0)})
    flagged = [r for r in results if r.get("total_matches", 0) > 0]
    total_matches = sum(r.get("total_matches", 0) for r in results)

    emit(
        "run_complete",
        {
            "files_scanned": len(all_files),
            "files_with_secrets": len(flagged),
            "total_matches": total_matches,
        },
        status="success",
    )

    return {
        "files_scanned": len(all_files),
        "files_with_secrets": len(flagged),
        "total_matches": total_matches,
        "flagged_files": flagged,
    }

@router.post("/redact")
def redact_or_delete(req: RedactRequest):
    """Redact sensitive entries or securely delete flagged log files."""
    if req.action not in ("redact", "delete"):
        raise HTTPException(400, "action must be 'redact' or 'delete'")

    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="log-scanner",
            stage=stage,
            endpoint="/api/logs/redact",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    ext_set = set(req.extensions)
    all_files: List[str] = []
    emit("run_start", {"paths": req.paths, "action": req.action, "recursive": req.recursive})

    for p in req.paths:
        pp = Path(p)
        if pp.is_file():
            all_files.append(str(pp))
        elif pp.is_dir():
            glob = "**/*" if req.recursive else "*"
            for f in pp.glob(glob):
                if f.is_file() and (not req.extensions or f.suffix in ext_set):
                    all_files.append(str(f))

    # First scan to find only files that actually contain secrets
    flagged = []
    for f in all_files:
        result = scan_file(f, req.patterns)
        if result.get("total_matches", 0) > 0:
            flagged.append(f)
        emit("file_scanned", {"path": f, "matches": result.get("total_matches", 0)})

    results = []
    if req.action == "redact":
        for f in flagged:
            r = redact_file(f, req.patterns, req.passes)
            results.append(r)
            emit("file_redacted", {"path": f, "redacted_entries": r.get("redacted_entries", 0), "success": r.get("success", False)})
    else:  # delete
        for f in flagged:
            ok = _secure_delete(f, req.passes)
            results.append({"path": f, "deleted": ok})
            emit("file_deleted", {"path": f, "deleted": ok})

    succeeded = sum(1 for r in results if r.get("success", r.get("deleted", False)))
    emit(
        "run_complete",
        {
            "action": req.action,
            "files_scanned": len(all_files),
            "files_flagged": len(flagged),
            "succeeded": succeeded,
            "failed": len(results) - succeeded,
        },
        status="success" if succeeded == len(results) else "error",
    )
    return {
        "action": req.action,
        "files_scanned": len(all_files),
        "files_flagged": len(flagged),
        "succeeded": succeeded,
        "failed": len(results) - succeeded,
        "results": results,
    }
