import { Link } from "react-router-dom";
import App from "../App";
import { PageMeta } from "../components/PageMeta";
import "./ToolLandingPage.css";

const FAQ = [
  {
    question: "How much does minification reduce file size?",
    answer:
      "Typical JSON minification removes 10–40% of file size by stripping whitespace, newlines, and indentation. The exact savings depend on how deeply nested and heavily indented the original file is. For network payloads, gzip compression on top of minification is even more effective.",
  },
  {
    question: "Does minifying JSON change the data?",
    answer:
      "No. Minification only removes whitespace that is not part of string values. The data — keys, values, structure, and ordering — is preserved exactly.",
  },
  {
    question: "Is my JSON sent to a server?",
    answer:
      "No. Minification runs entirely in your browser using a Web Worker. Your data never leaves your device.",
  },
];

export function JsonMinifierPage() {
  return (
    <div className="tool-landing">
      <PageMeta
        title="Minify JSON Online — Free JSON Minifier & Compressor"
        description="Remove whitespace from JSON instantly in your browser. Reduces file size for APIs and config files. Free and private — your data never leaves your device."
        canonical="https://jsonbeautifier.zss.dev/json-minifier"
        faq={FAQ}
      />

      <header className="tool-landing__header">
        <Link to="/" className="tool-landing__back">
          ← JSON Beautifier
        </Link>
        <span className="tool-landing__sep">/</span>
        <span className="tool-landing__title">JSON Minifier</span>
      </header>

      <div className="tool-landing__tool">
        <App initialTab="code" />
      </div>

      <section
        className="tool-landing__content"
        aria-label="About JSON Minifier"
      >
        <h2>Minify JSON Online</h2>
        <p>
          Paste your JSON into the editor above and click{" "}
          <strong>Minify</strong>. All unnecessary whitespace, newlines, and
          indentation are stripped, reducing file size without changing any
          data. The minified output appears in the Code tab on the right, ready
          to copy.
        </p>
        <p>
          Smaller JSON payloads mean faster API responses, lower bandwidth
          costs, and quicker parsing times — especially for mobile clients and
          embedded systems with limited resources.
        </p>

        <h2>What is JSON minification?</h2>
        <p>
          JSON minification (also called JSON compression or uglification)
          removes all non-significant whitespace from a JSON document — spaces,
          tabs, and newlines that exist only for human readability. The result
          is semantically identical JSON on a single line with no extra
          characters.
        </p>

        <h2>When to minify JSON</h2>
        <ul>
          <li>
            <strong>API payloads</strong> — reduce the bytes transferred between
            client and server in production environments
          </li>
          <li>
            <strong>Config files bundled in apps</strong> — smaller bundles mean
            faster load times
          </li>
          <li>
            <strong>Embedded systems and IoT</strong> — devices with tight
            memory constraints need compact data
          </li>
          <li>
            <strong>Storage</strong> — minified JSON takes less space in
            databases and caches
          </li>
        </ul>

        <h2>Frequently asked questions</h2>
        <div className="tool-landing__faq">
          {FAQ.map((item) => (
            <div key={item.question} className="tool-landing__faq-item">
              <p className="tool-landing__faq-q">{item.question}</p>
              <p className="tool-landing__faq-a">{item.answer}</p>
            </div>
          ))}
        </div>

        <h2>Related tools</h2>
        <div className="tool-landing__related">
          <Link to="/json-validator" className="tool-landing__related-link">
            Validate JSON
          </Link>
          <Link to="/json-repair" className="tool-landing__related-link">
            Fix &amp; Repair JSON
          </Link>
          <Link to="/json-to-yaml" className="tool-landing__related-link">
            JSON to YAML
          </Link>
          <Link to="/json-to-csv" className="tool-landing__related-link">
            JSON to CSV
          </Link>
          <Link to="/editor" className="tool-landing__related-link">
            Full JSON Editor
          </Link>
        </div>
      </section>
    </div>
  );
}
