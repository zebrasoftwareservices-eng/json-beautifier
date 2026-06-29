export function getSuggestion(
  input: string,
  _errorMessage: string,
  _line?: number,
): string | null {
  // Trailing comma before } or ]
  const trailingCommaMatch = /,(\s*[}\]])/.exec(input);
  if (trailingCommaMatch) {
    const before = input.slice(0, trailingCommaMatch.index);
    const lineNum = before.split("\n").length;
    return `Remove the trailing comma on line ${lineNum}`;
  }

  // JS-style comments (// or /* */)
  if (/\/\/|\/\*/.test(input)) {
    return "JSON doesn't support comments — remove them or convert to a string value";
  }

  // Single quotes used instead of double quotes
  if (input.includes("'")) {
    return "JSON requires double quotes — replace ' with \"";
  }

  // Unquoted object key: {key: or ,key:
  if (/[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(input)) {
    return "Object keys must be quoted strings";
  }

  // undefined / NaN / Infinity literals
  const badLiteral = /\b(undefined|NaN|Infinity)\b/.exec(input);
  if (badLiteral) {
    return `JSON doesn't support ${badLiteral[1]} — use null instead`;
  }

  // Missing comma: value followed by a newline and then another value/key
  // eslint-disable-next-line no-useless-escape
  if (/["'\d\]}\w]\s*\n\s*["{\[]/.test(input)) {
    return _line != null
      ? `Missing comma between items — check near line ${_line}`
      : "Missing comma between items";
  }

  return null;
}
