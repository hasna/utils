/**
 * @hasna/agent-utils
 *
 * Shared utilities for token-efficient AI agent MCP servers and CLIs.
 * Implements the cross-project token-optimization standard adopted by:
 * - open-sessions, open-mementos, open-connectors, @hasna/todos, @hasna/skills, open-conversations
 */

// --- Response helpers ---

/**
 * Strip null/undefined values from an object for compact MCP responses.
 * Saves ~20% on sparse objects without changing semantics.
 *
 * @example
 * compact({ id: "abc", title: "x", model: null }) // → { id: "abc", title: "x" }
 */
export function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined),
  ) as Partial<T>;
}

/**
 * Pick only specified fields from an object (for ?fields= field filtering).
 * Enables agents to request only the fields they need, reducing response size 60-80%.
 *
 * @example
 * pickFields({ id: "abc", title: "x", model: "claude" }, ["id", "title"]) // → { id: "abc", title: "x" }
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[],
): Partial<T> {
  return Object.fromEntries(
    fields.filter((f) => f in obj).map((f) => [f, obj[f]]),
  ) as Partial<T>;
}

/**
 * Parse a comma-separated fields string into an array.
 * Returns null if fields is empty/undefined (meaning "return all fields").
 *
 * @example
 * parseFields("id,title,startedAt") // → ["id", "title", "startedAt"]
 * parseFields(undefined) // → null
 */
export function parseFields(fields: string | undefined): string[] | null {
  if (!fields) return null;
  const parsed = fields.split(",").map((f) => f.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed : null;
}

/**
 * Format an error for terse MCP tool responses.
 * Returns just the message string — no stack traces, no nested objects.
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// --- Meta-tool helpers (dynamic tool loading — 90-96% input token reduction) ---

export interface ToolSummary {
  name: string;
  desc: string;
}

/**
 * Search available tools by keyword. Returns matching tool names only.
 * Use as a `search_tools` MCP tool handler.
 *
 * @example
 * searchTools("session", tools) // → ["list_sessions", "get_session", "search_sessions"]
 */
export function searchTools(query: string, tools: ToolSummary[]): string[] {
  const q = query.toLowerCase();
  return tools
    .filter((t) => t.name.includes(q) || t.desc.toLowerCase().includes(q))
    .map((t) => t.name);
}

/**
 * Get full schema descriptions for named tools.
 * Use as a `describe_tools` MCP tool handler.
 * Returns one line per tool: "name: signature → return_type"
 *
 * @example
 * describeTools(["list_sessions"], schemas) // → "list_sessions: (source?, limit?) → session lines"
 */
export function describeTools(
  names: string[],
  schemas: Record<string, string>,
): string {
  return names
    .map((n) => (schemas[n] ? `${n}: ${schemas[n]}` : `${n}: unknown tool`))
    .join("\n\n");
}

// --- List formatting helpers ---

/**
 * Apply compact() and optionally pickFields() to an array of objects.
 * The standard pattern for all list MCP responses.
 */
export function formatList<T extends Record<string, unknown>>(
  items: T[],
  fields: string[] | null,
): Partial<T>[] {
  if (fields) {
    return items.map((item) => pickFields(compact(item) as T, fields));
  }
  return items.map(compact);
}

/**
 * Convert an array of objects to CSV format.
 * @param items - Array of objects
 * @param columns - Column names (must match object keys)
 */
export function toCsv(
  items: Record<string, unknown>[],
  columns: string[],
): string {
  const esc = (v: unknown): string =>
    `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = columns.join(",");
  const rows = items.map((item) =>
    columns.map((col) => esc(item[col])).join(","),
  );
  return [header, ...rows].join("\n");
}
