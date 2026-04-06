# SecureWipe FastAPI Backend

All 6 privacy/security tools exposed as a REST API.
Connect this to Lovable (React frontend) or any HTTP client.

---

## Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API docs → http://localhost:8000/docs

## Run Tracking Migration (New)

This backend now persists every tool run in SQLite for history + live dashboard updates.

- DB file: `backend/securedel.db` (auto-created on first start)
- SQL migration: `backend/migrations/001_create_tool_runs.sql`

Run tracking API:

- `GET /api/runs?limit=20&offset=0&tool_id=file-wiper&source=backend&status=success&q=wipe`
- `POST /api/runs/client-event`
- `GET /api/runs/stream` (SSE live feed)
- `WS  /api/runs/ws` (WebSocket live feed, fallback-friendly behind strict proxies)

Secure file wiper now emits stage-level progress events on the same stream channels:

- `run_start`
- `file_start`
- `pass_start`
- `pass_complete`
- `file_complete`
- `file_error`
- `run_complete`

To correlate a wipe request with progress events, send `request_id` in `POST /api/delete/wipe`.

---

## Tool 1 — Secure File Deletion
`POST /api/delete/wipe`
```json
{
  "paths": ["/home/user/secret.txt"],
  "passes": 3,
  "verify": true,
  "remove_metadata": true
}
```
- `passes`: 3 (DoD 5220.22-M), 7 (DoD extended), 35 (Gutmann)
- Returns SHA-256 before/after, time taken, bytes wiped

`POST /api/delete/wipe-folder?path=/home/user/sensitive/&passes=3`

---

## Tool 2 — Browser Cache Wiper
`GET  /api/browser/detect`          ← find installed browsers
`POST /api/browser/wipe`
```json
{
  "browsers": ["chrome", "firefox", "edge", "brave"],
  "wipe_cache": true,
  "wipe_cookies": true,
  "wipe_sessions": true,
  "passes": 3
}
```

---

## Tool 3 — Recent Files Eraser
`GET  /api/recent/detect`
`POST /api/recent/wipe`
```json
{
  "wipe_recent_files": true,
  "wipe_jump_lists": true,
  "wipe_thumbnails": true,
  "wipe_prefetch": false,
  "clear_registry": true,
  "passes": 3
}
```

---

## Tool 4 — Log File Scanner & Redactor
`GET  /api/logs/patterns`           ← list all 20+ patterns
`POST /api/logs/scan`
```json
{
  "paths": ["/var/log/app", "/home/user/app.log"],
  "recursive": true,
  "patterns": ["password", "api_key", "jwt"]
}
```
`POST /api/logs/redact`
```json
{
  "paths": ["/var/log/app"],
  "action": "redact",
  "passes": 3
}
```
- `action`: `"redact"` (replace in-place) or `"delete"` (secure wipe)

---

## Tool 5 — Secret Scanner (Code Repos)
`GET  /api/secrets/patterns`
`POST /api/secrets/scan`
```json
{
  "root": "/home/user/myproject",
  "fail_on_critical": true
}
```
`POST /api/secrets/remediate`
```json
{
  "root": "/home/user/myproject",
  "action": "redact"
}
```
`POST /api/secrets/install-hook`
```json
{
  "repo_root": "/home/user/myproject",
  "server_url": "http://localhost:8000"
}
```
Installs a git pre-commit hook that auto-scans before every commit.

---

## Tool 6 — Temp File Cleaner
`GET  /api/temp/dirs`
`POST /api/temp/scan`
```json
{
  "older_than_minutes": 60,
  "sensitive_only": true
}
```
`POST /api/temp/wipe`
```json
{
  "older_than_minutes": 30,
  "sensitive_only": false,
  "passes": 3
}
```
`POST /api/temp/monitor`
```json
{
  "start": true,
  "auto_wipe": true,
  "interval_seconds": 30,
  "passes": 3
}
```
`GET  /api/temp/monitor/log`       ← view real-time wipe events

---

## Connecting to Lovable (React)

In your Lovable project, set this base URL in your API calls:
```js
const BASE = "http://localhost:8000";
fetch(`${BASE}/api/delete/wipe`, { method: "POST", ... })
```

For production, run the backend on a server and update CORS in main.py:
```python
allow_origins=["https://your-lovable-app.lovable.app"]
```

---

## File Structure
```
secure_tools/
├── main.py                  ← FastAPI app, mounts all routers
├── tool1_secure_delete.py   ← DoD/Gutmann multi-pass file wiper
├── tool2_browser_cache.py   ← Chrome/Firefox/Edge/Brave cache wiper
├── tool3_recent_files.py    ← Jump lists, thumbnails, registry cleaner
├── tool4_log_scanner.py     ← Log redactor (20+ sensitive patterns)
├── tool5_secret_scanner.py  ← Repo secret scanner + pre-commit hook
├── tool6_temp_cleaner.py    ← Temp file monitor + secure wiper
├── requirements.txt
└── README.md
```
