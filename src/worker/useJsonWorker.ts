import { useRef, useCallback, useEffect } from "react";
import type { WorkerRequest, WorkerResponse } from "./types";

export type WorkerResult =
  | { ok: true; result: string; parseTimeMs: number }
  | { ok: false; message: string; line?: number; column?: number };

let nextId = 0;

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<number, (r: WorkerResult) => void>());

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      for (const resolve of pending.values()) {
        resolve({ ok: false, message: "Worker was terminated." });
      }
      pending.clear();
    };
  }, []);

  function getWorker(): Worker {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./jsonWorker.ts", import.meta.url),
        { type: "module" },
      );
      workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, ...rest } = e.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          pendingRef.current.delete(id);
          resolve(rest as WorkerResult);
        }
      };
      workerRef.current.onerror = () => {
        for (const resolve of pendingRef.current.values()) {
          resolve({
            ok: false,
            message: "Worker encountered an unexpected error.",
          });
        }
        pendingRef.current.clear();
        workerRef.current = null;
      };
    }
    return workerRef.current;
  }

  const process = useCallback(
    (
      type: "beautify" | "minify",
      input: string,
      indent = 2,
    ): Promise<WorkerResult> =>
      new Promise((resolve) => {
        const id = nextId++;
        pendingRef.current.set(id, resolve);
        const req: WorkerRequest =
          type === "beautify"
            ? { id, type, input, indent }
            : { id, type, input };
        try {
          getWorker().postMessage(req);
        } catch (err) {
          pendingRef.current.delete(id);
          resolve({
            ok: false,
            message:
              err instanceof Error
                ? err.message
                : "Failed to start JSON processing worker.",
          });
        }
      }),
    [],
  );

  return { process };
}
