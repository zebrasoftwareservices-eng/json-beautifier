import { useRef, useCallback } from "react";
import type { WorkerRequest, WorkerResponse } from "./types";

export type WorkerResult =
  | { ok: true; result: string; parseTimeMs: number }
  | { ok: false; message: string; line?: number; column?: number };

let nextId = 0;

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<number, (r: WorkerResult) => void>());

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
        // Reject all pending promises so the UI doesn't freeze on processing
        for (const resolve of pendingRef.current.values()) {
          resolve({
            ok: false,
            message: "Worker encountered an unexpected error.",
          });
        }
        pendingRef.current.clear();
        workerRef.current = null; // allow re-init on next use
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
        getWorker().postMessage(req);
      }),
    [],
  );

  return { process };
}
