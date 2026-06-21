import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { useJsonWorker } from "./worker/useJsonWorker";
import { CodeEditor, type CodeEditorError } from "./components/CodeEditor";
import { SplitPane } from "./components/SplitPane";
import { ActionBar, SAMPLE_JSON } from "./components/ActionBar";
import { LoadUrlDialog } from "./components/LoadUrlDialog";
import {
  RightPane,
  type TabId,
  type RepairResult,
} from "./components/RightPane";

const INSTANT_LIMIT = 5 * 1_000_000; // 5 MB — read without progress indicator
const MAX_FILE_BYTES = 25 * 1_000_000; // 25 MB — hard limit
const ALLOWED_EXTENSIONS = new Set([".json", ".jsonl", ".txt"]);

function readFileAsText(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    if (onProgress) {
      reader.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsText(file);
  });
}

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<CodeEditorError | null>(null);
  const [indent, setIndent] = useState(2);
  const [parseTimeMs, setParseTimeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("tree");
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [autoFormat, setAutoFormat] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState<number | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestLoadIdRef = useRef(0);
  const { process } = useJsonWorker();
  const autoFormatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatInFlightRef = useRef(false);

  // Accepts optional content to format (avoids stale closure on state)
  const handleFormat = useCallback(
    async (content?: string) => {
      const toFormat = content ?? input;
      if (!toFormat.trim()) return;
      if (formatInFlightRef.current) return;
      formatInFlightRef.current = true;
      setProcessing(true);
      try {
        const result = await process("beautify", toFormat, indent);
        if (result.ok) {
          setOutput(result.result);
          setParseTimeMs(result.parseTimeMs);
          setError(null);
          setActiveTab("code");
        } else {
          setError({
            message: result.message,
            line: result.line,
            column: result.column,
          });
          setOutput("");
          setParseTimeMs(null);
          setValidationStatus("invalid");
        }
      } catch {
        setError({ message: "Formatting failed — please try again." });
        setOutput("");
        setParseTimeMs(null);
        setValidationStatus("invalid");
      } finally {
        formatInFlightRef.current = false;
        setProcessing(false);
      }
    },
    [input, indent, process],
  );

  async function handleFileLoad(file: File) {
    const dotIndex = file.name.lastIndexOf(".");
    const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : "";
    const loadId = ++latestLoadIdRef.current;
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      setError({
        message: `Unsupported file type "${ext || "(none)"}". Please upload a .json, .jsonl, or .txt file.`,
      });
      setValidationStatus("invalid");
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError({
        message: `File "${file.name}" is ${(file.size / 1_000_000).toFixed(1)} MB — exceeds 25 MB limit. Pro plan supports up to 100 MB.`,
      });
      setValidationStatus("invalid");
      return;
    }

    const needsProgress = file.size > INSTANT_LIMIT;
    if (needsProgress) setUploadProgress(0);
    setError(null);

    try {
      const text = await readFileAsText(
        file,
        needsProgress ? setUploadProgress : undefined,
      );
      if (loadId !== latestLoadIdRef.current) return;
      setInput(text);
      setOutput("");
      setParseTimeMs(null);
      setFileName(file.name);
    } catch {
      if (loadId !== latestLoadIdRef.current) return;
      setError({
        message: `Failed to read "${file.name}" — please try again.`,
      });
      setValidationStatus("invalid");
    } finally {
      if (needsProgress && loadId === latestLoadIdRef.current) {
        setUploadProgress(null);
      }
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFileLoad(file);
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFileLoad(file);
  }

  async function handleLoadUrl(url: string) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      setError({
        message: "Invalid URL — please enter a valid http or https URL.",
      });
      setValidationStatus("invalid");
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      setError({
        message: `URL scheme "${parsed.protocol}" is not allowed — only http and https are supported.`,
      });
      setValidationStatus("invalid");
      return;
    }

    setLoadingUrl(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setError({
          message: `HTTP ${res.status} — the server returned an error response for this URL.`,
        });
        setValidationStatus("invalid");
        return;
      }
      const contentLength = res.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > 1_000_000) {
        setError({
          message: `Response is too large (${(parseInt(contentLength, 10) / 1_000_000).toFixed(1)} MB) — maximum 1 MB. Use the Upload button for large files.`,
        });
        setValidationStatus("invalid");
        return;
      }
      // Stream the body so we can reject oversized responses before buffering them
      const reader = res.body?.getReader();
      if (!reader) {
        setError({ message: "Could not read response body." });
        setValidationStatus("invalid");
        return;
      }
      const decoder = new TextDecoder();
      let bytes = 0;
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 1_000_000) {
          await reader.cancel();
          setError({
            message: `Response is too large (>${(bytes / 1_000_000).toFixed(1)} MB) — maximum 1 MB. Use the Upload button for large files.`,
          });
          setValidationStatus("invalid");
          return;
        }
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      try {
        JSON.parse(text);
      } catch {
        setError({
          message:
            "The URL returned a non-JSON response — check that the endpoint serves JSON content.",
        });
        setValidationStatus("invalid");
        return;
      }
      setInput(text);
      setOutput("");
      setParseTimeMs(null);
      setFileName(url);
      setUrlDialogOpen(false);
    } catch {
      // fetch() throws TypeError on both CORS and network failures.
      // Use navigator.onLine as a heuristic to distinguish them.
      if (!navigator.onLine) {
        setError({
          message:
            "Network error — check your internet connection and try again.",
        });
      } else {
        setError({
          message:
            "Could not fetch the URL — this is likely a CORS restriction. The server must include Access-Control-Allow-Origin headers to allow browser requests. Try a CORS-enabled endpoint or paste the JSON manually.",
        });
      }
      setValidationStatus("invalid");
    } finally {
      setLoadingUrl(false);
    }
  }

  async function handleMinify() {
    if (!input.trim()) return;
    setProcessing(true);
    try {
      const result = await process("minify", input);
      if (result.ok) {
        setOutput(result.result);
        setParseTimeMs(result.parseTimeMs);
        setError(null);
        setActiveTab("code");
      } else {
        setError({
          message: result.message,
          line: result.line,
          column: result.column,
        });
        setOutput("");
        setParseTimeMs(null);
        setValidationStatus("invalid");
      }
    } catch {
      setError({ message: "Minify failed — please try again." });
      setOutput("");
      setParseTimeMs(null);
      setValidationStatus("invalid");
    } finally {
      setProcessing(false);
    }
  }

  async function handleRepair() {
    if (!input.trim()) return;
    setProcessing(true);
    try {
      const result = await process("repair", input);
      if (result.ok) {
        setRepairResult({
          ok: true,
          result: result.result,
          fixes: result.fixes ?? [],
        });
      } else {
        setRepairResult({ ok: false, message: result.message });
      }
      setActiveTab("repair");
    } catch {
      setRepairResult({
        ok: false,
        message: "Repair failed — please try again.",
      });
      setActiveTab("repair");
    } finally {
      setProcessing(false);
    }
  }

  function handleAcceptRepair(text: string) {
    setInput(text);
    setRepairResult(null);
    setActiveTab("tree");
  }

  function handleClear() {
    if (autoFormatTimerRef.current) clearTimeout(autoFormatTimerRef.current);
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    setInput("");
    setOutput("");
    setError(null);
    setParseTimeMs(null);
    setCopyLabel("Copy");
    setFileName(null);
    setNodeCount(null);
    setValidationStatus("idle");
    setRepairResult(null);
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy"), 1500);
    } catch {
      setError({ message: "Copy failed — please copy the output manually." });
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const bytes = new TextEncoder().encode(text).length;
      if (bytes > 1_000_000) {
        setError({
          message: `Pasted content is ${(bytes / 1_000_000).toFixed(1)} MB — exceeds 1 MB limit. Use the Upload button for large files.`,
        });
        return;
      }
      setInput(text);
      setError(null);
    } catch {
      setError({
        message: "Paste failed — please paste manually into the editor.",
      });
    }
  }

  function handleSample() {
    if (autoFormatTimerRef.current) clearTimeout(autoFormatTimerRef.current);
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    setInput(SAMPLE_JSON);
    setOutput("");
    setError(null);
    setParseTimeMs(null);
    setFileName(null);
    setNodeCount(null);
    setValidationStatus("idle");
    setRepairResult(null);
  }

  const handleValidate = useCallback(
    async (content?: string) => {
      const toValidate = content ?? input;
      if (!toValidate.trim()) {
        setValidationStatus("idle");
        setNodeCount(null);
        setError(null);
        return;
      }
      const result = await process("validate", toValidate);
      if (result.ok) {
        setError(null);
        setNodeCount(result.nodeCount ?? null);
        setParseTimeMs(result.parseTimeMs);
        setValidationStatus("valid");
      } else {
        setError({
          message: result.message,
          line: result.line,
          column: result.column,
        });
        setNodeCount(null);
        setParseTimeMs(null);
        setValidationStatus("invalid");
        setActiveTab("error");
      }
    },
    [input, process],
  );

  // Auto-validate on every input change (debounced 300ms)
  useEffect(() => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    validateTimerRef.current = setTimeout(() => {
      handleValidate(input);
    }, 300);
    return () => {
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, [input, handleValidate]);

  // Called by CodeEditor when user pastes directly into the editor
  const handleEditorPaste = useCallback(
    (pastedValue: string) => {
      if (!autoFormat || !pastedValue.trim()) return;
      if (autoFormatTimerRef.current) clearTimeout(autoFormatTimerRef.current);
      autoFormatTimerRef.current = setTimeout(() => {
        handleFormat(pastedValue);
      }, 300);
    },
    [autoFormat, handleFormat],
  );

  // Keyboard shortcuts: Cmd/Ctrl+Shift+F → Format, Cmd/Ctrl+Shift+V → Validate
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        if (e.shiftKey && e.key === "F") {
          e.preventDefault();
          handleFormat();
        } else if (e.shiftKey && e.key === "V") {
          e.preventDefault();
          handleValidate();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleFormat, handleValidate]);

  // Clear stale repair result whenever the editor content changes
  useEffect(() => {
    const id = setTimeout(() => setRepairResult(null), 0);
    return () => clearTimeout(id);
  }, [input]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (autoFormatTimerRef.current) clearTimeout(autoFormatTimerRef.current);
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, []);

  const errorLabel =
    validationStatus === "invalid" && error
      ? error.line != null
        ? `Invalid JSON — line ${error.line}${error.column != null ? `, col ${error.column}` : ""}: ${error.message}`
        : `Invalid JSON: ${error.message}`
      : null;

  const statusText =
    validationStatus === "valid" && nodeCount !== null && parseTimeMs !== null
      ? `✓ Valid — ${nodeCount} node${nodeCount === 1 ? "" : "s"}, parsed in ${parseTimeMs} ms`
      : validationStatus === "invalid" && error
        ? error.line != null
          ? `✗ Invalid JSON — line ${error.line}${error.column != null ? `, col ${error.column}` : ""}: ${error.message}`
          : `✗ Invalid JSON: ${error.message}`
        : "Ready — ⌘⇧F to format · ⌘⇧V to validate";

  return (
    <div className="app">
      <header className="app-header">
        <h1>JSON Beautifier</h1>
        {fileName && <span className="file-name">{fileName}</span>}
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.jsonl"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        aria-hidden="true"
      />

      <ActionBar
        indent={indent}
        onIndentChange={setIndent}
        onFormat={() => handleFormat()}
        onMinify={handleMinify}
        onClear={handleClear}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onSample={handleSample}
        onUpload={handleUploadClick}
        onLoadUrl={() => setUrlDialogOpen(true)}
        onRepair={handleRepair}
        processing={processing}
        copyLabel={copyLabel}
        autoFormat={autoFormat}
        onAutoFormatChange={setAutoFormat}
        repairEnabled={validationStatus === "invalid"}
      />

      {errorLabel && <div className="error-banner">{errorLabel}</div>}

      <div className="editor-area">
        <SplitPane
          left={
            <div
              className={`drop-zone${isDragging ? " drop-zone--active" : ""}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CodeEditor
                value={input}
                onChange={setInput}
                onPaste={handleEditorPaste}
                error={error}
                placeholder={'Paste or type JSON here…\n\n{"key": "value"}'}
              />
              {isDragging && (
                <div className="drop-overlay" aria-hidden="true">
                  <span>Drop JSON file to load</span>
                </div>
              )}
              {uploadProgress !== null && (
                <div
                  className="upload-progress"
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="upload-progress__bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          }
          right={
            <RightPane
              output={output}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              error={error}
              input={input}
              repairResult={repairResult}
              onAcceptRepair={handleAcceptRepair}
            />
          }
        />
      </div>

      <div className="status-bar">
        <span>{statusText}</span>
      </div>

      {urlDialogOpen && (
        <LoadUrlDialog
          onLoad={handleLoadUrl}
          onClose={() => setUrlDialogOpen(false)}
          loading={loadingUrl}
        />
      )}
    </div>
  );
}
