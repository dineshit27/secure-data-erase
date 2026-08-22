"""
Tool 5: Secret Leakage Scanner for Code Repositories
Scans project files for hardcoded API keys, passwords, tokens before commits.
Supports real repository paths, deep code inspection, and demo repositories.
"""

import os
import re
import stat
import time
import uuid
from pathlib import Path
from typing import Callable, List, Dict, Optional, Any
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Primary Demo & Upload Directories ─────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent
DEMO_ROOT = Path("C:/SecureDel-Demo") if os.name == "nt" else BACKEND_DIR / "SecureDel-Demo"
DEMO_REPO_DIR = DEMO_ROOT / "TestRepository"
STORAGE_SECRETS_UPLOADS = BACKEND_DIR / "storage" / "uploads" / "secrets"

def get_demo_repo_dir() -> Path:
    try:
        DEMO_REPO_DIR.mkdir(parents=True, exist_ok=True)
        return DEMO_REPO_DIR
    except Exception:
        fallback = BACKEND_DIR / "SecureDel-Demo" / "TestRepository"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback

# ── Secret patterns (comprehensive) ──────────────────────────────
SECRET_PATTERNS: Dict[str, Dict[str, Any]] = {
    "aws_access_key_id": {
        "regex": re.compile(r'\bAKIA[0-9A-Z]{16}\b'),
        "severity": "CRITICAL",
        "label": "AWS Access Key ID",
    },
    "aws_secret_key": {
        "regex": re.compile(r'(?i)aws.{0,20}secret.{0,20}[=:]\s*[A-Za-z0-9/+=]{40}'),
        "severity": "CRITICAL",
        "label": "AWS Secret Access Key",
    },
    "google_api_key": {
        "regex": re.compile(r'\bAIza[0-9A-Za-z\-_]{35}\b'),
        "severity": "CRITICAL",
        "label": "Google Cloud API Key",
    },
    "github_token": {
        "regex": re.compile(r'\bgh[pousr]_[A-Za-z0-9]{36}\b'),
        "severity": "CRITICAL",
        "label": "GitHub Personal Access Token",
    },
    "stripe_secret": {
        "regex": re.compile(r'\bsk_(?:live|test)_[0-9a-zA-Z]{24,}\b'),
        "severity": "CRITICAL",
        "label": "Stripe API Secret Key",
    },
    "slack_token": {
        "regex": re.compile(r'\bxox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[0-9a-zA-Z]{24,32}\b'),
        "severity": "HIGH",
        "label": "Slack OAuth Bot Token",
    },
    "jwt_token": {
        "regex": re.compile(r'\beyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_.+/=]{10,}\b'),
        "severity": "HIGH",
        "label": "JSON Web Token (JWT)",
    },
    "db_connection_string": {
        "regex": re.compile(r'(?i)(?:mysql|postgres|postgresql|mongodb(?:\+srv)?|redis|mssql):\/\/[^\s"\':]+:[^\s"\'@]+@[^\s"\'/]+'),
        "severity": "CRITICAL",
        "label": "Database Connection URL with Credentials",
    },
    "private_key": {
        "regex": re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
        "severity": "CRITICAL",
        "label": "Private Cryptographic Key",
    },
    "generic_api_key": {
        "regex": re.compile(r'(?i)(?:api[_\-]?key|apikey|app[_\-]?secret)\s*[=:]\s*[\'"]([A-Za-z0-9\-_.]{16,})[\'"]'),
        "severity": "HIGH",
        "label": "Generic Hardcoded API Key",
    },
    "hardcoded_password": {
        "regex": re.compile(r'(?i)(?:password|passwd|pwd)\s*[=:]\s*[\'"]([^\s\'"]{6,})[\'"]'),
        "severity": "HIGH",
        "label": "Hardcoded Password Variable",
    },
}

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".next", ".nuxt", "vendor"}
SKIP_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".zip", ".tar", ".gz", ".exe", ".dll", ".so", ".pyc", ".class"}

