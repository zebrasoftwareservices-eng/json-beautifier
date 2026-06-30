// Diff computation — to be implemented in a future ticket.

export type DiffResult =
  | { ok: true; result: string }
  | { ok: false; message: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function diffJson(_a: string, _b: string): DiffResult {
  return { ok: false, message: "Diff — not yet implemented." };
}
