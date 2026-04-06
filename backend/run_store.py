import asyncio
import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "securedel.db"

_TOOL_PREFIXES = [
    ("/api/delete", "file-wiper"),
    ("/api/browser", "browser-cleaner"),
    ("/api/recent", "recent-files"),
    ("/api/logs", "log-scanner"),
    ("/api/secrets", "secret-scanner"),
    ("/api/temp", "temp-cleaner"),
]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def infer_tool_id(endpoint: str) -> str:
    for prefix, tool_id in _TOOL_PREFIXES:
        if endpoint.startswith(prefix):
            return tool_id
    return "system"


def _json_or_none(payload: Any) -> Optional[str]:
    if payload is None:
        return None
    try:
        return json.dumps(payload, ensure_ascii=True)
    except (TypeError, ValueError):
        return json.dumps({"value": str(payload)}, ensure_ascii=True)


class RunStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._lock = threading.Lock()
        self._subscribers: List[asyncio.Queue] = []
        self.init_db()

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS tool_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tool_id TEXT NOT NULL,
                    source TEXT NOT NULL,
                    endpoint TEXT NOT NULL,
                    status TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    finished_at TEXT,
                    duration_ms INTEGER,
                    request_payload TEXT,
                    response_payload TEXT,
                    error_message TEXT
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tool_runs_started_at ON tool_runs(started_at DESC)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_tool_runs_tool_id ON tool_runs(tool_id)")
            conn.commit()

    def publish_event(self, event_type: str, event_payload: Dict[str, Any]) -> Dict[str, Any]:
        envelope = {"type": event_type, "event": event_payload}
        self._publish(envelope)
        return envelope

    def publish_progress(
        self,
        *,
        tool_id: str,
        stage: str,
        endpoint: str,
        request_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "in_progress",
    ) -> Dict[str, Any]:
        payload = {
            "tool_id": tool_id,
            "stage": stage,
            "endpoint": endpoint,
            "request_id": request_id,
            "status": status,
            "at": utc_now_iso(),
            "details": details or {},
        }
        return self.publish_event("progress", payload)

    def record_run(
        self,
        *,
        tool_id: str,
        source: str,
        endpoint: str,
        status: str,
        started_at: str,
        finished_at: Optional[str] = None,
        duration_ms: Optional[int] = None,
        request_payload: Any = None,
        response_payload: Any = None,
        error_message: Optional[str] = None,
    ) -> Dict[str, Any]:
        row = {
            "tool_id": tool_id,
            "source": source,
            "endpoint": endpoint,
            "status": status,
            "started_at": started_at,
            "finished_at": finished_at,
            "duration_ms": duration_ms,
            "request_payload": _json_or_none(request_payload),
            "response_payload": _json_or_none(response_payload),
            "error_message": error_message,
        }

        with self._lock:
            with self._conn() as conn:
                cursor = conn.execute(
                    """
                    INSERT INTO tool_runs
                    (tool_id, source, endpoint, status, started_at, finished_at, duration_ms,
                     request_payload, response_payload, error_message)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        row["tool_id"],
                        row["source"],
                        row["endpoint"],
                        row["status"],
                        row["started_at"],
                        row["finished_at"],
                        row["duration_ms"],
                        row["request_payload"],
                        row["response_payload"],
                        row["error_message"],
                    ),
                )
                conn.commit()
                inserted_id = int(cursor.lastrowid)

        event = {
            "id": inserted_id,
            "tool_id": row["tool_id"],
            "source": row["source"],
            "endpoint": row["endpoint"],
            "status": row["status"],
            "started_at": row["started_at"],
            "finished_at": row["finished_at"],
            "duration_ms": row["duration_ms"],
            "error_message": row["error_message"],
        }
        self.publish_event("run", event)
        return event

    def _build_filters(
        self,
        *,
        tool_id: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
        q: Optional[str] = None,
    ) -> Tuple[str, List[Any]]:
        clauses: List[str] = []
        params: List[Any] = []

        if tool_id:
            clauses.append("tool_id = ?")
            params.append(tool_id)
        if source:
            clauses.append("source = ?")
            params.append(source)
        if status:
            clauses.append("status = ?")
            params.append(status)
        if q:
            like = f"%{q}%"
            clauses.append("(endpoint LIKE ? OR error_message LIKE ? OR tool_id LIKE ?)")
            params.extend([like, like, like])

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        return where_sql, params

    def list_runs(
        self,
        *,
        limit: int = 20,
        offset: int = 0,
        tool_id: Optional[str] = None,
        source: Optional[str] = None,
        status: Optional[str] = None,
        q: Optional[str] = None,
    ) -> Dict[str, Any]:
        limit = max(1, min(limit, 200))
        offset = max(0, offset)
        where_sql, where_params = self._build_filters(tool_id=tool_id, source=source, status=status, q=q)

        with self._conn() as conn:
            count_row = conn.execute(
                f"SELECT COUNT(*) AS total FROM tool_runs {where_sql}",
                tuple(where_params),
            ).fetchone()
            rows = conn.execute(
                f"""
                SELECT id, tool_id, source, endpoint, status, started_at, finished_at, duration_ms, error_message
                FROM tool_runs
                {where_sql}
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                tuple(where_params + [limit, offset]),
            ).fetchall()

        return {
            "items": [dict(row) for row in rows],
            "total": int(count_row["total"] if count_row else 0),
            "limit": limit,
            "offset": offset,
        }

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        if queue in self._subscribers:
            self._subscribers.remove(queue)

    def _publish(self, event: Dict[str, Any]) -> None:
        stale: List[asyncio.Queue] = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                stale.append(queue)
        for queue in stale:
            self.unsubscribe(queue)


run_store = RunStore(DB_PATH)
