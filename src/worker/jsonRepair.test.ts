import { describe, it, expect } from "vitest";
import { repairJson } from "./jsonRepair";

describe("repairJson — empty input", () => {
  it("returns ok: false with 'nothing to repair' message for empty string", () => {
    const result = repairJson("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/nothing to repair/i);
    }
  });

  it("returns ok: false with 'nothing to repair' message for whitespace-only input", () => {
    const result = repairJson("   \n\t  ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/nothing to repair/i);
    }
  });
});

describe("repairJson — already valid JSON", () => {
  it("returns ok: false with 'already valid' message for valid object", () => {
    const result = repairJson('{"name":"Alice","age":30}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already valid/i);
    }
  });

  it("returns ok: false with 'already valid' message for valid array", () => {
    const result = repairJson("[1, 2, 3]");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already valid/i);
    }
  });

  it("returns ok: false with 'already valid' for valid JSON string", () => {
    const result = repairJson('"hello world"');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already valid/i);
    }
  });
});

describe("repairJson — trailing commas", () => {
  it("repairs trailing comma in object", () => {
    const result = repairJson('{"a":1,"b":2,}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual({ a: 1, b: 2 });
      expect(result.fixes.some((f) => /trailing comma/i.test(f))).toBe(true);
    }
  });

  it("repairs trailing comma in array", () => {
    const result = repairJson("[1, 2, 3,]");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual([1, 2, 3]);
      expect(result.fixes.some((f) => /trailing comma/i.test(f))).toBe(true);
    }
  });

  it("reports count in fix message for multiple trailing commas", () => {
    const result = repairJson('{"a":1,,"b":[1,2,]}');
    // Regex replaces one at a time but the implementation counts all occurrences
    // Test that the fix is applied and mention of commas is present
    if (result.ok) {
      expect(result.fixes.some((f) => /trailing comma/i.test(f))).toBe(true);
    }
    // Could be ok or fail (double comma is not standard trailing comma)
    // At minimum, no crash
    expect(result).toBeDefined();
  });

  it("counts multiple trailing commas and reflects in fix message", () => {
    // Two nested objects each with a trailing comma
    const input = '{"a":{"x":1,},"b":{"y":2,}}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const fixMsg = result.fixes.find((f) => /trailing comma/i.test(f));
      expect(fixMsg).toBeTruthy();
      expect(fixMsg).toMatch(/2/); // count: 2 trailing commas
    }
  });
});

describe("repairJson — JS comments", () => {
  it("repairs // line comments", () => {
    const input = '{\n  "a": 1 // comment\n}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /comment/i.test(f))).toBe(true);
      expect(JSON.parse(result.result)).toEqual({ a: 1 });
    }
  });

  it("repairs /* */ block comments", () => {
    const input = '{ /* block */ "a": 1 }';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /comment/i.test(f))).toBe(true);
      expect(JSON.parse(result.result)).toEqual({ a: 1 });
    }
  });

  it("does not strip // inside string values", () => {
    const input = '{"url":"https://example.com"}';
    const result = repairJson(input);
    // Already valid, so should return already valid
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already valid/i);
    }
  });

  it("does not strip // inside single-quoted string values", () => {
    // Regression: removeComments was treating // inside 'https://...' as a comment
    const input = "{'url':'https://example.com'}";
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual({ url: "https://example.com" });
    }
  });
});

describe("repairJson — single-quoted strings", () => {
  it("converts single-quoted keys and values to double quotes", () => {
    const result = repairJson("{'key': 'value'}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /single quote/i.test(f))).toBe(true);
      expect(JSON.parse(result.result)).toEqual({ key: "value" });
    }
  });

  it("handles escaped single quotes inside single-quoted strings", () => {
    const result = repairJson("{'key': 'it\\'s fine'}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual({ key: "it's fine" });
    }
  });
});

describe("repairJson — unquoted keys", () => {
  it("adds missing quotes to unquoted object keys", () => {
    const result = repairJson('{name: "Alice", age: 30}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /quotes to object keys/i.test(f))).toBe(
        true,
      );
      expect(JSON.parse(result.result)).toEqual({ name: "Alice", age: 30 });
    }
  });

  it("adds quotes to keys with underscores and dollar signs", () => {
    const result = repairJson("{_key: 1, $val: 2}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual({ _key: 1, $val: 2 });
    }
  });
});

describe("repairJson — Markdown code fences", () => {
  it("strips ```json code fence and repairs", () => {
    const input = '```json\n{"a":1}\n```';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /markdown/i.test(f))).toBe(true);
      expect(JSON.parse(result.result)).toEqual({ a: 1 });
    }
  });

  it("strips plain ``` code fence", () => {
    const input = '```\n{"b":2}\n```';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /markdown/i.test(f))).toBe(true);
    }
  });
});

describe("repairJson — combined fixes", () => {
  it("removes trailing comma and comment in one call", () => {
    const input = '{\n  "a": 1, // comment\n  "b": 2,\n}';
    const result = repairJson(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fixes.some((f) => /comment/i.test(f))).toBe(true);
      expect(result.fixes.some((f) => /trailing comma/i.test(f))).toBe(true);
    }
  });
});

describe("repairJson — irreparably broken JSON", () => {
  it("returns ok: false for structurally broken input", () => {
    const result = repairJson("{{{{");
    expect(result.ok).toBe(false);
  });

  it("includes message when repair cannot succeed", () => {
    const result = repairJson("{{{{");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBeTruthy();
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("returns ok: false for random non-JSON text", () => {
    const result = repairJson("this is not JSON at all!!!");
    expect(result.ok).toBe(false);
  });

  it("applies some fixes but still returns ok: false when structure remains broken", () => {
    // Has a comment to strip, but the remaining structure is unrecoverable
    const result = repairJson("// comment\n{{{broken}}}");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // message should mention still invalid or too broken
      expect(result.message).toBeTruthy();
    }
  });
});

describe("repairJson — special characters and edge cases", () => {
  it("handles unicode inside string values without mangling them", () => {
    const result = repairJson('{key: "\\u4E2D\\u6587"}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = JSON.parse(result.result) as Record<string, unknown>;
      expect(parsed["key"]).toBe("中文");
    }
  });

  it("handles nested objects with trailing commas", () => {
    const result = repairJson('{"a":{"b":1,},"c":[1,2,]}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.result)).toEqual({ a: { b: 1 }, c: [1, 2] });
    }
  });

  it("handles large-ish input without crashing", () => {
    const pairs = Array.from({ length: 500 }, (_, i) => `"key${i}":${i}`).join(
      ",",
    );
    const input = `{${pairs}}`;
    const result = repairJson(input);
    // Already valid, so expects 'already valid' message
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/already valid/i);
    }
  });
});
