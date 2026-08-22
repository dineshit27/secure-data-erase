"""
Comprehensive backend test suite for all 6 SecureDel security tools
"""
import os
import sys
import json
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

print("=" * 60)
print("TESTING ALL 6 SECUREDEL BACKEND TOOLS ON REAL FILESYSTEM")
print("=" * 60)

# Tool 1 Test
print("\n[TOOL 1] Secure File Deletion")
from tool1_secure_delete import generate_demo as gen_t1, validate_path as val_t1, secure_delete_file as del_t1, ValidatePathRequest
t1_demo = gen_t1()
assert Path(t1_demo.path).exists()
t1_val = val_t1(ValidatePathRequest(path=t1_demo.path))
assert t1_val.success and t1_val.exists
t1_del = del_t1(t1_demo.path, passes=3, verify=True, remove_metadata=True)
assert t1_del.success and t1_del.verified and not Path(t1_demo.path).exists()
print("[PASS] Tool 1: Real creation, validation, deletion & verification PASSED")

# Tool 2 Test
print("\n[TOOL 2] Browser Cache Wiper")
from tool2_browser_cache import generate_demo_cache, validate_cache_path, wipe_custom_cache_path, ValidateCachePathRequest, WipeCachePathRequest
t2_demo = generate_demo_cache()
assert Path(t2_demo["path"]).exists()
t2_val = validate_cache_path(ValidateCachePathRequest(path=t2_demo["path"]))
assert t2_val.success and t2_val.fileCount > 0
print(f"  Detected {t2_val.fileCount} test cache files ({t2_val.totalBytes} bytes)")
t2_wipe = wipe_custom_cache_path(WipeCachePathRequest(path=t2_demo["path"], passes=1))
assert t2_wipe["verified"] is True
print("[PASS] Tool 2: Real cache creation, scan, wipe & verification PASSED")

# Tool 3 Test
print("\n[TOOL 3] Recent Files Cleaner")
from tool3_recent_files import generate_demo_recent_files, validate_recent_path, clean_recent_path, ValidateRecentPathRequest, CleanRecentPathRequest
t3_demo = generate_demo_recent_files()
assert Path(t3_demo["path"]).exists()
t3_val = validate_recent_path(ValidateRecentPathRequest(path=t3_demo["path"]))
assert t3_val.success and t3_val.entryCount > 0
print(f"  Detected {t3_val.entryCount} history entries")
t3_clean = clean_recent_path(CleanRecentPathRequest(path=t3_demo["path"], passes=1))
assert t3_clean["verified"] is True
print("[PASS] Tool 3: Real history creation, scan, clean & verification PASSED")

# Tool 4 Test
print("\n[TOOL 4] Log Scanner")
from tool4_log_scanner import generate_demo_logs, validate_log_path, scan_logs, redact_or_delete_logs, ValidateLogPathRequest, ScanRequest, RedactRequest
t4_demo = generate_demo_logs()
assert Path(t4_demo["path"]).exists()
t4_val = validate_log_path(ValidateLogPathRequest(path=t4_demo["path"]))
assert t4_val.success and t4_val.fileCount > 0
t4_scan = scan_logs(ScanRequest(paths=[t4_demo["path"]]))
assert t4_scan["success"] and t4_scan["total_findings"] > 0
print(f"  Scanned {t4_scan['files_scanned']} files, {t4_scan['lines_scanned']} lines, found {t4_scan['total_findings']} sensitive matches")
flagged_paths = [f["path"] for f in t4_scan["flagged_files"]]
t4_redact = redact_or_delete_logs(RedactRequest(paths=flagged_paths, action="redact"))
assert t4_redact["success"] is True
print("[PASS] Tool 4: Real log creation, line scanning, findings & in-place redaction PASSED")

# Tool 5 Test
print("\n[TOOL 5] Secret Leak Detector")
from tool5_secret_scanner import generate_demo_repository, validate_repo_path, scan_secrets, remediate_secrets, ValidateRepoPathRequest, ScanRepoRequest, RemediateRequest
t5_demo = generate_demo_repository()
assert Path(t5_demo["path"]).exists()
t5_val = validate_repo_path(ValidateRepoPathRequest(path=t5_demo["path"]))
assert t5_val.success and t5_val.fileCount > 0
print(f"  Detected {t5_val.fileCount} repository source files (Languages: {', '.join(t5_val.languages)})")
t5_scan = scan_secrets(ScanRepoRequest(root=t5_demo["path"]))
assert t5_scan["success"] and t5_scan["total_findings"] > 0
print(f"  Found {t5_scan['total_findings']} secrets ({t5_scan['critical_count']} critical)")
t5_remed = remediate_secrets(RemediateRequest(root=t5_demo["path"], action="redact"))
assert t5_remed["success"] is True
print("[PASS] Tool 5: Real repo creation, scanning, secret detection & remediation PASSED")

# Tool 6 Test
print("\n[TOOL 6] Temporary File Cleaner")
from tool6_temp_cleaner import generate_demo_temp_files, validate_temp_path, scan_temp_files, wipe_temp_files, ValidateTempPathRequest, ScanTempRequest, WipeTempRequest
t6_demo = generate_demo_temp_files()
assert Path(t6_demo["path"]).exists()
t6_val = validate_temp_path(ValidateTempPathRequest(path=t6_demo["path"]))
assert t6_val.success and t6_val.fileCount > 0
print(f"  Detected {t6_val.fileCount} temp files ({t6_val.totalBytes} bytes)")
t6_scan = scan_temp_files(ScanTempRequest(directories=[t6_demo["path"]]))
assert t6_scan["success"] and t6_scan["files_found"] > 0
t6_wipe = wipe_temp_files(WipeTempRequest(directories=[t6_demo["path"]], passes=1))
assert t6_wipe["verified"] is True
print("[PASS] Tool 6: Real temp file creation, scanning, wipe & verification PASSED")

print("\n" + "=" * 60)
print("ALL 6 SECURITY TOOLS PASSED COMPLETE REAL FILESYSTEM VERIFICATION!")
print("=" * 60)

