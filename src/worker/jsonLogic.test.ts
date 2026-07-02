import { describe, it, expect } from "vitest";
import {
  processJson,
  countNodes,
  MAX_INPUT_BYTES,
  BIGINT_SENTINEL,
  parseIndent,
} from "./jsonLogic";

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
  it("returns ok: false when input exceeds 25 MB", () => {
    const huge = "x".repeat(MAX_INPUT_BYTES + 1);
    const res = processJson("beautify", huge);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/25 MB/i);
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

// ---------------------------------------------------------------------------
// JSO-43: parseIndent — normalizes raw indent settings for JSON.stringify
// ---------------------------------------------------------------------------

describe("parseIndent", () => {
  it("returns 4 for parseIndent(4)", () => {
    expect(parseIndent(4)).toBe(4);
  });

  it("returns 2 for parseIndent(2)", () => {
    expect(parseIndent(2)).toBe(2);
  });

  it('passes "\\t" through unchanged (not clamped or coerced to a number)', () => {
    expect(parseIndent("\t")).toBe("\t");
  });

  it("clamps 0 up to 1", () => {
    expect(parseIndent(0)).toBe(1);
  });

  it("clamps 20 down to 8", () => {
    expect(parseIndent(20)).toBe(8);
  });

  it("clamps a negative value up to 1", () => {
    expect(parseIndent(-5)).toBe(1);
  });

  it("truncates non-integer numbers", () => {
    expect(parseIndent(2.9)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// JSO-43: processJson — Tab indent produces real tab characters, not "1"
// ---------------------------------------------------------------------------

describe("processJson — beautify with tab indent", () => {
  it("indents nested keys with a literal tab character, not a single space", () => {
    const res = processJson("beautify", validJson, "\t");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain('\n\t"name"');
      expect(res.result).not.toContain('\n "name"');
      expect(res.result).not.toContain('\n1"name"');
    }
  });

  it("matches JSON.stringify's own tab-indented output exactly", () => {
    const res = processJson("beautify", validJson, "\t");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(
        JSON.stringify({ name: "Alice", age: 30 }, null, "\t"),
      );
    }
  });

  it("indents each nesting level with one additional tab character", () => {
    const nested = JSON.stringify({ a: { b: 1 } });
    const res = processJson("beautify", nested, "\t");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain('\n\t"a"');
      expect(res.result).toContain('\n\t\t"b"');
    }
  });
});

// ---------------------------------------------------------------------------
// JSO-43: processJson — numeric indent produces exact space-count, not
// over-indentation (the literal JSO-43 bug was "Tab" mapping to numeric 1)
// ---------------------------------------------------------------------------

describe("processJson — beautify with numeric indent (exact spacing)", () => {
  it("indents top-level keys with exactly 4 spaces for indent=4", () => {
    const res = processJson("beautify", validJson, 4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain('\n    "name"');
      // guards against "4 spaces4 spaces"-style duplication/over-indentation
      expect(res.result).not.toContain("        ");
    }
  });

  it("a 3-level-deep object at indent=4 has level-3 content indented exactly 12 spaces", () => {
    const deep = JSON.stringify({ a: { b: { c: 42 } } });
    const res = processJson("beautify", deep, 4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe(JSON.stringify({ a: { b: { c: 42 } } }, null, 4));
      expect(res.result).toContain('\n            "c": 42');
      // exactly 12 spaces, not 13+
      expect(res.result).not.toContain('\n             "c"');
    }
  });

  it("the root brace has zero leading whitespace at indent=4", () => {
    const deep = JSON.stringify({ a: { b: { c: 42 } } });
    const res = processJson("beautify", deep, 4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result.startsWith("{\n")).toBe(true);
      expect(res.result[0]).toBe("{");
    }
  });

  it("level-1 and level-2 nesting use 4 and 8 spaces respectively at indent=4", () => {
    const deep = JSON.stringify({ a: { b: { c: 42 } } });
    const res = processJson("beautify", deep, 4);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain('\n    "a"');
      expect(res.result).toContain('\n        "b"');
    }
  });
});

// ---------------------------------------------------------------------------
// JSO-12: countNodes
// ---------------------------------------------------------------------------

describe("countNodes", () => {
  it("counts null as 1", () => {
    expect(countNodes(null)).toBe(1);
  });

  it("counts a string as 1", () => {
    expect(countNodes("hello")).toBe(1);
  });

  it("counts a number as 1", () => {
    expect(countNodes(42)).toBe(1);
  });

  it("counts a boolean as 1", () => {
    expect(countNodes(true)).toBe(1);
  });

  it("counts an empty object {} as 1", () => {
    expect(countNodes({})).toBe(1);
  });

  it("counts { a: 1 } as 2", () => {
    expect(countNodes({ a: 1 })).toBe(2);
  });

  it("counts { a: 1, b: 2 } as 3", () => {
    expect(countNodes({ a: 1, b: 2 })).toBe(3);
  });

  it("counts an empty array [] as 1", () => {
    expect(countNodes([])).toBe(1);
  });

  it("counts [1, 2, 3] as 4", () => {
    expect(countNodes([1, 2, 3])).toBe(4);
  });

  it("counts nested { a: { b: 1 } } as 3", () => {
    expect(countNodes({ a: { b: 1 } })).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// JSO-12: processJson — validate
// ---------------------------------------------------------------------------

describe("processJson — validate", () => {
  it("returns ok: true with empty result and correct nodeCount for valid JSON", () => {
    const input = '{"name":"Alice","age":30}';
    const res = processJson("validate", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toBe("");
      expect(res.nodeCount).toBe(countNodes({ name: "Alice", age: 30 }));
    }
  });

  it("nodeCount matches countNodes output for array input", () => {
    const input = "[1, 2, 3]";
    const res = processJson("validate", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.nodeCount).toBe(4); // 1 array + 3 elements
    }
  });

  it("returns ok: false with message for invalid JSON", () => {
    const res = processJson("validate", "not valid json");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBeTruthy();
    }
  });

  it("returns line and/or column for invalid JSON (same as beautify)", () => {
    const res = processJson("validate", "{bad}");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const hasPosition =
        typeof res.line === "number" || typeof res.column === "number";
      expect(hasPosition).toBe(true);
    }
  });

  it("returns ok: false when input exceeds 25 MB", () => {
    const huge = "x".repeat(MAX_INPUT_BYTES + 1);
    const res = processJson("validate", huge);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toMatch(/25 MB/i);
    }
  });

  it("returns parseTimeMs >= 0 on success", () => {
    const res = processJson("validate", '{"ok":true}');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(typeof res.parseTimeMs).toBe("number");
      expect(res.parseTimeMs).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Large integer precision (lossless-json integration)
// ---------------------------------------------------------------------------

describe("BIGINT_SENTINEL", () => {
  it("is exported as the null-byte-prefixed sentinel string", () => {
    expect(BIGINT_SENTINEL).toBe("\x00bigint:");
  });
});

describe("processJson — large integer precision (beautify)", () => {
  const LARGE_INT = "198210283098489151"; // > Number.MAX_SAFE_INTEGER
  const LARGE_INT_INPUT = `{"id":${LARGE_INT}}`;

  it("preserves a large positive integer exactly — no trailing digit truncation", () => {
    const res = processJson("beautify", LARGE_INT_INPUT, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(LARGE_INT);
      // The truncated value that native JSON.parse would produce must NOT appear
      expect(res.result).not.toContain("198210283098489150");
    }
  });

  it("sets hasLargeIntegers: true when input contains an integer > MAX_SAFE_INTEGER", () => {
    const res = processJson("beautify", LARGE_INT_INPUT, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("sets hasLargeIntegers: false (or undefined) when all numbers are safe", () => {
    const res = processJson("beautify", '{"n":42,"pi":3.14}', 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBeFalsy();
    }
  });

  it("preserves a negative large integer exactly", () => {
    const negInput = `{"id":-${LARGE_INT}}`;
    const res = processJson("beautify", negInput, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(`-${LARGE_INT}`);
      expect(res.result).not.toContain("-198210283098489150");
    }
  });

  it("sets hasLargeIntegers: true for negative large integers", () => {
    const negInput = `{"id":-${LARGE_INT}}`;
    const res = processJson("beautify", negInput, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("preserves multiple large integers in a single document", () => {
    const input = `{"a":${LARGE_INT},"b":-${LARGE_INT},"c":1}`;
    const res = processJson("beautify", input, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(`"a": ${LARGE_INT}`);
      expect(res.result).toContain(`"b": -${LARGE_INT}`);
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("preserves large integers inside arrays", () => {
    const input = `[1,${LARGE_INT},3]`;
    const res = processJson("beautify", input, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(LARGE_INT);
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("preserves large integers nested inside objects", () => {
    const input = `{"outer":{"inner":${LARGE_INT}}}`;
    const res = processJson("beautify", input, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(LARGE_INT);
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("does not treat Number.MAX_SAFE_INTEGER itself as a large integer", () => {
    const safe = String(Number.MAX_SAFE_INTEGER); // 9007199254740991
    const res = processJson("beautify", `{"n":${safe}}`, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBeFalsy();
      expect(res.result).toContain(safe);
    }
  });

  it("treats Number.MAX_SAFE_INTEGER + 1 as a large integer", () => {
    const unsafe = String(Number.MAX_SAFE_INTEGER + 1); // 9007199254740992
    const res = processJson("beautify", `{"n":${unsafe}}`, 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("still handles regular float values correctly", () => {
    const res = processJson("beautify", '{"ratio":3.14159}', 2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain("3.14159");
      expect(res.hasLargeIntegers).toBeFalsy();
    }
  });
});

describe("processJson — large integer precision (minify)", () => {
  const LARGE_INT = "198210283098489151";

  it("preserves large integer precision when minifying", () => {
    const input = `{"id":${LARGE_INT}}`;
    const res = processJson("minify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).toContain(LARGE_INT);
      expect(res.result).not.toContain("198210283098489150");
    }
  });

  it("sets hasLargeIntegers: true when minifying a document with large integers", () => {
    const input = `{"id":${LARGE_INT}}`;
    const res = processJson("minify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("sets hasLargeIntegers: false when minifying a document with only safe numbers", () => {
    const res = processJson("minify", '{"n":42}');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBeFalsy();
    }
  });

  it("produces compact (no-whitespace) output even with large integers", () => {
    const input = `{"id":${LARGE_INT},"name":"test"}`;
    const res = processJson("minify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.result).not.toContain("\n");
      expect(res.result).not.toContain("  ");
    }
  });
});

describe("processJson — large integer precision (validate)", () => {
  const LARGE_INT = "198210283098489151";

  it("sets hasLargeIntegers: true when validating a document with large integers", () => {
    const input = `{"id":${LARGE_INT}}`;
    const res = processJson("validate", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBe(true);
    }
  });

  it("sets hasLargeIntegers: false when validating a document with only safe numbers", () => {
    const res = processJson("validate", '{"n":42}');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.hasLargeIntegers).toBeFalsy();
    }
  });

  it("still returns ok: true and nodeCount for a large-integer document", () => {
    const input = `{"id":${LARGE_INT},"label":"x"}`;
    const res = processJson("validate", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      // object (1) + id value (1) + label value (1) = 3
      expect(res.nodeCount).toBe(3);
    }
  });
});

describe("processJson — proto-pollution guard with lossless-json", () => {
  it("strips __proto__ key and does not pollute Object.prototype", () => {
    const input = '{"__proto__": {"x": 1}, "safe": true}';
    const res = processJson("beautify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsed = JSON.parse(res.result) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(parsed, "__proto__")).toBe(
        false,
      );
      expect(parsed.safe).toBe(true);
      expect((Object.prototype as Record<string, unknown>).x).toBeUndefined();
    }
  });

  it("strips constructor key", () => {
    const input = '{"constructor": {"polluted": true}, "val": 1}';
    const res = processJson("beautify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsed = JSON.parse(res.result) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(parsed, "constructor")).toBe(
        false,
      );
    }
  });

  it("strips prototype key", () => {
    const input = '{"prototype": {"polluted": true}, "val": 1}';
    const res = processJson("beautify", input);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const parsed = JSON.parse(res.result) as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(parsed, "prototype")).toBe(
        false,
      );
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
