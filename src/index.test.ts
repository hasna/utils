import { describe, it, expect } from "bun:test";
import {
  compact,
  pickFields,
  parseFields,
  formatError,
  searchTools,
  describeTools,
  formatList,
  toCsv,
} from "./index.js";

describe("compact", () => {
  it("strips null values", () => {
    expect(compact({ a: 1, b: null, c: "x" })).toEqual({ a: 1, c: "x" });
  });
  it("strips undefined values", () => {
    expect(compact({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
  it("keeps falsy non-null values", () => {
    expect(compact({ a: 0, b: false, c: "" })).toEqual({ a: 0, b: false, c: "" });
  });
  it("returns empty object when all null", () => {
    expect(compact({ a: null, b: null })).toEqual({});
  });
});

describe("pickFields", () => {
  it("returns only requested fields", () => {
    expect(pickFields({ id: "1", title: "x", model: "claude" }, ["id", "title"])).toEqual({ id: "1", title: "x" });
  });
  it("ignores missing fields", () => {
    expect(pickFields({ id: "1" }, ["id", "nonexistent"])).toEqual({ id: "1" });
  });
  it("returns empty for empty fields array", () => {
    expect(pickFields({ id: "1" }, [])).toEqual({});
  });
});

describe("parseFields", () => {
  it("parses comma-separated fields", () => {
    expect(parseFields("id,title,startedAt")).toEqual(["id", "title", "startedAt"]);
  });
  it("trims whitespace", () => {
    expect(parseFields("id, title , model")).toEqual(["id", "title", "model"]);
  });
  it("returns null for undefined", () => {
    expect(parseFields(undefined)).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseFields("")).toBeNull();
  });
});

describe("formatError", () => {
  it("returns error message for Error instances", () => {
    expect(formatError(new Error("bad input"))).toBe("bad input");
  });
  it("stringifies non-Error values", () => {
    expect(formatError("oops")).toBe("oops");
    expect(formatError(42)).toBe("42");
  });
});

describe("searchTools", () => {
  const tools = [
    { name: "list_sessions", desc: "List sessions with filters" },
    { name: "search_sessions", desc: "Search messages by text" },
    { name: "get_session", desc: "Get session details" },
    { name: "get_stats", desc: "Get aggregate stats" },
  ];

  it("matches by tool name", () => {
    expect(searchTools("session", tools)).toEqual(["list_sessions", "search_sessions", "get_session"]);
  });
  it("matches by description", () => {
    expect(searchTools("stats", tools)).toEqual(["get_stats"]);
  });
  it("is case-insensitive", () => {
    expect(searchTools("SESSION", tools)).toEqual(["list_sessions", "search_sessions", "get_session"]);
  });
  it("returns empty for no matches", () => {
    expect(searchTools("xyz", tools)).toEqual([]);
  });
});

describe("describeTools", () => {
  const schemas: Record<string, string> = {
    list_sessions: "list_sessions(source?, limit=20) → pipe-delimited session lines",
  };

  it("returns schema for known tools", () => {
    const result = describeTools(["list_sessions"], schemas);
    expect(result).toContain("list_sessions:");
    expect(result).toContain("pipe-delimited");
  });
  it("returns unknown message for missing tools", () => {
    expect(describeTools(["missing_tool"], schemas)).toBe("missing_tool: unknown tool");
  });
  it("separates multiple tools with double newline", () => {
    const schemas2 = { a: "desc a", b: "desc b" };
    const result = describeTools(["a", "b"], schemas2);
    expect(result).toContain("\n\n");
  });
});

describe("formatList", () => {
  const items = [
    { id: "1", title: "x", model: null, source: "claude" },
    { id: "2", title: "y", model: "gpt4", source: "codex" },
  ];

  it("strips nulls when no fields specified", () => {
    const result = formatList(items as Record<string, unknown>[], null);
    expect(result[0]).not.toHaveProperty("model");
    expect(result[1]).toHaveProperty("model");
  });
  it("picks only specified fields", () => {
    const result = formatList(items as Record<string, unknown>[], ["id", "source"]);
    expect(result[0]).toEqual({ id: "1", source: "claude" });
    expect(result[0]).not.toHaveProperty("title");
  });
});

describe("toCsv", () => {
  const items = [
    { id: "1", title: "Fix bug", status: "pending" },
    { id: "2", title: 'Say "hello"', status: "done" },
  ];

  it("generates header + rows", () => {
    const csv = toCsv(items, ["id", "title", "status"]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("id,title,status");
    expect(lines.length).toBe(3);
  });
  it("escapes quotes in values", () => {
    const csv = toCsv(items, ["title"]);
    expect(csv).toContain('"Say ""hello"""');
  });
  it("handles null/undefined values", () => {
    const csv = toCsv([{ id: "1", title: null }], ["id", "title"]);
    expect(csv).toContain('"1",""');
  });
});
