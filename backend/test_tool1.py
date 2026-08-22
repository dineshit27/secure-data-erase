"""
Test script to verify tool1_secure_delete backend functionality
"""
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from tool1_secure_delete import (
    ValidatePathRequest,
    validate_path,
    generate_demo,
    secure_delete_file,
    get_demo_dir,
    get_storage_uploads_dir,
)

print("=" * 60)
print("TEST 1: Generate Demo File")
print("=" * 60)
demo_res = generate_demo()
print(f"Generated Demo Response: success={demo_res.success}, path={demo_res.path}, size={demo_res.size}")
assert demo_res.success is True
assert Path(demo_res.path).exists() is True
print(f"Physical file exists on disk: {Path(demo_res.path).exists()}")

print("\n" + "=" * 60)
print("TEST 2: Validate Existing Path")
print("=" * 60)
val_res = validate_path(ValidatePathRequest(path=demo_res.path))
print(f"Validation Result: success={val_res.success}, exists={val_res.exists}, isFile={val_res.isFile}, name={val_res.name}, size={val_res.size}")
assert val_res.success is True
assert val_res.exists is True
assert val_res.isFile is True

print("\n" + "=" * 60)
print("TEST 3: Validate Non-Existent Path")
print("=" * 60)
non_exist_val = validate_path(ValidatePathRequest(path=r"C:\DoesNotExist\abc.txt"))
print(f"Non-existent Result: success={non_exist_val.success}, error={non_exist_val.error}, message={non_exist_val.message}")
assert non_exist_val.success is False
assert non_exist_val.error == "FILE_NOT_FOUND"

print("\n" + "=" * 60)
print("TEST 4: Validate Directory Path")
print("=" * 60)
dir_val = validate_path(ValidatePathRequest(path=str(get_demo_dir())))
print(f"Directory Result: success={dir_val.success}, isFile={dir_val.isFile}, error={dir_val.error}")
assert dir_val.success is False
assert dir_val.error == "DIRECTORY_DETECTED"

print("\n" + "=" * 60)
print("TEST 5: Real Secure Deletion of Demo File")
print("=" * 60)
del_res = secure_delete_file(demo_res.path, passes=3, verify=True, remove_metadata=True)
print(f"Delete Result: success={del_res.success}, deleted={del_res.deleted}, verified={del_res.verified}, exists_after={del_res.exists_after}")
assert del_res.success is True
assert del_res.deleted is True
assert del_res.verified is True
assert del_res.exists_after is False

file_still_there = Path(demo_res.path).exists()
print(f"Physical file exists after delete: {file_still_there}")
assert file_still_there is False

print("\n" + "=" * 60)
print("TEST 6: Real Secure Deletion of Upload Storage File")
print("=" * 60)
upload_dir = get_storage_uploads_dir() / "test_upload_123"
upload_dir.mkdir(parents=True, exist_ok=True)
test_upload_file = upload_dir / "demo_secret.txt"
test_upload_file.write_text("TEST UPLOAD CONTENT FOR SECUREDEL", encoding="utf-8")
print(f"Upload test file created at: {test_upload_file}")
assert test_upload_file.exists() is True

del_upload_res = secure_delete_file(str(test_upload_file), passes=3, verify=True, remove_metadata=True)
print(f"Delete Upload Result: success={del_upload_res.success}, deleted={del_upload_res.deleted}, verified={del_upload_res.verified}")
assert del_upload_res.success is True
assert test_upload_file.exists() is False
print(f"Physical uploaded file exists after delete: {test_upload_file.exists()}")

print("\n" + "=" * 60)
print("ALL BACKEND FILESYSTEM TESTS PASSED SUCCESSFULLY!")
print("=" * 60)
