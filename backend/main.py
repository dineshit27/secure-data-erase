"""
SecureWipe FastAPI Backend - All 6 Security Tools
Run: uvicorn main:app --reload --port 8000
"""

import json
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from auth import get_current_user
from tool1_secure_delete import router as delete_router
from tool2_browser_cache import router as browser_router
from tool3_recent_files import router as recent_router
from tool4_log_scanner import router as log_router
from tool5_secret_scanner import router as secret_router
from tool6_temp_cleaner import router as temp_router
from run_store import infer_tool_id, run_store


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_json(payload: bytes) -> Optional[Any]:
    if not payload:
        return None
    try:
        return json.loads(payload.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None


def _should_track(path: str) -> bool:
    return path.startswith("/api/") and not path.startswith("/api/runs") and path != "/api/health"


class ClientEventRequest(BaseModel):
    tool_id: str
    action: str
    status: str = "success"
    details: Optional[Dict[str, Any]] = None


class ClientProgressRequest(BaseModel):
    tool_id: str
    stage: str
    endpoint: str
    request_id: Optional[str] = None
    status: str = "in_progress"
    details: Optional[Dict[str, Any]] = None

app = FastAPI(
    title="SecureWipe API",
    description="6-tool privacy and security suite",
    version="1.0.0"
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "https://secur-del.web.app,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_dep = [Depends(get_current_user)]

app.include_router(delete_router, prefix="/api/delete",  tags=["Secure Delete"], dependencies=auth_dep)
app.include_router(browser_router, prefix="/api/browser", tags=["Browser Cache"], dependencies=auth_dep)
app.include_router(recent_router, prefix="/api/recent",  tags=["Recent Files"], dependencies=auth_dep)
app.include_router(log_router,    prefix="/api/logs",    tags=["Log Scanner"], dependencies=auth_dep)
app.include_router(secret_router, prefix="/api/secrets", tags=["Secret Scanner"], dependencies=auth_dep)
app.include_router(temp_router,   prefix="/api/temp",    tags=["Temp Cleaner"], dependencies=auth_dep)


@app.middleware("http")
async def track_api_runs(request: Request, call_next):
    path = request.url.path
    should_track = _should_track(path)
    started_at = _utc_now_iso()
    started_ts = time.perf_counter()
    request_payload = None

    if should_track:
        body = await request.body()
        if "application/json" in request.headers.get("content-type", ""):
            request_payload = _safe_json(body)

    try:
        response = await call_next(request)
    except Exception as exc:
        if should_track:
            run_store.record_run(
                tool_id=infer_tool_id(path),
                source="backend",
                endpoint=path,
                status="error",
                started_at=started_at,
                finished_at=_utc_now_iso(),
                duration_ms=int((time.perf_counter() - started_ts) * 1000),
                request_payload=request_payload,
                error_message=str(exc),
            )
        raise

    if should_track:
        run_store.record_run(
            tool_id=infer_tool_id(path),
            source="backend",
            endpoint=path,
            status="success" if response.status_code < 400 else "error",
            started_at=started_at,
            finished_at=_utc_now_iso(),
            duration_ms=int((time.perf_counter() - started_ts) * 1000),
            request_payload=request_payload,
            response_payload={"status_code": response.status_code},
            error_message=None if response.status_code < 400 else f"HTTP {response.status_code}",
        )

    return response

@app.get("/")
def root():
    return {"status": "SecureWipe API running", "tools": 6}

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/runs")
def list_runs(
    limit: int = 20,
    offset: int = 0,
    tool_id: Optional[str] = None,
    source: Optional[str] = None,
    status: Optional[str] = None,
    q: Optional[str] = None,
):
    return run_store.list_runs(
        limit=limit,
        offset=offset,
        tool_id=tool_id,
        source=source,
        status=status,
        q=q,
    )


@app.post("/api/runs/client-event")
def create_client_event(payload: ClientEventRequest):
    event = run_store.record_run(
        tool_id=payload.tool_id,
        source="client",
        endpoint=f"client:{payload.action}",
        status=payload.status,
        started_at=_utc_now_iso(),
        finished_at=_utc_now_iso(),
        duration_ms=0,
        request_payload=payload.details,
        response_payload={"accepted": True},
    )
    return {"ok": True, "event": event}


@app.post("/api/runs/client-progress")
def create_client_progress(payload: ClientProgressRequest):
    envelope = run_store.publish_progress(
        tool_id=payload.tool_id,
        stage=payload.stage,
        endpoint=payload.endpoint,
        request_id=payload.request_id,
        details=payload.details,
        status=payload.status,
    )
    return {"ok": True, "envelope": envelope}


@app.get("/api/runs/stream")
async def stream_runs():
    queue = run_store.subscribe()

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'ready'})}\n\n"
            while True:
                envelope = await queue.get()
                yield f"data: {json.dumps(envelope)}\n\n"
        finally:
            run_store.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.websocket("/api/runs/ws")
async def stream_runs_ws(websocket: WebSocket):
    await websocket.accept()
    queue = run_store.subscribe()
    await websocket.send_json({"type": "ready"})
    try:
        while True:
            envelope = await queue.get()
            await websocket.send_json(envelope)
    except WebSocketDisconnect:
        pass
    finally:
        run_store.unsubscribe(queue)
