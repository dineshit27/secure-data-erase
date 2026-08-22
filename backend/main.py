"""
SecureWipe FastAPI Backend - All 6 Security Tools
Run: uvicorn main:app --reload --port 8000
"""

import json
import os
import time
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from xml.etree import ElementTree

import httpx
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


COMMUNITY_TIPS = [
    "Enable multi-factor authentication on every account that supports it.",
    "Use a password manager and avoid reusing passwords across services.",
    "Review app permissions monthly and revoke access you no longer use.",
    "Update your OS and browser weekly to patch known vulnerabilities.",
    "Never open unexpected attachments, even if the sender looks familiar.",
    "Keep encrypted offline backups to recover from ransomware attacks.",
    "Rotate API keys and tokens regularly, especially after staff changes.",
]

COMMUNITY_ANNOUNCEMENTS = [
    {
        "id": "ann-001",
        "title": "SecureDel v1.1 released",
        "type": "feature",
        "summary": "Added stronger scan patterns for secret detection and improved temp cleaner speed.",
        "published_at": "2026-04-08T11:30:00Z",
    },
    {
        "id": "ann-002",
        "title": "Security hardening update",
        "type": "security",
        "summary": "Backend request validation expanded for tool endpoints and run telemetry ingestion.",
        "published_at": "2026-04-07T15:00:00Z",
    },
    {
        "id": "ann-003",
        "title": "UX update for Try Now flows",
        "type": "product",
        "summary": "Tool cards now include clearer risk context and guided action hints.",
        "published_at": "2026-04-06T09:00:00Z",
    },
]

COMMUNITY_TRENDING_TOPICS = [
    {"tag": "#Ransomware", "mentions": 286, "risk": "high"},
    {"tag": "#DataLeak", "mentions": 241, "risk": "high"},
    {"tag": "#ZeroDay", "mentions": 174, "risk": "high"},
    {"tag": "#Phishing", "mentions": 162, "risk": "medium"},
    {"tag": "#SupplyChain", "mentions": 139, "risk": "medium"},
    {"tag": "#CloudMisconfig", "mentions": 117, "risk": "medium"},
    {"tag": "#CredentialStuffing", "mentions": 105, "risk": "medium"},
    {"tag": "#IoTSecurity", "mentions": 87, "risk": "low"},
]

COMMUNITY_DISCUSSIONS = [
    {
        "id": "thread-1001",
        "title": "Best recovery plan after a ransomware hit on endpoints?",
        "author": "soc_analyst_21",
        "replies": 92,
        "views": 1404,
        "last_activity": "2026-04-09T07:45:00Z",
    },
    {
        "id": "thread-1002",
        "title": "How to rotate leaked API keys without production downtime",
        "author": "devsecops_k",
        "replies": 76,
        "views": 1208,
        "last_activity": "2026-04-09T06:18:00Z",
    },
    {
        "id": "thread-1003",
        "title": "Windows temp directories that often contain sensitive remnants",
        "author": "forensic_maya",
        "replies": 63,
        "views": 984,
        "last_activity": "2026-04-09T05:52:00Z",
    },
    {
        "id": "thread-1004",
        "title": "Practical checklist for preventing data exfiltration",
        "author": "blue_team_raj",
        "replies": 58,
        "views": 901,
        "last_activity": "2026-04-08T23:31:00Z",
    },
]

COMMUNITY_THREAT_ALERTS = [
    {
        "id": "thr-901",
        "title": "Active phishing campaign targeting password manager users",
        "severity": "high",
        "scope": "global",
        "published_at": "2026-04-09T05:30:00Z",
        "description": "Multiple fake login portals are harvesting credentials and session tokens.",
    },
    {
        "id": "thr-902",
        "title": "Critical web framework RCE reported",
        "severity": "critical",
        "scope": "enterprise",
        "published_at": "2026-04-09T03:20:00Z",
        "description": "Exploit attempts observed in the wild. Patch and restrict exposure immediately.",
    },
    {
        "id": "thr-903",
        "title": "Credential stuffing surge detected",
        "severity": "medium",
        "scope": "consumer",
        "published_at": "2026-04-08T22:10:00Z",
        "description": "Large botnet activity targeting reused credentials on major web services.",
    },
]

COMMUNITY_PROMOTED = [
    {
        "id": "ad-001",
        "name": "Sentinel VPN Pro",
        "category": "vpn",
        "blurb": "Encrypted multi-hop VPN with kill switch and DNS leak protection.",
        "url": "https://example.com/sentinel-vpn",
    },
    {
        "id": "ad-002",
        "name": "ZeroTrace Antivirus",
        "category": "antivirus",
        "blurb": "Behavior-based malware detection with ransomware rollback.",
        "url": "https://example.com/zerotrace-av",
    },
    {
        "id": "ad-003",
        "name": "VaultPass Teams",
        "category": "password-manager",
        "blurb": "Enterprise password manager with secrets sharing and audit logs.",
        "url": "https://example.com/vaultpass",
    },
]

