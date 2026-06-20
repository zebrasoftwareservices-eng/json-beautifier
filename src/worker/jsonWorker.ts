import type { WorkerRequest, WorkerResponse } from "./types";
import { processJson } from "./jsonLogic";
import { repairJson } from "./jsonRepair";

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;

  if (req.type === "repair") {
    const res = repairJson(req.input);
    if (res.ok) {
      self.postMessage({
        id: req.id,
        ok: true,
        result: res.result,
        parseTimeMs: 0,
        fixes: res.fixes,
      } satisfies WorkerResponse);
    } else {
      self.postMessage({
        id: req.id,
        ok: false,
        message: res.message,
      } satisfies WorkerResponse);
    }
    return;
  }

  const indent = req.type === "beautify" ? req.indent : 2;
  const res = processJson(req.type, req.input, indent);
  self.postMessage({ id: req.id, ...res } satisfies WorkerResponse);
};