def _redact_str(val: str) -> str:
    if len(val) <= 4:
        return "████"
    show = min(4, len(val) // 4)
    return val[:show] + "█" * max(4, len(val) - show)

# ── Core scanner ─────────────────────────────────────────────────
def scan_repo(
    root: str,
    selected_patterns: Optional[List[str]] = None,
    max_file_size_kb: int = 500,
    progress_cb: Optional[Callable[[str, Dict], None]] = None
) -> List[Dict]:
    patterns = {k: v for k, v in SECRET_PATTERNS.items() if not selected_patterns or k in selected_patterns}
    findings = []
    root_path = Path(root)
    if not root_path.exists():
        return []

    # Single file scanning
    if root_path.is_file():
        targets = [root_path]
    else:
        targets = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for filename in filenames:
                fp = Path(dirpath) / filename
                if fp.suffix.lower() not in SKIP_EXTS and fp.stat().st_size <= max_file_size_kb * 1024:
                    targets.append(fp)

    for filepath in targets:
        try:
            content = filepath.read_text(encoding="utf-8", errors="replace")
        except Exception:
            continue

        rel_file = str(filepath.relative_to(root_path)) if root_path.is_dir() else filepath.name

        for pname, pdata in patterns.items():
            for match in pdata["regex"].finditer(content):
                line_num = content[:match.start()].count("\n") + 1
                lines = content.split("\n")
                line_content = lines[line_num - 1].strip() if line_num <= len(lines) else ""
                raw_match = match.group(0)

                findings.append({
                    "file": rel_file,
                    "absolute_path": str(filepath.resolve()),
                    "line": line_num,
                    "pattern": pname,
                    "type": pdata["label"],
                    "severity": pdata["severity"],
                    "match": _redact_str(raw_match),
                    "preview": line_content[:120].replace(raw_match, _redact_str(raw_match)),
                })

        if progress_cb:
            file_findings = [f for f in findings if f["file"] == rel_file]
            progress_cb("file_scanned", {"file": rel_file, "matches": len(file_findings)})

    return findings

# ── Pydantic models ───────────────────────────────────────────────
class ValidateRepoPathRequest(BaseModel):
    path: str

class ValidateRepoPathResponse(BaseModel):
    success: bool
    exists: bool
    isDir: bool
    name: Optional[str] = None
    path: Optional[str] = None
    fileCount: int = 0
    dirCount: int = 0
    totalBytes: int = 0
    isGitRepo: bool = False
    languages: List[str] = []
    error: Optional[str] = None
    message: Optional[str] = None

class ScanRepoRequest(BaseModel):
    root: str
    patterns: Optional[List[str]] = None
    max_file_size_kb: int = 500
    request_id: Optional[str] = None

class RemediateRequest(BaseModel):
    root: str
    patterns: Optional[List[str]] = None
    action: str = "redact"
    passes: int = 3
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────

@router.get("/patterns")
def list_patterns():
    return {
        "patterns": [
            {"id": k, "label": v["label"], "severity": v["severity"]}
            for k, v in SECRET_PATTERNS.items()
        ],
        "total": len(SECRET_PATTERNS)
    }

@router.post("/validate-path", response_model=ValidateRepoPathResponse)
@router.post("/validate", response_model=ValidateRepoPathResponse)
def validate_repo_path(req: ValidateRepoPathRequest):
    """
    Validates a repository or project directory and detects languages/files.
    """
    raw = req.path.strip().strip('"').strip("'")
    if not raw:
        return ValidateRepoPathResponse(
            success=False, exists=False, isDir=False,
            error="INVALID_PATH", message="Please enter a repository directory path."
        )

    p = Path(raw)

    ALLOWED_EXTENSIONS = {".js", ".ts", ".py", ".env", ".json", ".yaml", ".yml", ".toml", ".php", ".rb", ".go", ".sh"}
    ext_lower = p.suffix.lower()
    if p.name.lower() == ".env" or p.name.lower().startswith(".env."):
        ext_lower = ".env"
    if ext_lower and ext_lower not in ALLOWED_EXTENSIONS:
        return ValidateRepoPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="INVALID_EXTENSION",
            message=f"Invalid file extension '{ext_lower}'. Secret Leak Detector only supports: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if not p.exists():
        return ValidateRepoPathResponse(
            success=False, exists=False, isDir=False, path=raw,
            error="PATH_NOT_FOUND", message="The specified repository directory does not exist."
        )

    if p.is_file():
        return ValidateRepoPathResponse(
            success=True, exists=True, isDir=False, name=p.name,
            path=str(p.resolve()), fileCount=1, dirCount=0,
            totalBytes=p.stat().st_size, isGitRepo=False,
            languages=[p.suffix.lstrip(".").upper() or "TEXT"],
            message="Single source file ready for secret scanning."
        )

    files_count = 0
    dir_count = 0
    total_bytes = 0
    lang_set = set()
    is_git = (p / ".git").exists()

    max_scan = 2000
    for dirpath, dirnames, filenames in os.walk(str(p)):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        dir_count += len(dirnames)
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in SKIP_EXTS:
                files_count += 1
                try:
                    full_p = os.path.join(dirpath, fn)
                    total_bytes += os.path.getsize(full_p)
                except Exception:
                    pass
                if ext:
                    lang_set.add(ext.lstrip(".").upper())
            if files_count >= max_scan:
                break
        if files_count >= max_scan:
            break

    return ValidateRepoPathResponse(
        success=True, exists=True, isDir=True, name=p.name,
        path=str(p.resolve()), fileCount=files_count, dirCount=dir_count,
        totalBytes=total_bytes, isGitRepo=is_git,
        languages=sorted(list(lang_set))[:8],
        message="Repository path validated."
    )

@router.post("/generate-demo")
def generate_demo_repository():
    """
    Creates a realistic test repository in C:\\SecureDel-Demo\\TestRepository\\
    with safe, disguised test credentials.
    """
    repo_dir = get_demo_repo_dir()
    src_dir = repo_dir / "src"
    config_dir = repo_dir / "config"
    src_dir.mkdir(parents=True, exist_ok=True)
    config_dir.mkdir(parents=True, exist_ok=True)

    files = [
        (".env", "DATABASE_URL=postgresql://postgres:SuperSecretP@ss2026@127.0.0.1:5432/securedel_dev\nOPENAI_API_KEY=sk-demo-983472918472918472918472918\nSTRIPE_SECRET_KEY=sk_test_mock_dummy_sample_stripe_key\nPORT=3000\n"),
        ("src/config.ts", "export const config = {\n  awsKeyId: 'AKIAIOSFODNN7EXAMPLE',\n  awsSecret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',\n  jwtSecret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIn0.cThL2q4sK9mG',\n};\n"),
        ("config/database.json", '{\n  "db": {\n    "host": "db.internal.net",\n    "user": "app_user",\n    "password": "MasterDBPassword_99!",\n    "name": "production_data"\n  }\n}\n'),
        ("src/server.py", "import os\n\nGITHUB_TOKEN = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'\nADMIN_KEY = 'ak_live_9843729184729184'\n\ndef connect():\n    print('Connected to cluster')\n"),
        ("README.md", "# Test Repository Demo\nFictional repository created for testing SecureDel secret detection.\n"),
    ]

    for rel_path, text in files:
        f_path = repo_dir / rel_path
        f_path.parent.mkdir(parents=True, exist_ok=True)
        f_path.write_text(text, encoding="utf-8")

    return {
        "success": True,
        "path": str(repo_dir.resolve()),
        "name": repo_dir.name,
        "files_created": [f[0] for f in files],
        "message": "Demo repository created on real disk."
    }

@router.post("/scan")
def scan_secrets(req: ScanRepoRequest):
    """
    Scans a real repository for hardcoded secrets and returns exact line findings.
    """
    p = Path(req.root.strip().strip('"').strip("'"))
    if not p.exists():
        raise HTTPException(404, "Repository directory does not exist.")

    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="secret-scanner",
            stage=stage,
            endpoint="/api/secrets/scan",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    emit("run_start", {"root": str(p)})
    findings = scan_repo(str(p), req.patterns, req.max_file_size_kb, progress_cb=None)

    crit_count = sum(1 for f in findings if f["severity"] == "CRITICAL")
    high_count = sum(1 for f in findings if f["severity"] == "HIGH")
    med_count = sum(1 for f in findings if f["severity"] == "MEDIUM")

    emit(
        "run_complete",
        {
            "root": str(p),
            "findings_count": len(findings),
            "critical": crit_count,
            "high": high_count,
            "medium": med_count,
        },
        status="success"
    )

    return {
        "success": True,
        "root": str(p),
        "total_findings": len(findings),
        "critical_count": crit_count,
        "high_count": high_count,
        "medium_count": med_count,
        "findings": findings,
    }

@router.post("/remediate")
def remediate_secrets(req: RemediateRequest):
    """
    Redacts detected secrets in place across the repository files on disk.
    """
    p = Path(req.root.strip().strip('"').strip("'"))
    if not p.exists():
        raise HTTPException(404, "Repository path does not exist.")

    findings = scan_repo(str(p), req.patterns)
    modified_files = set()

    for f in findings:
        abs_path = Path(f["absolute_path"])
        if abs_path.exists() and abs_path.is_file():
            try:
                content = abs_path.read_text(encoding="utf-8", errors="replace")
                modified = content
                for pname, pdata in SECRET_PATTERNS.items():
                    modified = pdata["regex"].sub(f"<{pname.upper()}_REDACTED>", modified)
                abs_path.write_text(modified, encoding="utf-8")
                modified_files.add(str(abs_path))
            except Exception:
                pass

    return {
        "success": True,
        "remediated_findings": len(findings),
        "files_modified": len(modified_files),
        "message": f"Successfully remediated {len(findings)} secret findings in {len(modified_files)} files."
    }

@router.post("/upload")
async def upload_repo_file(file: UploadFile = File(...)):
    """
    Upload a repository file or archive to controlled storage.
    """
    upload_id = uuid.uuid4().hex[:12]
    target_dir = STORAGE_SECRETS_UPLOADS / upload_id
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = os.path.basename(file.filename or "repository.zip")
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
