// Schema inference — to be implemented in a future ticket.

export type SchemaResult =
  | { ok: true; result: string }
  | { ok: false; message: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function inferSchema(_input: string): SchemaResult {
  return { ok: false, message: "Schema inference — not yet implemented." };
}
