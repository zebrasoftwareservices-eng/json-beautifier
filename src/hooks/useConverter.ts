import { useCallback } from "react";
import {
  convertJson,
  type ConvertFormat,
  type ConvertResult,
} from "../worker/convertLogic";

export function useConverter() {
  const convert = useCallback(
    (
      format: ConvertFormat,
      input: string,
      indent = 2,
    ): Promise<ConvertResult> =>
      // Wrap in a microtask so callers can use the same async API as the worker
      Promise.resolve().then(() => convertJson(format, input, indent)),
    [],
  );

  return { convert };
}
