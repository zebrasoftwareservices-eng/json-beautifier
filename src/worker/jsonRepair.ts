export type RepairResult =
  | { ok: true; result: string; fixes: string[] }
  | { ok: false; message: string };

function removeComments(input: string): string {
  let result = "";
  let i = 0;
  let quote: '"' | "'" | null = null;

  while (i < input.length) {
    if (!quote) {
      if (input[i] === '"' || input[i] === "'") {
        quote = input[i] as '"' | "'";
        result += input[i++];
      } else if (input[i] === "/" && input[i + 1] === "/") {
        while (i < input.length && input[i] !== "\n") i++;
      } else if (input[i] === "/" && input[i + 1] === "*") {
        i += 2;
        while (
          i < input.length - 1 &&
          !(input[i] === "*" && input[i + 1] === "/")
        )
          i++;
        i += 2;
      } else {
        result += input[i++];
      }
    } else {
      if (input[i] === "\\" && i + 1 < input.length) {
        result += input[i] + input[i + 1];
        i += 2;
      } else if (input[i] === quote) {
        quote = null;
        result += input[i++];
      } else {
        result += input[i++];
      }
    }
  }
  return result;
}

function convertSingleQuotes(input: string): string {
  if (!input.includes("'")) return input;
  let result = "";
  let i = 0;

  while (i < input.length) {
    if (input[i] === '"') {
      result += input[i++];
      while (i < input.length) {
        if (input[i] === "\\") {
          result += input[i] + (input[i + 1] ?? "");
          i += 2;
        } else if (input[i] === '"') {
          result += input[i++];
          break;
        } else {
          result += input[i++];
        }
      }
    } else if (input[i] === "'") {
      result += '"';
      i++;
      while (i < input.length) {
        if (input[i] === "\\" && input[i + 1] === "'") {
          result += "'";
          i += 2;
        } else if (input[i] === "'") {
          result += '"';
          i++;
          break;
        } else if (input[i] === '"') {
          result += '\\"';
          i++;
        } else {
          result += input[i++];
        }
      }
    } else {
      result += input[i++];
    }
  }
  return result;
}

export function repairJson(input: string): RepairResult {
  if (!input.trim()) {
    return { ok: false, message: "Nothing to repair — input is empty." };
  }

  let text = input.trim();
  const fixes: string[] = [];

  // 1. Strip Markdown code fences
  const fenceMatch = text.match(/^```(?:json|jsonl)?\s*\n([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    text = (fenceMatch[1] ?? "").trim();
    fixes.push("Stripped Markdown code fence");
  }

  // 2. Remove JS-style comments
  const noComments = removeComments(text);
  if (noComments !== text) {
    text = noComments;
    fixes.push("Removed JavaScript-style comments");
  }

  // 3. Remove trailing commas before } or ]
  if (/,(\s*[}\]])/.test(text)) {
    const count = (text.match(/,(\s*[}\]])/g) ?? []).length;
    text = text.replace(/,(\s*[}\]])/g, "$1");
    fixes.push(`Removed ${count} trailing comma${count === 1 ? "" : "s"}`);
  }

  // Try parse after first-pass fixes
  try {
    JSON.parse(text);
    if (fixes.length === 0) {
      return {
        ok: false,
        message: "JSON is already valid — no repair needed.",
      };
    }
    return { ok: true, result: text, fixes };
  } catch {
    // continue with more fixes
  }

  // 4. Convert single quotes to double quotes
  const noSingleQuotes = convertSingleQuotes(text);
  if (noSingleQuotes !== text) {
    text = noSingleQuotes;
    fixes.push("Converted single quotes to double quotes");
  }

  try {
    JSON.parse(text);
    return { ok: true, result: text, fixes };
  } catch {
    // continue
  }

  // 5. Add missing quotes to unquoted object keys
  const quotedKeys = text.replace(
    /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
    '$1"$2":',
  );
  if (quotedKeys !== text) {
    text = quotedKeys;
    fixes.push("Added missing quotes to object keys");
  }

  try {
    JSON.parse(text);
    return { ok: true, result: text, fixes };
  } catch (err) {
    const msg = (err as Error).message;
    if (fixes.length > 0) {
      return {
        ok: false,
        message: `Applied fixes (${fixes.join(", ")}) but JSON is still invalid: ${msg}. Try correcting the remaining structure manually.`,
      };
    }
    return {
      ok: false,
      message:
        "Could not auto-repair: JSON structure is too broken to fix automatically. Try correcting it manually.",
    };
  }
}
