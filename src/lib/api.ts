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

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function parseResponse(res: Response) {
    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
        const message = typeof data === "string" ? data : data?.detail || data?.message || `HTTP ${res.status}`;
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

export async function apiUpload(endpoint: string, formData: FormData) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
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

export interface ValidatePathResult {
    success: boolean;
    exists: boolean;
    isFile: boolean;
    name?: string;
    size?: number;
    type?: string;
    mime?: string;
    path?: string;
    status?: string;
    error?: string;
    message?: string;
}

export interface GenerateDemoResult {
    success: boolean;
    path: string;
    name: string;
    size: number;
    type: string;
    content: string;
    status: string;
    message?: string;
}

export interface UploadFileResult {
    success: boolean;
    upload_id: string;
    name: string;
    size: number;
    path: string;
    status: string;
}

export interface FileResult {
    path: string;
    name?: string;
    success: boolean;
    deleted: boolean;
    verified: boolean;
    exists_after: boolean;
    passes_done: number;
    original_size: number;
    sha256_before?: string | null;
    sha256_after?: string | null;
    error?: string | null;
    time_taken: number;
}

export interface DeleteResponse {
    total: number;
    succeeded: number;
    failed: number;
    results: FileResult[];
}

export async function validateFilePath(path: string): Promise<ValidatePathResult> {
    try {
        return await apiPost("/api/delete/validate-path", { path });
    } catch (err: any) {
        return {
            success: false,
            exists: false,
            isFile: false,
            path,
            error: "REQUEST_FAILED",
            message: err.message || "Could not validate path with backend.",
        };
    }
}

export async function generateDemoFile(): Promise<GenerateDemoResult> {
    return await apiPost("/api/delete/generate-demo", {});
}

export async function uploadSecureFile(file: File): Promise<UploadFileResult> {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/delete/upload", formData);
}

export async function deleteFilePath(
    path: string,
    passes: number = 3,
    verify: boolean = true,
    removeMetadata: boolean = true,
    requestId?: string
): Promise<FileResult> {
    return await apiPost("/api/delete/path", {
        path,
        passes,
        verify,
        remove_metadata: removeMetadata,
        request_id: requestId,
    });
}

export async function wipeFiles(
    paths: string[],
    passes: number = 3,
    verify: boolean = true,
    removeMetadata: boolean = true,
    requestId?: string
): Promise<DeleteResponse> {
    return await apiPost("/api/delete/wipe", {
        paths,
        passes,
        verify,
        remove_metadata: removeMetadata,
        request_id: requestId,
    });
}

// ── Tool 2: Browser Cache APIs ───────────────────────────────────
export async function validateCachePath(path: string) {
    return await apiPost("/api/browser/validate-path", { path });
}
export async function generateDemoCache() {
    return await apiPost("/api/browser/generate-demo", {});
}
export async function uploadCacheFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/browser/upload", formData);
}
export async function wipeCachePath(path: string, passes = 3) {
    return await apiPost("/api/browser/wipe-path", { path, passes });
}
export async function detectBrowsers() {
    return await apiGet("/api/browser/detect");
}
export async function wipeBrowsers(params: { browsers: string[]; wipe_cache?: boolean; wipe_cookies?: boolean; wipe_sessions?: boolean; passes?: number }) {
    return await apiPost("/api/browser/wipe", params);
}

// ── Tool 3: Recent Files APIs ────────────────────────────────────
export async function validateRecentPath(path: string) {
    return await apiPost("/api/recent/validate-path", { path });
}
export async function generateDemoRecent() {
    return await apiPost("/api/recent/generate-demo", {});
}
export async function uploadRecentFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/recent/upload", formData);
}
export async function cleanRecentPath(path: string, passes = 3) {
    return await apiPost("/api/recent/clean-path", { path, passes });
}
export async function detectRecent() {
    return await apiGet("/api/recent/detect");
}
export async function wipeRecent(params: { wipe_recent_files?: boolean; wipe_jump_lists?: boolean; wipe_thumbnails?: boolean; wipe_prefetch?: boolean; clear_registry?: boolean; passes?: number }) {
    return await apiPost("/api/recent/wipe", params);
}

