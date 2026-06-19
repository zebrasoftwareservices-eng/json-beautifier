import { useState } from "react";
import "./App.css";
import { useJsonWorker } from "./worker/useJsonWorker";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [errorLine, setErrorLine] = useState<number | undefined>();
  const [errorCol, setErrorCol] = useState<number | undefined>();
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);
  const [parseTimeMs, setParseTimeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);

  const { process } = useJsonWorker();

  async function beautify() {
    if (!input.trim()) return;
    setProcessing(true);
    const result = await process("beautify", input, indent);
    setProcessing(false);
    if (result.ok) {
      setOutput(result.result);
      setParseTimeMs(result.parseTimeMs);
      setError("");
      setErrorLine(undefined);
      setErrorCol(undefined);
    } else {
      setError(result.message);
      setErrorLine(result.line);
      setErrorCol(result.column);
      setOutput("");
      setParseTimeMs(null);
    }
  }

  async function minify() {
    if (!input.trim()) return;
    setProcessing(true);
    const result = await process("minify", input);
    setProcessing(false);
    if (result.ok) {
      setOutput(result.result);
      setParseTimeMs(result.parseTimeMs);
      setError("");
      setErrorLine(undefined);
      setErrorCol(undefined);
    } else {
      setError(result.message);
      setErrorLine(result.line);
      setErrorCol(result.column);
      setOutput("");
      setParseTimeMs(null);
    }
  }

  function clear() {
    setInput("");
    setOutput("");
    setError("");
    setErrorLine(undefined);
    setErrorCol(undefined);
    setParseTimeMs(null);
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy failed — please copy the output manually.");
    }
  }

  const errorLabel =
    error &&
    (errorLine != null
      ? `Error at line ${errorLine}${errorCol != null ? `, col ${errorCol}` : ""}: ${error}`
      : error);

  return (
    <div className="app">
      <header>
        <h1>JSON Beautifier</h1>
        <p>Paste your JSON below to format or minify it.</p>
      </header>

      <div className="controls">
        <label>
          Indent
          <select
            value={indent}
            onChange={(e) => setIndent(Number(e.target.value))}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
        <button onClick={beautify} disabled={processing}>
          {processing ? "Working…" : "Beautify"}
        </button>
        <button onClick={minify} disabled={processing}>
          Minify
        </button>
        <button onClick={clear} className="secondary" disabled={processing}>
          Clear
        </button>
      </div>

      {errorLabel && <div className="error">{errorLabel}</div>}

      <div className="editors">
        <div className="editor-pane">
          <label htmlFor="json-input">Input</label>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            spellCheck={false}
          />
        </div>
        <div className="editor-pane">
          <div className="pane-header">
            <label htmlFor="json-output">Output</label>
            <button onClick={copy} className="copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            id="json-output"
            value={output}
            readOnly
            spellCheck={false}
          />
        </div>
      </div>

      {parseTimeMs !== null && (
        <div className="status-bar">Parsed in {parseTimeMs} ms</div>
      )}
    </div>
  );
}
