"""
Tool 5: Secret Leakage Scanner for Code Repositories
Scans project files for hardcoded API keys, passwords, tokens before commits.
"""

import os
import re
import stat
import subprocess
from pathlib import Path
from typing import Callable, List, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Secret patterns (comprehensive) ──────────────────────────────
SECRET_PATTERNS: Dict[str, Dict] = {
    # AWS
    "aws_access_key_id":     {"regex": re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
                               "severity": "critical"},
    "aws_secret_key":        {"regex": re.compile(r'(?i)aws.{0,20}secret.{0,20}[=:]\s*[A-Za-z0-9/+=]{40}'),
                               "severity": "critical"},

    # Google
    "google_api_key":        {"regex": re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
                               "severity": "critical"},
    "google_oauth":          {"regex": re.compile(r'[0-9]+-[0-9A-Za-z_]{32}\.apps\.googleusercontent\.com'),
                               "severity": "high"},

    # GitHub / GitLab
    "github_token":          {"regex": re.compile(r'gh[pousr]_[A-Za-z0-9]{36}'),
                               "severity": "critical"},
    "github_classic":        {"regex": re.compile(r'\bghp_[A-Za-z0-9]{36}\b'),
                               "severity": "critical"},
    "gitlab_token":          {"regex": re.compile(r'glpat-[A-Za-z0-9\-_]{20}'),
                               "severity": "critical"},

    # Stripe
    "stripe_secret":         {"regex": re.compile(r'sk_(live|test)_[0-9a-zA-Z]{24,}'),
                               "severity": "critical"},
    "stripe_publishable":    {"regex": re.compile(r'pk_(live|test)_[0-9a-zA-Z]{24,}'),
                               "severity": "medium"},

    # Slack
    "slack_bot_token":       {"regex": re.compile(r'xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}'),
                               "severity": "high"},
    "slack_webhook":         {"regex": re.compile(r'https://hooks\.slack\.com/services/[A-Za-z0-9/]+'),
                               "severity": "high"},

    # Twilio / SendGrid
    "twilio_account_sid":    {"regex": re.compile(r'AC[0-9a-fA-F]{32}'),
                               "severity": "high"},
    "sendgrid_key":          {"regex": re.compile(r'SG\.[A-Za-z0-9\-_]{22}\.[A-Za-z0-9\-_]{43}'),
                               "severity": "critical"},

    # Tokens & secrets
    "jwt":                   {"regex": re.compile(r'eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+'),
                               "severity": "high"},
    "bearer_token":          {"regex": re.compile(r'(?i)bearer\s+[A-Za-z0-9\-._~+/]{20,}'),
                               "severity": "high"},
    "generic_api_key":       {"regex": re.compile(r'(?i)(api[_\-]?key|apikey|api_secret)\s*[=:]\s*["\']?[A-Za-z0-9\-_.]{16,}'),
                               "severity": "high"},
    "generic_secret":        {"regex": re.compile(r'(?i)(secret[_\-]?key|client[_\-]?secret|app[_\-]?secret)\s*[=:]\s*["\']?[A-Za-z0-9\-_.]{8,}'),
                               "severity": "high"},
    "generic_password":      {"regex": re.compile(r'(?i)(password|passwd|pwd)\s*[=:]\s*["\']?\S{6,}'),
                               "severity": "medium"},

    # Database
    "db_connection_string":  {"regex": re.compile(r'(?i)(mysql|postgres|mongodb|redis|mssql|sqlite)://[^"\s]+'),
                               "severity": "critical"},

    # Private keys / certs
    "private_key":           {"regex": re.compile(r'-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
                               "severity": "critical"},
    "pgp_private":           {"regex": re.compile(r'-----BEGIN PGP PRIVATE KEY BLOCK-----'),
                               "severity": "critical"},

    # Mailgun / Azure / Heroku
    "mailgun_api_key":       {"regex": re.compile(r'key-[0-9a-zA-Z]{32}'),
                               "severity": "high"},
    "azure_storage_key":     {"regex": re.compile(r'(?i)DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]+'),
                               "severity": "critical"},
    "heroku_api_key":        {"regex": re.compile(r'(?i)heroku.{0,20}[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}'),
                               "severity": "high"},
}

# Files/dirs to skip
SKIP_DIRS  = {".git", "node_modules", "__pycache__", ".venv", "venv",
              "dist", "build", ".next", ".nuxt", "vendor"}
SKIP_EXTS  = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff",
              ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".zip", ".tar",
              ".gz", ".exe", ".dll", ".so", ".pyc", ".class"}

