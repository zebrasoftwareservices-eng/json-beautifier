import {
  parse as losslessParse,
  isSafeNumber,
  isLosslessNumber,
} from "lossless-json";

export const TREE_BIGINT_SENTINEL = "\x00bigint:";

const INTEGER_RE = /^-?\d+$/;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export interface FlatRow {
  path: string;
  depth: number;
  displayKey: string | null;
  value: JsonValue;
  type:
    | "object"
    | "array"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "bigint";
  hasChildren: boolean;
  isExpanded: boolean;
}

export function treeReviver(_key: string, value: unknown): unknown {
  if (isLosslessNumber(value)) {
    const str = (value as { value: string }).value;
    if (isSafeNumber(str)) return Number(str);
    // Only tag integer literals (no decimal point or exponent) as bigint
    if (INTEGER_RE.test(str)) return `${TREE_BIGINT_SENTINEL}${str}`;
    // Large non-integer (e.g. 1e100) — convert to float, precision may be lost
    return Number(str);
  }
  return value;
}

export function parseForTree(input: string): JsonValue {
  return losslessParse(input, treeReviver) as JsonValue;
}

export function getType(v: JsonValue): FlatRow["type"] {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (typeof v === "string" && v.startsWith(TREE_BIGINT_SENTINEL))
    return "bigint";
  return typeof v as FlatRow["type"];
}

export function buildPath(parent: string, key: string | number): string {
  if (typeof key === "number") return `${parent}[${key}]`;
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return `${parent}.${key}`;
  return `${parent}["${key.replace(/"/g, '\\"')}"]`;
}

export function childCount(v: JsonValue): number {
  if (Array.isArray(v)) return v.length;
  if (v !== null && typeof v === "object") return Object.keys(v).length;
  return 0;
}

export function flatten(
  value: JsonValue,
  path: string,
  displayKey: string | null,
  depth: number,
  expanded: ReadonlySet<string>,
  rows: FlatRow[],
): void {
  const type = getType(value);
  const hasChildren =
    (type === "object" || type === "array") && childCount(value) > 0;
  const isExpanded = expanded.has(path);

  rows.push({ path, depth, displayKey, value, type, hasChildren, isExpanded });

  if (hasChildren && isExpanded) {
    if (type === "array") {
      (value as JsonArray).forEach((child, i) => {
        flatten(child, buildPath(path, i), null, depth + 1, expanded, rows);
      });
    } else {
      Object.entries(value as JsonObject).forEach(([k, v]) => {
        flatten(v, buildPath(path, k), k, depth + 1, expanded, rows);
      });
    }
  }
}

export function collectAllPaths(
  value: JsonValue,
  path: string,
  out: Set<string>,
): void {
  const type = getType(value);
  if (type !== "object" && type !== "array") return;
  out.add(path);
  if (type === "array") {
    (value as JsonArray).forEach((c, i) =>
      collectAllPaths(c, buildPath(path, i), out),
    );
  } else {
    Object.entries(value as JsonObject).forEach(([k, v]) =>
      collectAllPaths(v, buildPath(path, k), out),
    );
  }
}

export function formatTreeValue(row: FlatRow): string {
  switch (row.type) {
    case "object":
      return `{${childCount(row.value)}}`;
    case "array":
      return `[${childCount(row.value)}]`;
    case "string":
      return `"${String(row.value).slice(0, 80)}${String(row.value).length > 80 ? "…" : ""}"`;
    case "null":
      return "null";
    case "bigint":
      return String(row.value).slice(TREE_BIGINT_SENTINEL.length);
    default:
      return String(row.value);
  }
}