// ── Tool 4: Log Scanner APIs ─────────────────────────────────────
export async function validateLogPath(path: string) {
    return await apiPost("/api/logs/validate-path", { path });
}
export async function generateDemoLogs() {
    return await apiPost("/api/logs/generate-demo", {});
}
export async function uploadLogFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/logs/upload", formData);
}
export async function scanLogs(params: { paths: string[]; recursive?: boolean; patterns?: string[]; extensions?: string[] }) {
    return await apiPost("/api/logs/scan", params);
}
export async function redactLogs(params: { paths: string[]; action: "redact" | "delete"; passes?: number }) {
    return await apiPost("/api/logs/redact", params);
}

// ── Tool 5: Secret Scanner APIs ──────────────────────────────────
export async function validateRepoPath(path: string) {
    return await apiPost("/api/secrets/validate-path", { path });
}
export async function generateDemoRepo() {
    return await apiPost("/api/secrets/generate-demo", {});
}
export async function uploadRepoFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/secrets/upload", formData);
}
export async function scanRepoSecrets(params: { root: string; patterns?: string[]; max_file_size_kb?: number }) {
    return await apiPost("/api/secrets/scan", params);
}
export async function remediateSecrets(params: { root: string; patterns?: string[]; action?: string; passes?: number }) {
    return await apiPost("/api/secrets/remediate", params);
}

// ── Tool 6: Temp Cleaner APIs ────────────────────────────────────
export async function validateTempPath(path: string) {
    return await apiPost("/api/temp/validate-path", { path });
}
export async function generateDemoTemp() {
    return await apiPost("/api/temp/generate-demo", {});
}
export async function uploadTempFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return await apiUpload("/api/temp/upload", formData);
}
export async function scanTempFiles(params: { directories?: string[]; older_than_minutes?: number; sensitive_only?: boolean; max_size_mb?: number }) {
    return await apiPost("/api/temp/scan", params);
}
export async function wipeTempFiles(params: { directories?: string[]; older_than_minutes?: number; sensitive_only?: boolean; passes?: number }) {
    return await apiPost("/api/temp/wipe", params);
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

export interface CommunityAnnouncement {
    id: string;
    title: string;
    type: string;
    summary: string;
    published_at: string;
}

export interface CommunityTopic {
    tag: string;
    mentions: number;
    risk: "low" | "medium" | "high" | string;
}

export interface CommunityDiscussion {
    id: string;
    title: string;
    author: string;
    replies: number;
    views: number;
    last_activity: string;
}

export interface CommunityNewsItem {
    title: string;
    url: string;
    source: string;
    published_at: string;
}

export interface CommunityThreatAlert {
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical" | string;
    scope: string;
    published_at: string;
    description: string;
}

export interface CommunityPromotedItem {
    id: string;
    name: string;
    category: string;
    blurb: string;
    url: string;
}

export interface CommunityOverview {
    meta: {
        generated_at: string;
        active_members: number;
        online_now: number;
        news_items: number;
    };
    announcements: CommunityAnnouncement[];
    trending_topics: CommunityTopic[];
    most_discussed: CommunityDiscussion[];
    security_news: CommunityNewsItem[];
    tip_of_the_day: {
        day_index: number;
        text: string;
        rotates_daily: boolean;
    };
    threat_alerts: CommunityThreatAlert[];
    promoted: CommunityPromotedItem[];
}

export async function fetchCommunityOverview(limitNews = 8): Promise<CommunityOverview> {
    const data = await apiGet(`/api/community/overview?limit_news=${encodeURIComponent(String(limitNews))}`);
    return data as CommunityOverview;
}