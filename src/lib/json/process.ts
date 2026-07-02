import {
  parse as losslessParse,
  isSafeNumber,
  isLosslessNumber,
} from "lossless-json";

export const MAX_INPUT_BYTES = 25_000_000; // 25 MB (matches file upload limit)

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export const BIGINT_SENTINEL = "\x00bigint:";
// Matches the " bigint:..." string literal that JSON.stringify produces for sentinel values
const BIGINT_RE = /"\\u0000bigint:(-?\d+)"/g;

const INTEGER_RE = /^-?\d+$/;

function losslessReviver(_key: string, value: unknown): unknown {
  if (BLOCKED_KEYS.has(_key)) return undefined;
  if (isLosslessNumber(value)) {
    const str = (value as { value: string }).value;
    if (isSafeNumber(str)) return Number(str);
    // Only sentinel pure integer literals; large floats/exponents lose precision but aren't bigints
    if (INTEGER_RE.test(str)) return `${BIGINT_SENTINEL}${str}`;
    return Number(str);
  }
  return value;
}

function hasBigIntSentinel(value: unknown): boolean {
  if (typeof value === "string") return value.startsWith(BIGINT_SENTINEL);
  if (Array.isArray(value)) return value.some(hasBigIntSentinel);
  if (value !== null && typeof value === "object")
    return Object.values(value as Record<string, unknown>).some(
      hasBigIntSentinel,
    );
  return false;
}

export type IndentSetting = number | "\t";

/** Normalizes a raw indent setting into what JSON.stringify expects: "\t" as-is, numbers clamped to 1-8. */
export function parseIndent(indent: IndentSetting): IndentSetting {
  if (indent === "\t") return "\t";
  const normalized = Number.isFinite(indent) ? Math.trunc(indent) : 2;
  return Math.max(1, Math.min(8, normalized));
}

function losslessStringify(value: unknown, indent: IndentSetting): string {
  return JSON.stringify(value, null, indent).replace(BIGINT_RE, "$1");
}

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

export function countNodes(value: unknown): number {
  if (value === null || typeof value !== "object") return 1;
  if (Array.isArray(value)) {
    return (
      1 + (value as unknown[]).reduce<number>((s, v) => s + countNodes(v), 0)
    );
  }
  return (
    1 +
    Object.values(value as Record<string, unknown>).reduce<number>(
      (s, v) => s + countNodes(v),
      0,
    )
  );
}

export type ProcessJsonResult =
  | {
      ok: true;
      result: string;
      parseTimeMs: number;
      nodeCount?: number;
      hasLargeIntegers?: boolean;
    }
  | { ok: false; message: string; line?: number; column?: number };

export function processJson(
  type: "beautify" | "minify" | "validate",
  input: string,
  indent: IndentSetting = 2,
): ProcessJsonResult {
  const inputBytes = new TextEncoder().encode(input).length;
  if (inputBytes > MAX_INPUT_BYTES) {
    return {
      ok: false,
      message: `Input exceeds 25 MB limit (${(inputBytes / 1_000_000).toFixed(1)} MB).`,
    };
  }

  const clampedIndent = type === "beautify" ? parseIndent(indent) : 0;

  const t0 = performance.now();

  try {
    const parsed: unknown = losslessParse(input, losslessReviver);
    const parseTimeMs = Math.round((performance.now() - t0) * 100) / 100;
    const hasLargeIntegers = hasBigIntSentinel(parsed);
    if (type === "validate") {
      return {
        ok: true,
        result: "",
        parseTimeMs,
        nodeCount: countNodes(parsed),
        hasLargeIntegers,
      };
    }
    const result = losslessStringify(parsed, clampedIndent);
    return { ok: true, result, parseTimeMs, hasLargeIntegers };
  } catch (err) {
    const message = (err as Error).message;
    return {
      ok: false,
      message,
      ...extractPosition(message, input),
    };
  }
}
