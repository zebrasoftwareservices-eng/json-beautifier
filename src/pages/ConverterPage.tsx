import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useConverter } from "../hooks/useConverter";
import { PageMeta } from "../components/PageMeta";
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

const FORMAT_META: Record<
  Format,
  {
    title: string;
    description: string;
    canonical: string;
    faq: { question: string; answer: string }[];
  }
> = {
  yaml: {
    title: "Convert JSON to YAML Online — Free JSON to YAML Converter",
    description:
      "Instantly convert JSON to YAML in your browser. Paste JSON, get YAML — no server, no sign-up. Handles nested objects, arrays, and special characters.",
    canonical: "https://jsonbeautifier.zss.dev/json-to-yaml",
    faq: [
      {
        question: "What is the difference between JSON and YAML?",
        answer:
          "JSON and YAML are both data serialization formats. YAML is a superset of JSON and uses indentation instead of braces and brackets, making it more human-readable. YAML is commonly used for config files (Docker, Kubernetes, GitHub Actions) while JSON is preferred for APIs.",
      },
      {
        question: "Does the conversion change my data?",
        answer:
          "No. The converter produces semantically equivalent YAML — all keys, values, nesting, and types are preserved exactly.",
      },
      {
        question: "Is my JSON sent to a server?",
        answer:
          "No. Conversion runs entirely in your browser. Your data never leaves your device.",
      },
    ],
  },
  csv: {
    title: "Convert JSON to CSV Online — Free JSON to CSV Converter",
    description:
      "Convert JSON arrays to CSV in your browser. Paste JSON, download CSV — no server, no sign-up. Handles nested objects with dot-notation flattening.",
    canonical: "https://jsonbeautifier.zss.dev/json-to-csv",
    faq: [
      {
        question: "What JSON structures can be converted to CSV?",
        answer:
          "The converter works best with JSON arrays of objects — the most common API response shape. Nested objects are flattened using dot notation (e.g. address.city). A single top-level object is wrapped in a one-row table.",
      },
      {
        question: "How are special characters handled in CSV output?",
        answer:
          "Values containing commas, double quotes, or newlines are automatically wrapped in double quotes and inner quotes are escaped per RFC 4180.",
      },
      {
        question: "Is my JSON sent to a server?",
        answer:
          "No. Conversion runs entirely in your browser. Your data never leaves your device.",
      },
    ],
  },
  xml: {
    title: "Convert JSON to XML Online — Free JSON to XML Converter",
    description:
      "Convert JSON to well-formed XML in your browser. Paste JSON, get XML — no server, no sign-up. Preserves structure with proper element nesting.",
    canonical: "https://jsonbeautifier.zss.dev/json-to-xml",
    faq: [
      {
        question: "How are JSON arrays converted to XML?",
        answer:
          "Top-level arrays are wrapped in a <root> element, with each item wrapped in <item>. Nested arrays use the parent key as the element name.",
      },
      {
        question:
          "What happens to JSON keys that are not valid XML element names?",
        answer:
          "Keys that start with digits or contain special characters are sanitized — prefixed with an underscore or invalid characters replaced — to produce well-formed XML.",
      },
      {
        question: "Is my JSON sent to a server?",
        answer:
          "No. Conversion runs entirely in your browser. Your data never leaves your device.",
      },
    ],
  },
};

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
  const seqRef = useRef(0);
  const outputExtRef = useRef<string>(format);

  const runConvert = useCallback(
    async (json: string, fmt: Format) => {
      if (!json.trim()) {
        seqRef.current += 1;
        setProcessing(false);
        setOutput("");
        setError(null);
        setStatusText("Ready");
        return;
      }
      const seq = ++seqRef.current;
      setProcessing(true);
      try {
        const result = await convert(fmt, json);
        if (seq !== seqRef.current) return; // discard stale result
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
        if (seq === seqRef.current) setProcessing(false);
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
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatusText("Copy failed — clipboard access denied");
    }
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

  const meta = FORMAT_META[format];

  return (
    <div className="converter">
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonical={meta.canonical}
        faq={meta.faq}
      />
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
