import { supabase } from "@/lib/supabase";

const envApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

// Use deployed backend in production while keeping localhost fallback for local dev.
export const API_BASE = (envApiBase && envApiBase.length > 0
    ? envApiBase
    : "http://localhost:8000").replace(/\/$/, "");

export interface ToolRun {
    id: number;
    tool_id: string;
    source: "backend" | "client";
    endpoint: string;
    status: "success" | "error" | string;
    started_at: string;
    finished_at?: string | null;
    duration_ms?: number | null;
    error_message?: string | null;
}

export interface ToolProgressEvent {
    tool_id: string;
    stage: string;
    endpoint: string;
    request_id?: string | null;
    status: string;
    at: string;
    details: Record<string, unknown>;
}

interface StreamEnvelope {
    type: "ready" | "run" | "progress" | string;
    event?: unknown;
}

export interface RunsQuery {
    limit?: number;
    offset?: number;
    toolId?: string;
    source?: "backend" | "client" | "all";
    status?: "success" | "error" | "all";
    q?: string;
}

export interface RunsPage {
    items: ToolRun[];
    total: number;
    limit: number;
    offset: number;
}

async function parseResponse(res: Response) {
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
        const message = typeof data === "string" ? data : data?.detail || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return data;
}

export async function apiPost(endpoint: string, body: object) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });
    return parseResponse(res);
}

export async function apiGet(endpoint: string) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return parseResponse(res);
}

export async function fetchRecentRuns(query: RunsQuery = {}): Promise<RunsPage> {
    const params = new URLSearchParams({
        limit: String(query.limit ?? 20),
        offset: String(query.offset ?? 0),
    });
    if (query.toolId) params.set("tool_id", query.toolId);
    if (query.source && query.source !== "all") params.set("source", query.source);
    if (query.status && query.status !== "all") params.set("status", query.status);
    if (query.q?.trim()) params.set("q", query.q.trim());

    const data = await apiGet(`/api/runs?${params.toString()}`);
    return {
        items: data?.items ?? [],
        total: data?.total ?? 0,
        limit: data?.limit ?? (query.limit ?? 20),
        offset: data?.offset ?? (query.offset ?? 0),
    };
}

export function subscribeRunEvents(input: {
    onRun?: (run: ToolRun) => void;
    onProgress?: (progress: ToolProgressEvent) => void;
}): () => void {
    let stopped = false;
    let eventSource: EventSource | null = null;
    let socket: WebSocket | null = null;
    let fallbackTimer: number | null = null;

    const handlePayload = (payload: StreamEnvelope) => {
        if (payload?.type === "run" && payload?.event && input.onRun) {
            input.onRun(payload.event as ToolRun);
        }
        if (payload?.type === "progress" && payload?.event && input.onProgress) {
            input.onProgress(payload.event as ToolProgressEvent);
        }
    };

    const startWebSocket = () => {
        if (stopped || socket) return;
        const wsBase = API_BASE.replace(/^http/i, "ws");
        socket = new WebSocket(`${wsBase}/api/runs/ws`);
        socket.onmessage = (event) => {
            try {
                handlePayload(JSON.parse(event.data));
            } catch {
                // Ignore malformed events.
            }
        };
        socket.onclose = () => {
            socket = null;
            if (!stopped) {
                window.setTimeout(startWebSocket, 2000);
            }
        };
    };

    if (typeof EventSource !== "undefined") {
        eventSource = new EventSource(`${API_BASE}/api/runs/stream`);
        eventSource.onmessage = (event) => {
            try {
                handlePayload(JSON.parse(event.data));
            } catch {
                // Ignore malformed events.
            }
        };
        eventSource.onerror = () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            startWebSocket();
        };

        fallbackTimer = window.setTimeout(() => {
            if (!stopped && eventSource && eventSource.readyState !== EventSource.OPEN) {
                eventSource.close();
                eventSource = null;
                startWebSocket();
            }
        }, 5000);
    } else {
        startWebSocket();
    }

    return () => {
        stopped = true;
        if (fallbackTimer != null) window.clearTimeout(fallbackTimer);
        if (eventSource) eventSource.close();
        if (socket) socket.close();
    };
}

export function subscribeToolRuns(onRun: (run: ToolRun) => void): () => void {
    return subscribeRunEvents({ onRun });
}

export async function logClientRun(input: {
    toolId: string;
    action: string;
    status?: "success" | "error";
    details?: Record<string, unknown>;
}) {
    try {
        await apiPost("/api/runs/client-event", {
            tool_id: input.toolId,
            action: input.action,
            status: input.status ?? "success",
            details: input.details ?? {},
        });
    } catch {
        // Non-blocking telemetry path; ignore failures.
    }
}

export async function logClientProgress(input: {
    toolId: string;
    stage: string;
    endpoint: string;
    requestId?: string;
    status?: "in_progress" | "success" | "error";
    details?: Record<string, unknown>;
}) {
    try {
        await apiPost("/api/runs/client-progress", {
            tool_id: input.toolId,
            stage: input.stage,
            endpoint: input.endpoint,
            request_id: input.requestId,
            status: input.status ?? "in_progress",
            details: input.details ?? {},
        });
    } catch {
        // Non-blocking telemetry path; ignore failures.
    }
}