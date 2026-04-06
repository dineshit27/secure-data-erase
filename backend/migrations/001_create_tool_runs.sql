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
);

CREATE INDEX IF NOT EXISTS idx_tool_runs_started_at ON tool_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_runs_tool_id ON tool_runs(tool_id);