"""
Tool 3: Recent Files & Jump List Eraser
Detects and securely erases recent file history, jump lists, thumbnail cache.
"""

import os
import sys
import stat
import shutil
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from run_store import run_store

router = APIRouter()

# ── Platform-specific paths ───────────────────────────────────────
def get_recent_paths() -> Dict[str, List[str]]:
    home = Path.home()
    is_win = sys.platform == "win32"
    is_mac = sys.platform == "darwin"

    if is_win:
        appdata  = Path(os.environ.get("APPDATA", ""))
        local    = Path(os.environ.get("LOCALAPPDATA", ""))
        return {
            "recent_files": [
                str(appdata / "Microsoft/Windows/Recent"),
            ],
            "jump_lists": [
                str(appdata / "Microsoft/Windows/Recent/AutomaticDestinations"),
                str(appdata / "Microsoft/Windows/Recent/CustomDestinations"),
            ],
            "thumbnails": [
                str(local / "Microsoft/Windows/Explorer"),
            ],
            "prefetch": [
                r"C:\Windows\Prefetch",
            ],
            "registry_keys": [
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\TypedPaths",
            ],
        }
    elif is_mac:
        return {
            "recent_files": [
                str(home / "Library/Application Support/com.apple.sharedfilelist"),
            ],
            "thumbnails": [
                str(home / "Library/Caches/com.apple.QuickLook.thumbnailcache"),
            ],
            "jump_lists": [],
            "prefetch": [],
            "registry_keys": [],
        }
    else:  # Linux
        return {
            "recent_files": [
                str(home / ".local/share/recently-used.xbel"),
            ],
            "thumbnails": [
                str(home / ".cache/thumbnails"),
                str(home / ".thumbnails"),
            ],
            "jump_lists": [],
            "prefetch": [],
            "registry_keys": [],
        }

# ── Secure wipe helper ────────────────────────────────────────────
def _wipe_file(path: str, passes: int = 3) -> bool:
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

def _wipe_directory(path: str, passes: int) -> Dict:
    p = Path(path)
    wiped, failed, total_bytes = 0, 0, 0
    if not p.exists():
        return {"path": path, "exists": False, "wiped": 0, "failed": 0, "bytes": 0}
    for f in p.rglob("*"):
        if f.is_file():
            total_bytes += f.stat().st_size
            if _wipe_file(str(f), passes):
                wiped += 1
            else:
                failed += 1
    try:
        shutil.rmtree(str(p), ignore_errors=True)
    except Exception:
        pass
    return {"path": path, "exists": True, "wiped": wiped, "failed": failed, "bytes": total_bytes}

def _wipe_linux_xbel(path: str) -> Dict:
    """Wipe Linux recently-used.xbel XML file contents."""
    p = Path(path)
    if not p.exists():
        return {"path": path, "exists": False, "cleared": False}
    try:
        tree = ET.parse(str(p))
        root = tree.getroot()
        # Remove all <bookmark> entries
        for child in list(root):
            root.remove(child)
        # Write empty structure back
        tree.write(str(p), xml_declaration=True, encoding="utf-8")
        # Then securely overwrite the file with zeros before removing
        _wipe_file(str(p))
        # Recreate empty file so apps don't crash
        p.write_text('<?xml version="1.0" encoding="UTF-8"?>\n<xbel version="1.0"/>\n')
        return {"path": path, "exists": True, "cleared": True}
    except Exception as e:
        return {"path": path, "exists": True, "cleared": False, "error": str(e)}

def _clear_windows_registry_key(key: str) -> Dict:
    """Delete a Windows registry key using reg.exe."""
    if sys.platform != "win32":
        return {"key": key, "cleared": False, "reason": "Not Windows"}
    try:
        result = subprocess.run(
            ["reg", "delete", key, "/f"],
            capture_output=True, text=True, timeout=10
        )
        return {"key": key, "cleared": result.returncode == 0,
                "output": result.stdout.strip() or result.stderr.strip()}
    except Exception as e:
        return {"key": key, "cleared": False, "error": str(e)}

# ── Pydantic models ───────────────────────────────────────────────
class RecentWipeRequest(BaseModel):
    wipe_recent_files: bool = True
    wipe_jump_lists: bool = True
    wipe_thumbnails: bool = True
    wipe_prefetch: bool = False   # Requires admin on Windows
    clear_registry: bool = True
    passes: int = 3
    request_id: Optional[str] = None

