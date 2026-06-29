import { describe, it, expect } from "vitest";
import { convertJson } from "./convertLogic";

// ── JSON → YAML ────────────────────────────────────────────────────────────────

describe("convertJson → yaml", () => {
  it("converts a simple flat object to YAML key: value pairs", () => {
    const result = convertJson(
      "yaml",
      JSON.stringify({ name: "Alice", age: 30 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("name: Alice");
    expect(result.result).toContain("age: 30");
    expect(result.ext).toBe("yaml");
    expect(result.mimeType).toBe("text/yaml");
  });

  it("produces correct indentation for nested objects", () => {
    const input = JSON.stringify({ person: { city: "NYC", zip: "10001" } });
    const result = convertJson("yaml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("person:");
    expect(result.result).toContain("city: NYC");
    expect(result.result).toContain("zip: '10001'");
  });

  it("uses YAML list syntax for array values", () => {
    const input = JSON.stringify({ items: ["a", "b", "c"] });
    const result = convertJson("yaml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("- a");
    expect(result.result).toContain("- b");
    expect(result.result).toContain("- c");
  });

  it("renders null values as null", () => {
    const input = JSON.stringify({ key: null });
    const result = convertJson("yaml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("key: null");
  });

  it("renders boolean values as YAML booleans", () => {
    const input = JSON.stringify({ flag: true, disabled: false });
    const result = convertJson("yaml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("flag: true");
    expect(result.result).toContain("disabled: false");
  });

  it("respects custom indent parameter", () => {
    const input = JSON.stringify({ a: { b: 1 } });
    const result = convertJson("yaml", input, 4);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 4-space indent means "b" is indented with 4 spaces
    expect(result.result).toMatch(/^ {4}b:/m);
  });

  it("returns ok: false for invalid JSON", () => {
    const result = convertJson("yaml", "not json");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/invalid json/i);
  });

  it("converts JSON null literal", () => {
    const result = convertJson("yaml", "null");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.trim()).toBe("null");
  });
});

// ── JSON → CSV ─────────────────────────────────────────────────────────────────

describe("convertJson → csv", () => {
  it("converts an array of flat objects to CSV with header row and data rows", () => {
    const input = JSON.stringify([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = result.result.split("\n");
    expect(lines[0]).toBe("name,age");
    expect(lines[1]).toBe("Alice,30");
    expect(lines[2]).toBe("Bob,25");
    expect(result.ext).toBe("csv");
    expect(result.mimeType).toBe("text/csv");
  });

  it("flattens nested objects with dot-notation keys", () => {
    const input = JSON.stringify([
      { name: "Alice", address: { city: "NYC", zip: "10001" } },
    ]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = result.result.split("\n");
    expect(lines[0]).toContain("address.city");
    expect(lines[0]).toContain("address.zip");
    expect(lines[1]).toContain("NYC");
    expect(lines[1]).toContain("10001");
  });

  it("produces empty cells for missing keys across rows", () => {
    const input = JSON.stringify([{ a: 1, b: 2 }, { a: 3 }]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = result.result.split("\n");
    // Second row should have empty value for b
    expect(lines[2]).toBe("3,");
  });

  it("quotes values containing commas", () => {
    const input = JSON.stringify([{ name: "Smith, John", age: 40 }]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain('"Smith, John"');
  });

  it("quotes values containing double quotes and escapes them", () => {
    const input = JSON.stringify([{ name: 'Say "hi"', val: 1 }]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain('"Say ""hi"""');
  });

  it("quotes values containing newlines", () => {
    const input = JSON.stringify([{ note: "line1\nline2" }]);
    const result = convertJson("csv", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain('"line1\nline2"');
  });

  it("returns ok: false for non-array JSON input with message containing 'array'", () => {
    const result = convertJson("csv", JSON.stringify({ key: "value" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message.toLowerCase()).toContain("array");
  });

  it("returns ok: false for empty array", () => {
    const result = convertJson("csv", "[]");
    expect(result.ok).toBe(false);
  });

  it("returns ok: false for array of primitives", () => {
    const result = convertJson("csv", "[1, 2, 3]");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message.toLowerCase()).toContain("object");
  });

  it("returns ok: false for invalid JSON", () => {
    const result = convertJson("csv", "{bad}");
    expect(result.ok).toBe(false);
  });
});

// ── JSON → XML ─────────────────────────────────────────────────────────────────

describe("convertJson → xml", () => {
  it("wraps object in <root> and includes XML declaration", () => {
    const input = JSON.stringify({ key: "value" });
    const result = convertJson("xml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result.result).toContain("<root>");
    expect(result.result).toContain("<key>value</key>");
    expect(result.result).toContain("</root>");
    expect(result.ext).toBe("xml");
    expect(result.mimeType).toBe("application/xml");
  });

  it("produces nested XML elements for nested objects", () => {
    const input = JSON.stringify({ person: { name: "Alice" } });
    const result = convertJson("xml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("<person>");
    expect(result.result).toContain("<name>Alice</name>");
    expect(result.result).toContain("</person>");
  });

  it("repeats the parent tag for array items", () => {
    const input = JSON.stringify({ items: ["a", "b"] });
    const result = convertJson("xml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = result.result.match(/<items>/g);
    expect(matches).toHaveLength(2);
    expect(result.result).toContain("<items>a</items>");
    expect(result.result).toContain("<items>b</items>");
  });

  it("escapes special XML characters in text content", () => {
    const input = JSON.stringify({ desc: "<b>&</b>" });
    const result = convertJson("xml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("&lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("returns ok: false for invalid JSON", () => {
    const result = convertJson("xml", "<<<");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message.toLowerCase()).toContain("invalid json");
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────────

describe("convertJson edge cases", () => {
  it("returns ok: false for empty string input", () => {
    expect(convertJson("yaml", "").ok).toBe(false);
    expect(convertJson("csv", "").ok).toBe(false);
    expect(convertJson("xml", "").ok).toBe(false);
  });

  it("handles special characters in values (YAML)", () => {
    const input = JSON.stringify({ emoji: "hello ☃ world", colon: "a: b" });
    const result = convertJson("yaml", input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("hello");
  });

  it("handles a large flat object (100 keys) for YAML", () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 100; i++) obj[`key${i}`] = i;
    const result = convertJson("yaml", JSON.stringify(obj));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toContain("key0: 0");
    expect(result.result).toContain("key99: 99");
  });

  it("handles a large array of objects (500 rows) for CSV", () => {
    const arr = Array.from({ length: 500 }, (_, i) => ({ id: i, val: i * 2 }));
    const result = convertJson("csv", JSON.stringify(arr));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const lines = result.result.split("\n");
    // header + 500 data rows
    expect(lines).toHaveLength(501);
  });

  it("returns correct ext and mimeType for all three formats", () => {
    const input = JSON.stringify({ x: 1 });
    const yaml = convertJson("yaml", input);
    const xml = convertJson("xml", input);
    const csv = convertJson("csv", JSON.stringify([{ x: 1 }]));

    expect(yaml.ok && yaml.ext).toBe("yaml");
    expect(yaml.ok && yaml.mimeType).toBe("text/yaml");
    expect(xml.ok && xml.ext).toBe("xml");
    expect(xml.ok && xml.mimeType).toBe("application/xml");
    expect(csv.ok && csv.ext).toBe("csv");
    expect(csv.ok && csv.mimeType).toBe("text/csv");
  });
});
