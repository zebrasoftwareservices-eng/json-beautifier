export type WorkerRequest =
  | { id: number; type: "beautify"; input: string; indent: number | "\t" }
  | { id: number; type: "minify"; input: string }
  | { id: number; type: "validate"; input: string }
  | { id: number; type: "repair"; input: string };

export type WorkerSuccess = {
  id: number;
  ok: true;
  result: string;
  parseTimeMs: number;
  nodeCount?: number;
  fixes?: string[];
  hasLargeIntegers?: boolean;
};

export type WorkerError = {
  id: number;
  ok: false;
  message: string;
  line?: number;
  column?: number;
};

export type WorkerResponse = WorkerSuccess | WorkerError;
