import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { useJsonWorker } from "./worker/useJsonWorker";
import { CodeEditor, type CodeEditorError } from "./components/CodeEditor";
import { SplitPane } from "./components/SplitPane";
import { ActionBar, SAMPLE_JSON } from "./components/ActionBar";
import { RightPane, type TabId } from "./components/RightPane";

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
        }
      } catch {
        setError({ message: "Formatting failed — please try again." });
        setOutput("");
        setParseTimeMs(null);
      } finally {
        formatInFlightRef.current = false;
        setProcessing(false);
      }
    },
    [input, indent, process],
  );

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
      }
    } catch {
      setError({ message: "Minify failed — please try again." });
      setOutput("");
      setParseTimeMs(null);
    } finally {
      setProcessing(false);
    }
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
          message: `Pasted content is ${(bytes / 1_000_000).toFixed(1)} MB — exceeds 1 MB limit. Large file support is coming soon.`,
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

      <ActionBar
        indent={indent}
        onIndentChange={setIndent}
        onFormat={() => handleFormat()}
        onMinify={handleMinify}
        onClear={handleClear}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onSample={handleSample}
        processing={processing}
        copyLabel={copyLabel}
        autoFormat={autoFormat}
        onAutoFormatChange={setAutoFormat}
      />

      {errorLabel && <div className="error-banner">{errorLabel}</div>}

      <div className="editor-area">
        <SplitPane
          left={
            <CodeEditor
              value={input}
              onChange={setInput}
              onPaste={handleEditorPaste}
              error={error}
              placeholder={'Paste or type JSON here…\n\n{"key": "value"}'}
            />
          }
          right={
            <RightPane
              output={output}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              error={error}
              input={input}
            />
          }
        />
      </div>

      <div className="status-bar">
        <span>{statusText}</span>
      </div>
    </div>
  );
}
