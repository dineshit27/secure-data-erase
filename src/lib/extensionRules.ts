/**
 * extensionRules.ts
 * Central registry for per-tool file extension whitelists.
 * Used by both the frontend (pre-API validation) and referenced
 * in error messages to suggest the correct tool.
 */

export interface ToolMeta {
  id: string;
  label: string;
  emoji: string;
  route: string;
  /** Allowed lowercase extensions INCLUDING the dot. Empty = directories only (no ext check). */
  allowedExtensions: string[];
  /** Whether the tool also accepts bare directory paths (no extension). */
  acceptsDirectories: boolean;
}

export const TOOL_RULES: ToolMeta[] = [
  {
    id: "file-wiper",
    label: "Secure File Wiper",
    emoji: "🛡️",
    route: "/app/file-wiper",
    allowedExtensions: [".txt"],
    acceptsDirectories: false,
  },
  {
    id: "browser-cleaner",
    label: "Browser Cache & Cookie Wiper",
    emoji: "🌐",
    route: "/app/browser-cleaner",
    allowedExtensions: [".cache", ".dat", ".sqlite"],
    acceptsDirectories: true, // also accepts bare cache directories
  },
  {
    id: "recent-files",
    label: "Recent Files Eraser",
    emoji: "⏱️",
    route: "/app/recent-files",
    allowedExtensions: [".json", ".xml", ".lnk", ".xbel"],
    acceptsDirectories: false,
  },
  {
    id: "log-scanner",
    label: "Log Sensitive Data Scanner",
    emoji: "📄",
    route: "/app/log-scanner",
    allowedExtensions: [".log", ".txt", ".out", ".err"],
    acceptsDirectories: true, // also accepts log directories
  },
  {
    id: "secret-scanner",
    label: "Secret Leak Detector",
    emoji: "🔑",
    route: "/app/secret-scanner",
    allowedExtensions: [".js", ".ts", ".py", ".env", ".json", ".yaml", ".yml", ".toml", ".php", ".rb", ".go", ".sh"],
    acceptsDirectories: true, // primary use case is repo directories
  },
  {
    id: "temp-cleaner",
    label: "Temp File Eliminator",
    emoji: "🗑️",
    route: "/app/temp-cleaner",
    allowedExtensions: [".tmp", ".temp", ".bak", ".old", ".swp"],
    acceptsDirectories: true, // also accepts temp directories
  },
];

/** Get tool metadata by id. */
export function getToolMeta(toolId: string): ToolMeta | undefined {
  return TOOL_RULES.find((t) => t.id === toolId);
}

/** Strip surrounding quotes and whitespace from a path string. */
export function cleanPathString(filePath: string): string {
  return filePath.trim().replace(/^["']+|["']+$/g, "").trim();
}

/** Extract the lowercase extension from a path string (including the dot). */
export function extractExtension(filePath: string): string {
  const cleaned = cleanPathString(filePath);
  const lastDot = cleaned.lastIndexOf(".");
  const lastSep = Math.max(cleaned.lastIndexOf("/"), cleaned.lastIndexOf("\\"));
  if (lastDot > lastSep && lastDot < cleaned.length - 1) {
    return cleaned.slice(lastDot).toLowerCase();
  }
  return ""; // no extension (likely a directory)
}

export interface ExtensionValidationResult {
  /** True when the extension is allowed (or the path has no extension and the tool accepts dirs). */
  valid: boolean;
  /** The detected extension (e.g. ".pdf"), empty string if none. */
  ext: string;
  /** Friendly list of allowed extensions for the current tool. */
  allowedExtensions: string[];
  /** Another tool that supports this extension, if any. */
  suggestedTool?: ToolMeta;
}

/**
 * Validate whether a given path's extension is accepted by the specified tool.
 * Returns a rich result including a suggested alternate tool when applicable.
 */
export function validatePathExtension(
  toolId: string,
  filePath: string
): ExtensionValidationResult {
  const rule = getToolMeta(toolId);
  if (!rule) {
    // Unknown tool — pass through
    return { valid: true, ext: "", allowedExtensions: [] };
  }

  const ext = extractExtension(filePath);

  // No extension detected → treat as directory path
  if (!ext) {
    return {
      valid: rule.acceptsDirectories,
      ext: "",
      allowedExtensions: rule.allowedExtensions,
      suggestedTool: undefined,
    };
  }

  // Check against this tool's whitelist (case-insensitive already handled by extractExtension)
  const isAllowed = rule.allowedExtensions.includes(ext);
  if (isAllowed) {
    return { valid: true, ext, allowedExtensions: rule.allowedExtensions };
  }

  // Find a tool that DOES support this extension
  const suggestedTool = TOOL_RULES.find(
    (t) => t.id !== toolId && t.allowedExtensions.includes(ext)
  );

  return {
    valid: false,
    ext,
    allowedExtensions: rule.allowedExtensions,
    suggestedTool,
  };
}
