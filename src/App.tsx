import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./App.css";
import { useJsonWorker } from "./worker/useJsonWorker";
import type { CodeEditorError } from "./components/CodeEditor";
import { EditorPanel } from "./components/EditorPanel";
import { AppShell } from "./components/AppShell";
import { SAMPLE_JSON } from "./components/ActionBar";
import { ActionToolbar } from "./components/ActionToolbar";
import { EditorEmptyState } from "./components/EditorEmptyState";
import { LoadUrlDialog } from "./components/LoadUrlDialog";
import {
  CommandPalette,
  type PaletteCommand,
} from "./components/CommandPalette";
import { IdentityBar } from "./components/IdentityBar";
import { StatusBar } from "./components/StatusBar";
import type { CodeEditorCursor } from "./components/CodeEditor";
import {
  RightPane,
  type TabId,
  type RepairResult,
} from "./components/RightPane";
import { repairJson } from "./lib/json/repair";
import { getSuggestion } from "./lib/json/suggestions";
import { fetchJsonUrl } from "./lib/json/load-url";
import { track } from "./analytics";

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const m = isMac ? "⌘" : "Ctrl+";
const s = isMac ? "⇧" : "Shift+";

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

interface AppProps {
  initialTab?: TabId;
}

export default function App({ initialTab = "tree" }: AppProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<CodeEditorError | null>(null);
  const [indent, setIndent] = useState<number | "\t">(2);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [autoFormat, setAutoFormat] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    "idle" | "valid" | "invalid"
  >("idle");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [partialJson, setPartialJson] = useState<string | null>(null);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [hasLargeIntegers, setHasLargeIntegers] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteKey, setPaletteKey] = useState(0);
  const [cursor, setCursor] = useState<CodeEditorCursor>({
    line: 1,
    column: 1,
  });
  const [jumpTarget, setJumpTarget] = useState<{
    line: number;
    column?: number;
    nonce: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestLoadIdRef = useRef(0);
  const latestValidateIdRef = useRef(0);
  const jumpNonceRef = useRef(0);
  const prevHasErrorRef = useRef(false);
  const { process } = useJsonWorker();
  const autoFormatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formatInFlightRef = useRef(false);

  // Accepts optional content to format (avoids stale closure on state)
  // Accepts optional content to format (avoids stale closure on state).
  // Returns true only when the format actually succeeded.
  const handleFormat = useCallback(
    async (content?: string): Promise<boolean> => {
      const toFormat = content ?? input;
      if (!toFormat.trim()) return false;
      if (formatInFlightRef.current) return false;
      formatInFlightRef.current = true;
      setProcessing(true);
      try {
        const result = await process("beautify", toFormat, indent);
        if (result.ok) {
          setOutput(result.result);
          setHasLargeIntegers(result.hasLargeIntegers ?? false);
          setError(null);
          setActiveTab("code");
          track.jsonFormatted();
          return true;
        } else {
          setError({
            message: result.message,
            line: result.line,
            column: result.column,
          });
          setOutput("");
          setHasLargeIntegers(false);
          setValidationStatus("invalid");
          return false;
        }
      } catch {
        setError({ message: "Formatting failed — please try again." });
        setOutput("");
        setHasLargeIntegers(false);
        setValidationStatus("invalid");
        return false;
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
      setFileName(file.name);
      track.fileUploaded();
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
    setLoadingUrl(true);
    setError(null);
    const result = await fetchJsonUrl(url);
    setLoadingUrl(false);
    if (!result.ok) {
      setError({ message: result.message });
      setValidationStatus("invalid");
      return;
    }
    setInput(result.text);
    setOutput("");
    setFileName(url);
    setUrlDialogOpen(false);
    track.urlLoaded();
  }

  async function handleMinify() {
    if (!input.trim()) return;
    setProcessing(true);
    setHasLargeIntegers(false);
    try {
      const result = await process("minify", input);
      if (result.ok) {
        setOutput(result.result);
        setHasLargeIntegers(result.hasLargeIntegers ?? false);
        setError(null);
        setActiveTab("code");
      } else {
        setError({
          message: result.message,
          line: result.line,
          column: result.column,
        });
        setOutput("");
        setValidationStatus("invalid");
      }
    } catch {
      setError({ message: "Minify failed — please try again." });
      setOutput("");
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
        track.jsonRepaired();
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
    latestValidateIdRef.current += 1;
    setInput(text);
    setPartialJson(null);
    setValidationStatus("idle");
    setError(null);
    setRepairResult(null);
    setActiveTab("tree");
  }

  // ErrorBanner "Fix automatically" (⌘R): repair, apply directly, and
  // re-validate — distinct from the toolbar's Repair preview-and-accept flow.
  async function handleAutoFix() {
    if (!input.trim() || validationStatus !== "invalid") return;
    setProcessing(true);
    try {
      const result = await process("repair", input);
      if (!result.ok) {
        setError({ message: result.message });
        setValidationStatus("invalid");
        return;
      }
      const fixedText = result.result;
      track.jsonRepaired();
      latestValidateIdRef.current += 1;
      setInput(fixedText);
      setPartialJson(null);

      const validation = await process("validate", fixedText);
      if (validation.ok) {
        setError(null);
        setHasLargeIntegers(validation.hasLargeIntegers ?? false);
        setValidationStatus("valid");
        setActiveTab("tree");
      } else {
        const suggestion = getSuggestion(
          fixedText,
          validation.message,
          validation.line,
        );
        setError({
          message: validation.message,
          line: validation.line,
          column: validation.column,
          suggestion: suggestion ?? undefined,
        });
        setHasLargeIntegers(false);
        setValidationStatus("invalid");
        const repaired = repairJson(fixedText);
        setPartialJson(repaired.ok ? repaired.result : null);
      }
    } catch {
      setError({ message: "Repair failed — please try again." });
      setValidationStatus("invalid");
    } finally {
      setProcessing(false);
    }
  }

  function handleJumpToError() {
    if (error?.line == null) return;
    jumpNonceRef.current += 1;
    setJumpTarget({
      line: error.line,
      column: error.column,
      nonce: jumpNonceRef.current,
    });
  }

  function handleClear() {
    if (autoFormatTimerRef.current) clearTimeout(autoFormatTimerRef.current);
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    setInput("");
    setOutput("");
    setError(null);
    setCopyLabel("Copy");
    setFileName(null);
    setValidationStatus("idle");
    setRepairResult(null);
    setHasLargeIntegers(false);
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

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Derive filename: strip old extension and use .json
    a.download = fileName
      ? fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_") +
        ".json"
      : "output.json";
    a.click();
    URL.revokeObjectURL(url);
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
    setFileName(null);
    setValidationStatus("idle");
    setRepairResult(null);
    setHasLargeIntegers(false);
    // Format immediately and show the tree so the user sees results right away
    handleFormat(SAMPLE_JSON)
      .then((ok) => {
        if (ok) setActiveTab("tree");
      })
      .catch(() => {});
  }

  const handleValidate = useCallback(
    async (content?: string, switchTab = false) => {
      if (switchTab && validateTimerRef.current) {
        clearTimeout(validateTimerRef.current);
        validateTimerRef.current = null;
      }
      const toValidate = content ?? input;
      const validateId = ++latestValidateIdRef.current;
      if (!toValidate.trim()) {
        setValidationStatus("idle");
        setHasLargeIntegers(false);
        setError(null);
        setPartialJson(null);
        return;
      }
      const result = await process("validate", toValidate);
      if (validateId !== latestValidateIdRef.current) return; // discard stale
      if (result.ok) {
        setError(null);
        setHasLargeIntegers(result.hasLargeIntegers ?? false);
        setValidationStatus("valid");
        setPartialJson(null);
        if (switchTab) track.jsonValidated();
      } else {
        const suggestion = getSuggestion(
          toValidate,
          result.message,
          result.line,
        );
        setError({
          message: result.message,
          line: result.line,
          column: result.column,
          suggestion: suggestion ?? undefined,
        });
        setHasLargeIntegers(false);
        setValidationStatus("invalid");
        if (switchTab) setActiveTab("error");
        // Attempt tolerant parse for partial tree display
        const repaired = repairJson(toValidate);
        setPartialJson(repaired.ok ? repaired.result : null);
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

  // Error tab auto-activates the moment JSON becomes invalid (not on every
  // subsequent re-validate while it stays invalid, so it doesn't fight the
  // user's own tab navigation).
  useEffect(() => {
    const hasError = validationStatus === "invalid" && error != null;
    if (hasError && !prevHasErrorRef.current) {
      setActiveTab("error");
    }
    prevHasErrorRef.current = hasError;
  }, [validationStatus, error]);

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

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      // Don't let editor shortcuts (especially destructive ones like Clear
      // and Fix automatically) fire in the background while a modal is open.
      if (paletteOpen || urlDialogOpen) return;
      const allowedWhileProcessing =
        !e.shiftKey && (e.key === "k" || e.key === "/" || e.key === "f");
      if (processing && !allowedWhileProcessing) return;
      if (e.shiftKey) {
        switch (e.key) {
          case "F":
            e.preventDefault();
            handleFormat();
            break;
          case "M":
            e.preventDefault();
            handleMinify();
            break;
          case "V":
            e.preventDefault();
            handleValidate(undefined, true);
            break;
          case "R":
            e.preventDefault();
            handleRepair();
            break;
          case "C":
            e.preventDefault();
            handleCopy();
            break;
          case "U":
            e.preventDefault();
            setUrlDialogOpen(true);
            break;
          case "Delete":
          case "Backspace":
            e.preventDefault();
            handleClear();
            break;
        }
      } else {
        switch (e.key) {
          case "k":
            e.preventDefault();
            setPaletteOpen(true);
            setPaletteKey((k) => k + 1);
            break;
          case "s":
            e.preventDefault();
            handleDownload();
            break;
          case "/":
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("tree:collapse-all"));
            break;
          case "f":
            e.preventDefault();
            setActiveTab("tree");
            setTimeout(
              () => window.dispatchEvent(new CustomEvent("tree:focus-search")),
              50,
            );
            break;
          case "l":
            e.preventDefault();
            setUrlDialogOpen(true);
            break;
          case "r":
            e.preventDefault();
            handleAutoFix();
            break;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    handleFormat,
    handleMinify,
    handleValidate,
    handleRepair,
    handleAutoFix,
    handleCopy,
    handleDownload,
    handleClear,
    processing,
    paletteOpen,
    urlDialogOpen,
  ]);

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

  const lineCount = input ? input.split("\n").length : 0;
  const inputSizeBytes = new TextEncoder().encode(input).length;
  const sizeLabel =
    inputSizeBytes > 0
      ? inputSizeBytes >= 1_000_000
        ? `${(inputSizeBytes / 1_000_000).toFixed(1)} MB`
        : inputSizeBytes >= 1_000
          ? `${(inputSizeBytes / 1_000).toFixed(1)} KB`
          : `${inputSizeBytes} B`
      : null;

  const memoryWarning = inputSizeBytes > 10_000_000;

  const indentLabel = indent === "\t" ? "Tab" : `${indent} spaces`;

  const bigintNote = hasLargeIntegers
    ? "⚠ Large integers — precision preserved"
    : null;

  const paletteCmds = useMemo<PaletteCommand[]>(
    () => [
      {
        id: "format",
        label: "Format JSON",
        shortcut: `${m}${s}F`,
        action: () => handleFormat(),
        disabled: processing,
      },
      {
        id: "minify",
        label: "Minify JSON",
        shortcut: `${m}${s}M`,
        action: handleMinify,
        disabled: processing,
      },
      {
        id: "validate",
        label: "Validate JSON",
        shortcut: `${m}${s}V`,
        action: () => handleValidate(undefined, true),
        disabled: processing,
      },
      {
        id: "repair",
        label: "Repair JSON",
        shortcut: `${m}${s}R`,
        action: handleRepair,
        disabled: processing || validationStatus !== "invalid",
      },
      {
        id: "copy",
        label: "Copy Output",
        shortcut: `${m}${s}C`,
        action: handleCopy,
        disabled: processing,
      },
      {
        id: "download",
        label: "Download JSON",
        shortcut: `${m}S`,
        action: handleDownload,
        disabled: processing,
      },
      {
        id: "load-url",
        label: "Load from URL",
        shortcut: `${m}${s}U`,
        action: () => setUrlDialogOpen(true),
      },
      {
        id: "search",
        label: "Search in JSON",
        shortcut: `${m}F`,
        action: () => {
          setActiveTab("tree");
          setTimeout(
            () => window.dispatchEvent(new CustomEvent("tree:focus-search")),
            50,
          );
        },
      },
      {
        id: "collapse",
        label: "Collapse All Nodes",
        shortcut: `${m}/`,
        action: () =>
          window.dispatchEvent(new CustomEvent("tree:collapse-all")),
      },
      {
        id: "clear",
        label: "Clear Editor",
        shortcut: isMac ? `${m}${s}⌫` : `${m}${s}Del`,
        action: handleClear,
        disabled: processing,
      },
    ],
    [
      handleFormat,
      handleMinify,
      handleValidate,
      handleRepair,
      handleCopy,
      handleDownload,
      handleClear,
      validationStatus,
      processing,
    ],
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.txt,.jsonl"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        aria-hidden="true"
      />
      <AppShell
        identityBar={
          <IdentityBar
            fileName={fileName}
            onOpenPalette={() => {
              setPaletteOpen(true);
              setPaletteKey((k) => k + 1);
            }}
          />
        }
        toolbar={
          <>
            <ActionToolbar
              indent={indent}
              onIndentChange={setIndent}
              onFormat={() => handleFormat()}
              onMinify={handleMinify}
              onValidate={() => handleValidate(undefined, true)}
              onRepair={handleRepair}
              onCopy={handleCopy}
              onDownload={handleDownload}
              onClear={handleClear}
              processing={processing}
              hasInput={input.trim().length > 0}
              copyLabel={copyLabel}
              autoFormat={autoFormat}
              onAutoFormatChange={setAutoFormat}
              repairErrorCount={validationStatus === "invalid" ? 1 : 0}
            />
            {memoryWarning && (
              <div className="memory-warning">
                ⚠ Large document ({sizeLabel}) — performance may be affected
              </div>
            )}
            {bigintNote && <div className="memory-warning">{bigintNote}</div>}
            {errorLabel && <div className="error-banner">{errorLabel}</div>}
          </>
        }
        left={
          <EditorPanel
            value={input}
            onChange={setInput}
            onPaste={handleEditorPaste}
            onCursorChange={setCursor}
            error={error}
            placeholder={'Paste or type JSON here…\n\n{"key": "value"}'}
            lineCount={lineCount}
            sizeLabel={sizeLabel}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            uploadProgress={uploadProgress}
            jumpTarget={jumpTarget}
            emptyState={
              <EditorEmptyState
                onPaste={handlePaste}
                onSample={handleSample}
                onLoadUrl={() => setUrlDialogOpen(true)}
                onUpload={handleUploadClick}
              />
            }
          />
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
            partialJson={partialJson}
            isPartialTree={
              validationStatus === "invalid" && partialJson !== null
            }
            isEmpty={!input.trim()}
            onAutoFix={handleAutoFix}
            onJumpToError={handleJumpToError}
            processing={processing}
          />
        }
        statusBar={
          <StatusBar
            state={validationStatus}
            errorCount={validationStatus === "invalid" ? 1 : 0}
            lineCount={lineCount}
            sizeLabel={sizeLabel}
            cursorLine={cursor.line}
            cursorColumn={cursor.column}
            indentLabel={indentLabel}
            onOpenPalette={() => {
              setPaletteOpen(true);
              setPaletteKey((k) => k + 1);
            }}
          />
        }
        modals={
          <>
            {urlDialogOpen && (
              <LoadUrlDialog
                onLoad={handleLoadUrl}
                onClose={() => setUrlDialogOpen(false)}
                loading={loadingUrl}
              />
            )}
            <CommandPalette
              key={paletteKey}
              open={paletteOpen}
              onClose={() => setPaletteOpen(false)}
              commands={paletteCmds}
            />
          </>
        }
      />
    </>
  );
}
