import { describe, it, expect } from "vitest";
import { SAMPLE_JSON } from "./ActionBar";

// ── 1. Valid JSON ─────────────────────────────────────────────────────────────

describe("SAMPLE_JSON — validity", () => {
  it("is a valid JSON string that parses without throwing", () => {
    expect(() => JSON.parse(SAMPLE_JSON)).not.toThrow();
  });

  it("is a non-empty string", () => {
    expect(SAMPLE_JSON.trim().length).toBeGreaterThan(0);
  });
});

// ── 2. Deep nesting ───────────────────────────────────────────────────────────

describe("SAMPLE_JSON — deep nesting", () => {
  it("has user.metadata.preferences.theme === 'dark' (deepest level)", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(parsed.user.metadata.preferences.theme).toBe("dark");
  });

  it("has user.address.city === 'San Francisco'", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(parsed.user.address.city).toBe("San Francisco");
  });

  it("has at least 3 levels of nesting (user → metadata → preferences)", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(parsed.user).toBeDefined();
    expect(parsed.user.metadata).toBeDefined();
    expect(parsed.user.metadata.preferences).toBeDefined();
  });
});

// ── 3. Expected fields ────────────────────────────────────────────────────────

describe("SAMPLE_JSON — expected fields", () => {
  it("has a user.id field", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(parsed.user.id).toBeDefined();
  });

  it("has a user.tags array", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(Array.isArray(parsed.user.tags)).toBe(true);
  });

  it("has user.metadata.preferences.notifications as a boolean", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    expect(typeof parsed.user.metadata.preferences.notifications).toBe(
      "boolean",
    );
  });
});

// ── 4. Edge-case safety ───────────────────────────────────────────────────────

describe("SAMPLE_JSON — edge-case safety", () => {
  it("does not contain unescaped control characters", () => {
    // Control chars (except tab/newline used by pretty-printing) would be invalid JSON
    // eslint-disable-next-line no-control-regex
    const controlCharRe = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;
    expect(controlCharRe.test(SAMPLE_JSON)).toBe(false);
  });

  it("round-trips through JSON.stringify without data loss", () => {
    const parsed = JSON.parse(SAMPLE_JSON);
    const reparsed = JSON.parse(JSON.stringify(parsed));
    expect(reparsed.user.metadata.preferences.theme).toBe("dark");
    expect(reparsed.user.address.city).toBe("San Francisco");
  });
});