# ── Core scanner ─────────────────────────────────────────────────
def scan_repo(root: str, selected_patterns: Optional[List[str]] = None,
              max_file_size_kb: int = 500,
              progress_cb: Optional[Callable[[str, Dict], None]] = None) -> List[Dict]:
    patterns = {k: v for k, v in SECRET_PATTERNS.items()
                if not selected_patterns or k in selected_patterns}

    findings = []
    root_path = Path(root)
    if not root_path.exists():
        return []

    for dirpath, dirnames, filenames in os.walk(root):
        # Prune ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]

        for filename in filenames:
            filepath = Path(dirpath) / filename
            if filepath.suffix.lower() in SKIP_EXTS:
                continue
            if filepath.stat().st_size > max_file_size_kb * 1024:
                continue

            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue

            for pname, pdata in patterns.items():
                for match in pdata["regex"].finditer(content):
                    line_num = content[:match.start()].count("\n") + 1
                    line_content = content.split("\n")[line_num - 1].strip()
                    findings.append({
                        "file": str(filepath.relative_to(root_path)),
                        "absolute_path": str(filepath),
                        "line": line_num,
                        "pattern": pname,
                        "severity": pdata["severity"],
                        "preview": line_content[:100],
                    })

            if progress_cb:
                rel_file = str(filepath.relative_to(root_path))
                file_findings = [f for f in findings if f["file"] == rel_file]
                progress_cb("file_scanned", {"file": rel_file, "matches": len(file_findings)})

    return findings

def _redact_secret_in_file(filepath: str, patterns: Dict) -> int:
    """Replace secret values with placeholder strings."""
    try:
        content = Path(filepath).read_text(encoding="utf-8", errors="replace")
        modified = content
        count = 0
        for pname, pdata in patterns.items():
            new, n = pdata["regex"].subn(f"<{pname.upper()}_REMOVED>", modified)
            modified = new
            count += n
        if count > 0:
            os.chmod(filepath, stat.S_IWRITE | stat.S_IREAD)
            Path(filepath).write_text(modified, encoding="utf-8")
        return count
    except Exception:
        return 0

def _install_precommit_hook(repo_root: str, server_url: str) -> Dict:
    """Install a git pre-commit hook that calls this API before each commit."""
    hook_path = Path(repo_root) / ".git" / "hooks" / "pre-commit"
    if not (Path(repo_root) / ".git").exists():
        return {"success": False, "reason": "Not a git repository"}

    hook_script = f"""#!/bin/sh
# SecureWipe pre-commit hook - checks for secrets before commit
echo "[SecureWipe] Scanning for secrets..."
python3 -c "
import urllib.request, json, sys
req = urllib.request.Request(
    '{server_url}/api/secrets/scan',
    data=json.dumps({{'root': '.', 'fail_on_critical': True}}).encode(),
    headers={{'Content-Type': 'application/json'}},
    method='POST'
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
        critical = [f for f in data.get('findings', []) if f.get('severity') == 'critical']
        if critical:
            print(f'[SecureWipe] BLOCKED: {{len(critical)}} critical secret(s) found!')
            for f in critical[:5]:
                print(f'  {{f[\"file\"]}}:{{f[\"line\"]}} - {{f[\"pattern\"]}}')
            sys.exit(1)
        print(f'[SecureWipe] OK: no critical secrets found.')
except Exception as e:
    print(f'[SecureWipe] Warning: scan failed ({{e}}), proceeding.')
"
"""
    try:
        hook_path.write_text(hook_script)
        hook_path.chmod(0o755)
        return {"success": True, "hook_path": str(hook_path)}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ── Pydantic models ───────────────────────────────────────────────