# ── Routes ────────────────────────────────────────────────────────
@router.get("/detect")
def detect_recent_paths():
    """Detect all recent file trail locations on this system."""
    paths = get_recent_paths()
    found = {}
    for category, items in paths.items():
        existing = [p for p in items if Path(p).exists()]
        if existing:
            found[category] = existing
    return {"platform": sys.platform, "detected": found}

@router.post("/wipe")
def wipe_recent_files(req: RecentWipeRequest):
    """Securely erase recent file history, jump lists, thumbnails, and registry."""
    def emit(stage: str, details: Dict, status: str = "in_progress"):
        run_store.publish_progress(
            tool_id="recent-files",
            stage=stage,
            endpoint="/api/recent/wipe",
            request_id=req.request_id,
            details=details,
            status=status,
        )

    paths = get_recent_paths()
    report = {}
    summary = {"wiped_files": 0, "failed_files": 0, "bytes_wiped": 0,
                "registry_keys_cleared": 0}
    emit("run_start", {"passes": req.passes, "platform": sys.platform})

    if req.wipe_recent_files:
        emit("category_start", {"category": "recent_files", "targets": len(paths.get("recent_files", []))})
        results = []
        for p in paths.get("recent_files", []):
            fp = Path(p)
            if fp.is_file() and fp.suffix == ".xbel":
                results.append(_wipe_linux_xbel(p))
            elif fp.is_file():
                ok = _wipe_file(p, req.passes)
                results.append({"path": p, "exists": True, "wiped": ok})
            elif fp.is_dir():
                r = _wipe_directory(p, req.passes)
                summary["wiped_files"]  += r["wiped"]
                summary["failed_files"] += r["failed"]
                summary["bytes_wiped"]  += r["bytes"]
                results.append(r)
        report["recent_files"] = results
        emit("category_complete", {"category": "recent_files", "results": len(results)})

    if req.wipe_jump_lists:
        emit("category_start", {"category": "jump_lists", "targets": len(paths.get("jump_lists", []))})
        results = [_wipe_directory(p, req.passes) for p in paths.get("jump_lists", [])]
        for r in results:
            summary["wiped_files"]  += r.get("wiped", 0)
            summary["failed_files"] += r.get("failed", 0)
            summary["bytes_wiped"]  += r.get("bytes", 0)
        report["jump_lists"] = results
        emit("category_complete", {"category": "jump_lists", "results": len(results)})

    if req.wipe_thumbnails:
        emit("category_start", {"category": "thumbnails", "targets": len(paths.get("thumbnails", []))})
        results = [_wipe_directory(p, req.passes) for p in paths.get("thumbnails", [])]
        for r in results:
            summary["wiped_files"]  += r.get("wiped", 0)
            summary["failed_files"] += r.get("failed", 0)
            summary["bytes_wiped"]  += r.get("bytes", 0)
        report["thumbnails"] = results
        emit("category_complete", {"category": "thumbnails", "results": len(results)})

    if req.wipe_prefetch:
        emit("category_start", {"category": "prefetch", "targets": len(paths.get("prefetch", []))})
        results = [_wipe_directory(p, req.passes) for p in paths.get("prefetch", [])]
        for r in results:
            summary["wiped_files"]  += r.get("wiped", 0)
            summary["failed_files"] += r.get("failed", 0)
            summary["bytes_wiped"]  += r.get("bytes", 0)
        report["prefetch"] = results
        emit("category_complete", {"category": "prefetch", "results": len(results)})

    if req.clear_registry and sys.platform == "win32":
        emit("category_start", {"category": "registry", "targets": len(paths.get("registry_keys", []))})
        reg_results = [_clear_windows_registry_key(k) for k in paths.get("registry_keys", [])]
        summary["registry_keys_cleared"] = sum(1 for r in reg_results if r.get("cleared"))
        report["registry"] = reg_results
        emit("category_complete", {"category": "registry", "cleared": summary["registry_keys_cleared"]})

    emit(
        "run_complete",
        {"summary": summary, "platform": sys.platform},
        status="success" if summary["failed_files"] == 0 else "error",
    )

    return {"summary": summary, "details": report, "platform": sys.platform}
