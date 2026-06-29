import { describe, it, expect } from "vitest";
import { getSuggestion } from "./errorSuggestions";

describe("getSuggestion", () => {
  // 1. Trailing comma in object
  it("detects trailing comma in object and mentions line number", () => {
    const result = getSuggestion('{"a":1,"b":2,}', "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("trailing comma");
    expect(result).toContain("1");
  });

  // 2. Trailing comma in array
  it("detects trailing comma in array", () => {
    const result = getSuggestion("[1,2,3,]", "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("trailing comma");
  });

  // 3. JS line comment
  it("detects JS line comment", () => {
    const result = getSuggestion('{"a":1}//comment', "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("comment");
  });

  // 4. JS block comment
  it("detects JS block comment", () => {
    const result = getSuggestion('{"a":1/*note*/}', "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("comment");
  });

  // 5. Single quotes
  it("detects single quotes and suggests double quotes", () => {
    const result = getSuggestion("{'name':'Alice'}", "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("double quotes");
  });

  // 6. Unquoted object key
  it("detects unquoted object key", () => {
    const result = getSuggestion('{name:"Alice"}', "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("quoted");
  });

  // 7. undefined literal
  it("detects undefined literal", () => {
    const result = getSuggestion('{"v":undefined}', "");
    expect(result).not.toBeNull();
    expect(result).toContain("undefined");
  });

  // 8. NaN literal
  it("detects NaN literal", () => {
    const result = getSuggestion('{"v":NaN}', "");
    expect(result).not.toBeNull();
    expect(result).toContain("NaN");
  });

  // 9. Infinity literal
  it("detects Infinity literal", () => {
    const result = getSuggestion('{"v":Infinity}', "");
    expect(result).not.toBeNull();
    expect(result).toContain("Infinity");
  });

  // 10. Missing comma between items (multi-line)
  it("returns a comma-related suggestion for missing comma between items", () => {
    const input = '{\n  "a": 1\n  "b": 2\n}';
    const result = getSuggestion(input, "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("comma");
  });

  // 11. Valid JSON returns null
  it("returns null for valid JSON", () => {
    expect(getSuggestion('{"key":"value"}', "")).toBeNull();
  });

  // 12. Empty string returns null
  it("returns null for empty string", () => {
    expect(getSuggestion("", "")).toBeNull();
  });

  // 13. _line is passed through in missing-comma suggestion
  it("includes the _line number when missing-comma fires with _line=5", () => {
    const input = '{\n  "a": 1\n  "b": 2\n}';
    const result = getSuggestion(input, "", 5);
    expect(result).not.toBeNull();
    expect(result!).toContain("5");
  });

  // Additional edge cases
  it("detects trailing comma on a later line and reports correct line number", () => {
    const input = '{\n  "a": 1,\n  "b": 2,\n}';
    const result = getSuggestion(input, "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("trailing comma");
    // trailing comma is on line 3
    expect(result).toContain("3");
  });

  it("returns null for whitespace-only input", () => {
    expect(getSuggestion("   \n  ", "")).toBeNull();
  });

  it("returns null for a JSON array with no issues", () => {
    expect(getSuggestion("[1,2,3]", "")).toBeNull();
  });

  it("detects trailing comma with surrounding whitespace", () => {
    const result = getSuggestion('{"a":1 , }', "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("trailing comma");
  });

  it("handles very large input with trailing comma", () => {
    const pairs = Array.from({ length: 1000 }, (_, i) => `"k${i}":${i}`).join(
      ",",
    );
    const input = `{${pairs},}`;
    const result = getSuggestion(input, "");
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toContain("trailing comma");
  });

  it("handles special unicode characters in valid JSON", () => {
    expect(getSuggestion('{"emoji":"\\u2764\\uFE0F"}', "")).toBeNull();
  });

  // String-value masking: URLs inside string values should not trigger comment heuristic
  it("does not flag a URL inside a string value as a comment", () => {
    expect(getSuggestion('{"url":"https://example.com/path"}', "")).toBeNull();
  });

  // String-value masking: single quote inside a double-quoted string is not flagged
  it("does not flag a single quote inside a string value", () => {
    expect(getSuggestion('{"msg":"it\'s fine"}', "")).toBeNull();
  });
});
