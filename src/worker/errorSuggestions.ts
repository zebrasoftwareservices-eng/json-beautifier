// Replace the contents of double-quoted strings with spaces so heuristics
// only match structural JSON syntax, not string values.
function stripStrings(input: string): string {
  let out = "";
  let i = 0;
  while (i < input.length) {
    if (input[i] === '"') {
      out += '"';
      i++;
      while (i < input.length) {
        if (input[i] === "\\") {
          out += " ";
          i++;
          if (i < input.length) {
            out += input[i] === "\n" || input[i] === "\r" ? input[i] : " ";
            i++;
          }
        } else if (input[i] === '"') {
          out += '"';
          i++;
          break;
        } else {
          out += input[i] === "\n" || input[i] === "\r" ? input[i] : " ";
          i++;
        }
      }
    } else {
      out += input[i++];
    }
  }
  return out;
}

export function getSuggestion(
  input: string,
  _errorMessage: string,
  _line?: number,
): string | null {
  if (input.length > 1_000_000) return null;
  const stripped = stripStrings(input);

  // Trailing comma before } or ]
  const trailingCommaMatch = /,(\s*[}\]])/.exec(stripped);
  if (trailingCommaMatch) {
    const before = stripped.slice(0, trailingCommaMatch.index);
    const lineNum = before.split("\n").length;
    return `Remove the trailing comma on line ${lineNum}`;
  }

  // JS-style comments (// or /* */)
  if (/\/\/|\/\*/.test(stripped)) {
    return "JSON doesn't support comments — remove them or convert to a string value";
  }

  // Single quotes used instead of double quotes
  if (stripped.includes("'")) {
    return "JSON requires double quotes — replace ' with \"";
  }

  // Unquoted object key: {key: or ,key:
  if (/[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(stripped)) {
    return "Object keys must be quoted strings";
  }

  // undefined / NaN / Infinity literals
  const badLiteral = /\b(undefined|NaN|Infinity)\b/.exec(stripped);
  if (badLiteral) {
    return `JSON doesn't support ${badLiteral[1]} — use null instead`;
  }

  // Missing comma: value followed by a newline and then another value/key
  // eslint-disable-next-line no-useless-escape
  if (/["'\d\]}\w]\s*\n\s*["{\[]/.test(stripped)) {
    return _line != null
      ? `Missing comma between items — check near line ${_line}`
      : "Missing comma between items";
  }

  return null;
}
