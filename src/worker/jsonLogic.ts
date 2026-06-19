export const MAX_INPUT_BYTES = 1_000_000; // 1 MB

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export function safeReviver(_key: string, value: unknown): unknown {
  if (BLOCKED_KEYS.has(_key)) return undefined;
  return value;
}

export function offsetToLineCol(
  input: string,
  offset: number,
): { line: number; column: number } {
  const clamped = Math.min(offset, input.length);
  const before = input.slice(0, clamped);
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function extractPosition(
  msg: string,
  input: string,
): { line?: number; column?: number } {
  const ffMatch = msg.match(/at line (\d+) column (\d+)/);
  if (ffMatch) {
    return { line: Number(ffMatch[1]), column: Number(ffMatch[2]) };
  }
  const v8Match = msg.match(/at position (\d+)/);
  if (v8Match) {
    return offsetToLineCol(input, Number(v8Match[1]));
  }
  return {};
}

export type ProcessJsonResult =
  | { ok: true; result: string; parseTimeMs: number }
  | { ok: false; message: string; line?: number; column?: number };

export function processJson(
  type: "beautify" | "minify",
  input: string,
  indent = 2,
): ProcessJsonResult {
  if (input.length > MAX_INPUT_BYTES) {
    return {
      ok: false,
      message: `Input exceeds 1 MB limit (${(input.length / 1_000_000).toFixed(1)} MB). Large file support is coming soon.`,
    };
  }

  const clampedIndent =
    type === "beautify" ? Math.max(1, Math.min(8, Math.trunc(indent) || 2)) : 0;

  const t0 = performance.now();

  try {
    const parsed: unknown = JSON.parse(input, safeReviver);
    const result =
      type === "beautify"
        ? JSON.stringify(parsed, null, clampedIndent)
        : JSON.stringify(parsed);
    const parseTimeMs = Math.round((performance.now() - t0) * 100) / 100;
    return { ok: true, result, parseTimeMs };
  } catch (err) {
    const message = (err as Error).message;
    return {
      ok: false,
      message,
      ...extractPosition(message, input),
    };
  }
}
