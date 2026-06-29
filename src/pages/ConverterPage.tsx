import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConverter } from "../hooks/useConverter";
import "./ConverterPage.css";

type Format = "yaml" | "csv" | "xml";

const FORMAT_LABELS: Record<Format, string> = {
  yaml: "YAML",
  csv: "CSV",
  xml: "XML",
};

const FORMAT_ROUTES: Record<Format, string> = {
  yaml: "/json-to-yaml",
  csv: "/json-to-csv",
  xml: "/json-to-xml",
};

const PLACEHOLDER = `Paste JSON here…

Example:
{
  "name": "Alice",
  "age": 30
}`;

interface ConverterPageProps {
  format: Format;
}

export function ConverterPage({ format }: ConverterPageProps) {
  const { convert } = useConverter();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const inFlightRef = useRef(false);
  const outputExtRef = useRef<string>(format);

  const runConvert = useCallback(
    async (json: string, fmt: Format) => {
      if (!json.trim()) {
        setOutput("");
        setError(null);
        setStatusText("Ready");
        return;
      }
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setProcessing(true);
      try {
        const result = await convert(fmt, json);
        if (result.ok) {
          setOutput(result.result);
          setError(null);
          outputExtRef.current = result.ext ?? fmt;
          setStatusText(
            `Converted · ${result.result.split("\n").length} lines`,
          );
        } else {
          setOutput("");
          setError(result.message);
          setStatusText("Conversion failed");
        }
      } finally {
        inFlightRef.current = false;
        setProcessing(false);
      }
    },
    [convert],
  );

  // Re-run when input or format changes; defer to avoid synchronous setState in effect
  useEffect(() => {
    const id = setTimeout(() => {
      void runConvert(input, format);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, format]);

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownload() {
    if (!output) return;
    const ext = outputExtRef.current;
    const mimeTypes: Record<string, string> = {
      yaml: "text/yaml",
      csv: "text/csv",
      xml: "application/xml",
    };
    const blob = new Blob([output], {
      type: mimeTypes[ext] ?? "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="converter">
      <header className="converter-header">
        <Link to="/" className="converter-header__title">
          JSON Beautifier
        </Link>
        <span className="converter-header__sep">/</span>
        <span className="converter-header__title">
          JSON → {FORMAT_LABELS[format]}
        </span>
        <nav className="converter-tabs" aria-label="Conversion format">
          {(["yaml", "csv", "xml"] as Format[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={`converter-tab${format === fmt ? " converter-tab--active" : ""}`}
              onClick={() => navigate(FORMAT_ROUTES[fmt])}
              aria-current={format === fmt ? "page" : undefined}
            >
              {FORMAT_LABELS[fmt]}
            </button>
          ))}
        </nav>
      </header>

      <main className="converter-body">
        <section className="converter-pane" aria-label="JSON input">
          <div className="converter-pane__label">JSON input</div>
          <textarea
            className="converter-pane__textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            aria-label="JSON input"
          />
        </section>

        <section
          className="converter-pane"
          aria-label={`${FORMAT_LABELS[format]} output`}
        >
          <div className="converter-pane__label">
            {FORMAT_LABELS[format]} output
            {processing && " · converting…"}
          </div>
          {error ? (
            <div className="converter-error" role="alert">
              {error}
            </div>
          ) : (
            <pre className="converter-pane__content" aria-live="polite">
              {output}
            </pre>
          )}
          <div className="converter-output-bar">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!output}
              aria-label="Copy output to clipboard"
            >
              Copy {FORMAT_LABELS[format]}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleDownload}
              disabled={!output}
              aria-label={`Download as .${format} file`}
            >
              Download .{format}
            </button>
            {copied && (
              <span className="converter-output-bar__copied" role="status">
                Copied!
              </span>
            )}
          </div>
        </section>
      </main>

      <footer className="converter-status">
        <span>{statusText}</span>
        <span className="converter-status__privacy">
          Processed locally · No data sent to servers
        </span>
      </footer>
    </div>
  );
}
