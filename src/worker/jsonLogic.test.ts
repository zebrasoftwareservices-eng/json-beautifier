import { describe, it, expect } from "vitest";
import { processJson, MAX_INPUT_BYTES } from "./jsonLogic";

const validJson = '{"name":"Alice","age":30}';

describe("processJson — beautify", () => {
  it("returns pretty-printed JSON with 2-space indent by default", () => {
    const res = processJson("beautify", validJson);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(
        JSON.stringify({ name: "Alice", age: 30 }, null, 2),
      );
    }
  });

  it("returns pretty-printed JSON with 4-space indent", () => {
    const res = processJson("beautify", validJson, 4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(
        JSON.stringify({ name: "Alice", age: 30 }, null, 4),
      );
    }
  });

  it("parseTimeMs is a number >= 0 on success", () => {
    const res = processJson("beautify", validJson);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(typeof res.parseTimeMs).toBe("number");
      expect(res.parseTimeMs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("processJson — minify", () => {
  it("returns single-line compact JSON", () => {
    const pretty = '{\n  "name": "Alice",\n  "age": 30\n}';
    const res = processJson("minify", pretty);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe('{"name":"Alice","age":30}');
      expect(res.result).not.toContain("\n");
    }
  });

  it("parseTimeMs is a number >= 0 on success", () => {
    const res = processJson("minify", validJson);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(typeof res.parseTimeMs).toBe("number");
      expect(res.parseTimeMs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("processJson — invalid JSON", () => {
  it("returns ok: false with a non-empty error message", () => {
    const res = processJson("beautify", "not valid json");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBeTruthy();
      expect(res.message.length).toBeGreaterThan(0);
    }
  });

  it("returns line and/or column for invalid JSON", () => {
    const res = processJson("beautify", "{bad}");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const hasPosition =
        typeof res.line === "number" || typeof res.column === "number";
      expect(hasPosition).toBe(true);
    }
  });

  it("returns ok: false for empty input", () => {
    const res = processJson("beautify", "");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBeTruthy();
    }
  });
});

describe("processJson — size limit", () => {
  it("returns ok: false when input exceeds 1 MB", () => {
    const huge = "x".repeat(MAX_INPUT_BYTES + 1);
    const res = processJson("beautify", huge);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/1 MB/i);
    }
  });
});

describe("processJson — prototype pollution", () => {
  it("parses without throwing and strips __proto__ key", () => {
    const input = '{"__proto__": {"x": 1}, "safe": true}';
    const res = processJson("beautify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsed = JSON.parse(res.result) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(
        false,
      );
      expect(parsed.safe).toBe(true);
    }
  });

  it("does not pollute Object.prototype", () => {
    const input = '{"__proto__": {"polluted": true}}';
    processJson("beautify", input);
    expect(
      (Object.prototype as Record<string, unknown>).polluted,
    ).toBeUndefined();
  });
});

describe("processJson — indent clamping", () => {
  it("clamps indent of 100 to 8 without crashing", () => {
    const res = processJson("beautify", validJson, 100);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(
        JSON.stringify({ name: "Alice", age: 30 }, null, 8),
      );
    }
  });

  it("clamps indent of 0 to 1 without crashing", () => {
    const res = processJson("beautify", validJson, 0);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(
        JSON.stringify({ name: "Alice", age: 30 }, null, 1),
      );
    }
  });

  it("clamps negative indent to 1 without crashing", () => {
    const res = processJson("beautify", validJson, -5);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain("\n");
    }
  });
});

describe("processJson — special characters", () => {
  it("handles unicode characters correctly", () => {
    const input = '{"emoji": "\\uD83D\\uDE00", "chinese": "\\u4E2D\\u6587"}';
    const res = processJson("beautify", input);
    expect(res.ok).toBe(true);
  });

  it("handles deeply nested JSON", () => {
    const nested = JSON.stringify({ a: { b: { c: { d: 42 } } } });
    const res = processJson("beautify", nested);
    expect(res.ok).toBe(true);
  });

  it("handles JSON array", () => {
    const input = '[1, "two", true, null]';
    const res = processJson("minify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe('[1,"two",true,null]');
    }
  });
});