class ScanRepoRequest(BaseModel):
    root: str
    patterns: Optional[List[str]] = None
    fail_on_critical: bool = False
    max_file_size_kb: int = 500
    request_id: Optional[str] = None

class RemediateRequest(BaseModel):
    root: str
    patterns: Optional[List[str]] = None
    action: str = "redact"   # "redact" or "flag"
    passes: int = 3
    request_id: Optional[str] = None

class HookRequest(BaseModel):
    repo_root: str
    server_url: str = "http://localhost:8000"
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────
@router.get("/patterns")
def list_patterns():
    return {"patterns": {k: {"severity": v["severity"]} for k, v in SECRET_PATTERNS.items()}}

@router.post("/scan")
def scan_for_secrets(req: ScanRepoRequest):
    """Scan a project directory for hardcoded secrets."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="secret-scanner",
            stage=stage,
            endpoint="/api/secrets/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    emit("run_start", {"root": req.root, "max_file_size_kb": req.max_file_size_kb})
    findings = scan_repo(req.root, req.patterns, req.max_file_size_kb, progress_cb=emit)
    by_severity = {}
    for f in findings:
        by_severity.setdefault(f["severity"], []).append(f)

    emit(
        "run_complete",
        {
            "root": req.root,
            "total_findings": len(findings),
            "by_severity": {k: len(v) for k, v in by_severity.items()},
        },
        status="error" if req.fail_on_critical and bool(by_severity.get("critical")) else "success",
    )

    return {
        "root": req.root,
        "total_findings": len(findings),
        "by_severity": {k: len(v) for k, v in by_severity.items()},
        "findings": findings,
        "blocked": req.fail_on_critical and bool(by_severity.get("critical")),
    }

@router.post("/remediate")
def remediate_secrets(req: RemediateRequest):
    """Redact or flag secrets found in repository files."""
    if req.action not in ("redact", "flag"):
        raise HTTPException(400, "action must be 'redact' or 'flag'")

    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="secret-scanner",
            stage=stage,
            endpoint="/api/secrets/remediate",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    emit("run_start", {"root": req.root, "action": req.action})
    findings = scan_repo(req.root, req.patterns)
    if not findings:
        emit("run_complete", {"message": "No secrets found", "remediated": 0}, status="success")
        return {"message": "No secrets found", "remediated": 0}

    # Group by file
    files = {}
    for f in findings:
        files.setdefault(f["absolute_path"], []).append(f)

    results = []
    if req.action == "redact":
        patterns = {k: v for k, v in SECRET_PATTERNS.items()
                    if not req.patterns or k in req.patterns}
        for filepath, file_findings in files.items():
            count = _redact_secret_in_file(filepath, patterns)
            results.append({"file": filepath, "redacted": count})
            emit("file_redacted", {"file": filepath, "redacted": count})
    else:  # flag only
        for filepath, file_findings in files.items():
            results.append({"file": filepath, "flagged": len(file_findings),
                            "details": file_findings})
            emit("file_flagged", {"file": filepath, "flagged": len(file_findings)})

    emit(
        "run_complete",
        {
            "action": req.action,
            "files_processed": len(files),
            "total_secrets": len(findings),
        },
        status="success",
    )

    return {
        "action": req.action,
        "files_processed": len(files),
        "total_secrets": len(findings),
        "results": results,
    }

@router.post("/install-hook")
def install_precommit_hook(req: HookRequest):
    """Install git pre-commit hook to block commits with critical secrets."""
    run_store.publish_progress(
        tool_id="secret-scanner",
        stage="hook_install_start",
        endpoint="/api/secrets/install-hook",
        request_id=req.request_id,
        details={"repo_root": req.repo_root},
        status="in_progress",
    )
    result = _install_precommit_hook(req.repo_root, req.server_url)
    run_store.publish_progress(
        tool_id="secret-scanner",
        stage="hook_install_complete",
        endpoint="/api/secrets/install-hook",
        request_id=req.request_id,
        details=result,
        status="success" if result.get("success") else "error",
    )
    return result
