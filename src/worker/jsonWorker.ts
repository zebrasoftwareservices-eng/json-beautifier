import type { WorkerRequest, WorkerResponse } from "./types";
import { processJson } from "./jsonLogic";

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  const indent = req.type === "beautify" ? req.indent : 2;
  const res = processJson(req.type, req.input, indent);

  self.postMessage({ id: req.id, ...res } satisfies WorkerResponse);
};
