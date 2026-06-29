import { Link } from "react-router-dom";
import App from "../App";
import { PageMeta } from "../components/PageMeta";
import "./ToolLandingPage.css";

const FAQ = [
  {
    question: "What kinds of JSON can be auto-repaired?",
    answer:
      "The repair engine handles the most common issues: trailing commas, missing commas between items, single-quoted strings, unquoted keys, JavaScript comments, and truncated JSON from copy-paste errors. It cannot reconstruct data that is fundamentally missing (e.g. a completely garbled file).",
  },
  {
    question: "Will the repair change my data?",
    answer:
      "The repair tool makes the minimum changes required to produce valid JSON. It shows you a preview and a diff of every fix before you accept it, so you stay in control. No data is modified without your confirmation.",
  },
  {
    question: "Is my JSON sent to a server?",
    answer:
      "No. Repair runs entirely in your browser. Your data never leaves your device.",
  },
];

export function JsonRepairPage() {
  return (
    <div className="tool-landing">
      <PageMeta
        title="Fix & Repair Invalid JSON Online — Free JSON Repair Tool"
        description="Automatically fix invalid JSON in your browser. Handles trailing commas, single quotes, missing commas, and more. Preview every change before accepting. Free and private."
        canonical="https://jsonbeautifier.zss.dev/json-repair"
        faq={FAQ}
      />

      <header className="tool-landing__header">
        <Link to="/" className="tool-landing__back">
          ← JSON Beautifier
        </Link>
        <span className="tool-landing__sep">/</span>
        <span className="tool-landing__title">JSON Repair</span>
      </header>

      <div className="tool-landing__tool">
        <App initialTab="repair" />
      </div>

      <section className="tool-landing__content" aria-label="About JSON Repair">
        <h2>Fix Invalid JSON Online</h2>
        <p>
          Paste broken JSON into the editor above and click{" "}
          <strong>Repair</strong>. The repair engine diagnoses the problem and
          proposes the minimum fix needed to produce valid JSON — showing you
          exactly what changed before you accept anything.
        </p>
        <p>
          Common sources of broken JSON include manual editing, API responses
          with JSONP wrappers, logs that got truncated, and copy-pasting from
          documentation that uses JavaScript syntax instead of strict JSON.
        </p>

        <h2>What is JSON repair?</h2>
        <p>
          JSON repair is the process of automatically correcting syntax errors
          in a JSON document so it becomes parseable. Unlike a validator that
          only tells you what is wrong, a repair tool also fixes it — while
          preserving your original data as closely as possible.
        </p>

        <h2>What this tool can fix</h2>
        <ul>
          <li>Trailing commas after the last item in objects and arrays</li>
          <li>Missing commas between consecutive values</li>
          <li>Single-quoted strings and unquoted object keys</li>
          <li>
            JavaScript-style comments (<code>{"// …"}</code> and{" "}
            <code>{"/* … */"}</code>)
          </li>
          <li>Unescaped control characters inside strings</li>
          <li>
            Common JavaScript literals (<code>undefined</code> →{" "}
            <code>null</code>)
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
          <Link to="/json-minifier" className="tool-landing__related-link">
            Minify JSON
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