SECURITY_FEEDS = [
    {"source": "CISA Alerts", "url": "https://www.cisa.gov/uscert/ncas/alerts.xml"},
    {"source": "Krebs on Security", "url": "https://krebsonsecurity.com/feed/"},
    {"source": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews"},
]


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


def _to_iso(value: Optional[str]) -> str:
    if not value:
        return _utc_now_iso()
    cleaned = value.strip()
    if not cleaned:
        return _utc_now_iso()
    if cleaned.endswith("Z"):
        return cleaned
    try:
        dt = parsedate_to_datetime(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return _utc_now_iso()


def _extract_news_items(xml_text: str, source: str, limit: int) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    root = ElementTree.fromstring(xml_text)

    rss_items = root.findall(".//item")
    atom_entries = root.findall(".//{http://www.w3.org/2005/Atom}entry")

    if rss_items:
        for node in rss_items:
            title = (node.findtext("title") or "Untitled alert").strip()
            link = (node.findtext("link") or "").strip()
            published = _to_iso(node.findtext("pubDate"))
            if title and link:
                items.append(
                    {
                        "title": title,
                        "url": link,
                        "source": source,
                        "published_at": published,
                    }
                )
            if len(items) >= limit:
                break
        return items

    for node in atom_entries:
        title = (node.findtext("{http://www.w3.org/2005/Atom}title") or "Untitled alert").strip()
        published = _to_iso(node.findtext("{http://www.w3.org/2005/Atom}updated"))
        link = ""
        for link_node in node.findall("{http://www.w3.org/2005/Atom}link"):
            href = (link_node.attrib.get("href") or "").strip()
            if href:
                link = href
                break
        if title and link:
            items.append(
                {
                    "title": title,
                    "url": link,
                    "source": source,
                    "published_at": published,
                }
            )
        if len(items) >= limit:
            break
    return items


async def _fetch_security_news(limit: int = 8) -> List[Dict[str, str]]:
    per_feed = max(2, min(5, limit))
    aggregated: List[Dict[str, str]] = []

    async with httpx.AsyncClient(timeout=7.5, follow_redirects=True) as client:
        for feed in SECURITY_FEEDS:
            if len(aggregated) >= limit:
                break
            try:
                response = await client.get(feed["url"])
                if response.status_code >= 400:
                    continue
                parsed = _extract_news_items(response.text, feed["source"], per_feed)
                aggregated.extend(parsed)
            except (httpx.HTTPError, ElementTree.ParseError):
                continue

    aggregated.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    deduped: List[Dict[str, str]] = []
    seen_urls = set()
    for item in aggregated:
        url = item.get("url")
        if not url or url in seen_urls:
            continue
        deduped.append(item)
        seen_urls.add(url)
        if len(deduped) >= limit:
            break

    if deduped:
        return deduped

    now_iso = _utc_now_iso()
    return [
        {
            "title": "CISA highlights increased phishing and social engineering activity",
            "url": "https://www.cisa.gov/news-events/cybersecurity-advisories",
            "source": "CISA Alerts",
            "published_at": now_iso,
        },
        {
            "title": "Defenders urged to prioritize patching internet-facing services",
            "url": "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
            "source": "CISA KEV",
            "published_at": now_iso,
        },
    ]


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
        "https://secur-del.web.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000,http://127.0.0.1:5000",
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

app.include_router(delete_router, prefix="/api/delete",     tags=["Secure Delete"], dependencies=auth_dep)
app.include_router(delete_router, prefix="/api/filesystem", tags=["Filesystem"],    dependencies=auth_dep)
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
                request_payload=None,
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
            request_payload=None,
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


@app.get("/api/community/overview")
async def community_overview(limit_news: int = 8):
    now = datetime.now(timezone.utc)
    tip_index = now.toordinal() % len(COMMUNITY_TIPS)

    trending = sorted(COMMUNITY_TRENDING_TOPICS, key=lambda x: x["mentions"], reverse=True)
    discussed = sorted(COMMUNITY_DISCUSSIONS, key=lambda x: (x["replies"], x["views"]), reverse=True)
    alerts = sorted(COMMUNITY_THREAT_ALERTS, key=lambda x: x["published_at"], reverse=True)
    news_items = await _fetch_security_news(limit=max(3, min(limit_news, 15)))

    return {
        "meta": {
            "generated_at": _utc_now_iso(),
            "active_members": 1234,
            "online_now": 187,
            "news_items": len(news_items),
        },
        "announcements": COMMUNITY_ANNOUNCEMENTS,
        "trending_topics": trending,
        "most_discussed": discussed,
        "security_news": news_items,
        "tip_of_the_day": {
            "day_index": tip_index,
            "text": COMMUNITY_TIPS[tip_index],
            "rotates_daily": True,
        },
        "threat_alerts": alerts,
        "promoted": COMMUNITY_PROMOTED,
    }


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
