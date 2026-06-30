import { dump as yamlDump } from "js-yaml";
import { parse as losslessParse, isSafeNumber } from "lossless-json";

export type ConvertFormat = "yaml" | "csv" | "xml";

export type ConvertResult =
  | { ok: true; result: string; mimeType: string; ext: string }
  | { ok: false; message: string };

// ── JSON → YAML ────────────────────────────────────────────────────────────────

function toYaml(parsed: unknown, indent: number): ConvertResult {
  try {
    const result = yamlDump(parsed, {
      indent,
      lineWidth: -1,
      noRefs: true,
    });
    return { ok: true, result, mimeType: "text/yaml", ext: "yaml" };
  } catch (err) {
    return {
      ok: false,
      message: `YAML conversion failed: ${(err as Error).message}`,
    };
  }
}

// ── JSON → CSV ─────────────────────────────────────────────────────────────────

function flattenObject(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenObject(v as Record<string, unknown>, key));
    } else {
      out[key] = v === null || v === undefined ? "" : String(v);
    }
  }
  return out;
}

function csvCell(value: string): string {
  if (
    value.includes('"') ||
    value.includes(",") ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(parsed: unknown): ConvertResult {
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return {
      ok: false,
      message:
        "JSON → CSV requires a non-empty array of objects as the top-level value.",
    };
  }

  const rows = parsed.map((item, i) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(
        `Item at index ${i} is not an object. JSON → CSV requires an array of objects.`,
      );
    }
    return flattenObject(item as Record<string, unknown>);
  });

  // Collect all headers preserving first-seen order
  const headerSet = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) headerSet.add(k);
  }
  const headers = [...headerSet];

  const lines: string[] = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((h) => csvCell(row[h] ?? "")).join(",")),
  ];

  return {
    ok: true,
    result: lines.join("\n"),
    mimeType: "text/csv",
    ext: "csv",
  };
}

// ── JSON → XML ─────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXmlName(key: string): string {
  // XML names must start with letter/underscore; replace invalid chars with underscore
  return key
    .replace(/[^a-zA-Z0-9_.\-:]/g, "_")
    .replace(/^([^a-zA-Z_:])/, "_$1");
}

function valueToXml(value: unknown, tag: string, depth: number): string {
  const safeTag = toXmlName(tag);
  const pad = "  ".repeat(depth);
  if (value === null || value === undefined) {
    return `${pad}<${safeTag}/>\n`;
  }
  if (typeof value !== "object") {
    return `${pad}<${safeTag}>${escapeXml(String(value))}</${safeTag}>\n`;
  }
  if (Array.isArray(value)) {
    return (value as unknown[])
      .map((item) => valueToXml(item, tag, depth))
      .join("");
  }
  const children = Object.entries(value as Record<string, unknown>)
    .map(([k, v]) =>
      Array.isArray(v)
        ? (v as unknown[])
            .map((item) => valueToXml(item, k, depth + 1))
            .join("")
        : valueToXml(v, k, depth + 1),
    )
    .join("");
  return `${pad}<${safeTag}>\n${children}${pad}</${safeTag}>\n`;
}

function toXml(parsed: unknown): ConvertResult {
  try {
    const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
    let body: string;
    if (Array.isArray(parsed)) {
      const items = (parsed as unknown[])
        .map((item) => valueToXml(item, "item", 1))
        .join("");
      body = `<root>\n${items}</root>\n`;
    } else {
      body = valueToXml(parsed, "root", 0);
    }
    return {
      ok: true,
      result: declaration + body,
      mimeType: "application/xml",
      ext: "xml",
    };
  } catch (err) {
    return {
      ok: false,
      message: `XML conversion failed: ${(err as Error).message}`,
    };
  }
}

// ── Public entry point ─────────────────────────────────────────────────────────

export function convertJson(
  format: ConvertFormat,
  input: string,
  indent = 2,
): ConvertResult {
  let parsed: unknown;
  try {
    parsed = losslessParse(input, null, (v) =>
      isSafeNumber(v) ? parseFloat(v) : v,
    );
  } catch (err) {
    return {
      ok: false,
      message: `Invalid JSON: ${(err as Error).message}`,
    };
  }

  try {
    if (format === "yaml") return toYaml(parsed, indent);
    if (format === "csv") return toCsv(parsed);
    return toXml(parsed);
  } catch (err) {
    return {
      ok: false,
      message: (err as Error).message,
    };
  }
}
