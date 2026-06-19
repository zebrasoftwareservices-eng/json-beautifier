import { useState } from "react";
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

  const { process } = useJsonWorker();

  async function handleFormat() {
    if (!input.trim()) return;
    setProcessing(true);
    const result = await process("beautify", input, indent);
    setProcessing(false);
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
  }

  async function handleMinify() {
    if (!input.trim()) return;
    setProcessing(true);
    const result = await process("minify", input);
    setProcessing(false);
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
  }

  function handleClear() {
    setInput("");
    setOutput("");
    setError(null);
    setParseTimeMs(null);
    setCopyLabel("Copy");
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
    setInput(SAMPLE_JSON);
    setOutput("");
    setError(null);
    setParseTimeMs(null);
  }

  const errorLabel = error
    ? error.line != null
      ? `Error at line ${error.line}${error.column != null ? `, col ${error.column}` : ""}: ${error.message}`
      : error.message
    : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>JSON Beautifier</h1>
      </header>

      <ActionBar
        indent={indent}
        onIndentChange={setIndent}
        onFormat={handleFormat}
        onMinify={handleMinify}
        onClear={handleClear}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onSample={handleSample}
        processing={processing}
        copyLabel={copyLabel}
      />

      {errorLabel && <div className="error-banner">{errorLabel}</div>}

      <div className="editor-area">
        <SplitPane
          left={
            <CodeEditor
              value={input}
              onChange={setInput}
              error={error}
              placeholder={'Paste or type JSON here…\n\n{"key": "value"}'}
            />
          }
          right={
            <RightPane
              output={output}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          }
        />
      </div>

      <div className="status-bar">
        {parseTimeMs !== null ? (
          <span>Parsed in {parseTimeMs} ms</span>
        ) : (
          <span>Ready</span>
        )}
      </div>
    </div>
  );
}
