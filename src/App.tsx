import { useState } from "react";
import "./App.css";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [indent, setIndent] = useState(2);
  const [copied, setCopied] = useState(false);

  function beautify() {
    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, indent));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function minify() {
    try {
      const parsed: unknown = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }

  function clear() {
    setInput("");
    setOutput("");
    setError("");
  }

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

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
        <button onClick={beautify}>Beautify</button>
        <button onClick={minify}>Minify</button>
        <button onClick={clear} className="secondary">
          Clear
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="editors">
        <div className="editor-pane">
          <label>Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            spellCheck={false}
          />
        </div>
        <div className="editor-pane">
          <div className="pane-header">
            <label>Output</label>
            <button onClick={copy} className="copy-btn">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea value={output} readOnly spellCheck={false} />
        </div>
      </div>
    </div>
  );
}
