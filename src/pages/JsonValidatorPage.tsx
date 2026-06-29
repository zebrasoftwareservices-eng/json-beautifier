import { Link } from "react-router-dom";
import App from "../App";
import { PageMeta } from "../components/PageMeta";
import "./ToolLandingPage.css";

const FAQ = [
  {
    question: "What makes JSON valid?",
    answer:
      "Valid JSON must follow RFC 8259: strings use double quotes, objects have key-value pairs separated by commas, arrays are comma-separated values in brackets, and supported value types are strings, numbers, booleans (true/false), null, objects, and arrays. Trailing commas, single quotes, and comments are not allowed.",
  },
  {
    question: "Why is my JSON invalid even though it looks correct?",
    answer:
      "Common hidden issues include trailing commas after the last item in an object or array, smart quotes (“”) copied from a word processor instead of straight double quotes, invisible Unicode characters, or unescaped special characters inside strings. This validator highlights the exact line and column of the error.",
  },
  {
    question: "Is my JSON sent to a server?",
    answer:
      "No. All validation happens locally in your browser using a Web Worker. Your data never leaves your device.",
  },
];

export function JsonValidatorPage() {
  return (
    <div className="tool-landing">
      <PageMeta
        title="Validate JSON Online — Free JSON Validator"
        description="Instantly validate JSON in your browser. Highlights errors with line numbers, explains what went wrong, and suggests fixes. Free and private — your data never leaves your device."
        canonical="https://jsonbeautifier.zss.dev/json-validator"
        faq={FAQ}
      />

      <header className="tool-landing__header">
        <Link to="/" className="tool-landing__back">
          ← JSON Beautifier
        </Link>
        <span className="tool-landing__sep">/</span>
        <span className="tool-landing__title">JSON Validator</span>
      </header>

      <div className="tool-landing__tool">
        <App initialTab="error" />
      </div>

      <section
        className="tool-landing__content"
        aria-label="About JSON Validator"
      >
        <h2>Validate JSON Online</h2>
        <p>
          Paste your JSON into the editor above and errors are highlighted
          instantly as you type. The validator pinpoints the exact line and
          column of every syntax mistake and explains what went wrong in plain
          English — no cryptic parser messages.
        </p>
        <p>
          Built on the same high-performance Web Worker parser that powers the
          JSON Beautifier, it handles files up to 25 MB without freezing your
          browser tab.
        </p>

        <h2>What is JSON validation?</h2>
        <p>
          JSON (JavaScript Object Notation) is a lightweight data-interchange
          format. Validation checks that your text strictly conforms to RFC 8259
          — the standard that defines valid JSON. A validator catches problems
          like trailing commas, mismatched brackets, unquoted keys, and invalid
          escape sequences before they cause runtime errors in your application.
        </p>

        <h2>Common validation errors</h2>
        <ul>
          <li>
            <strong>Trailing comma</strong> — a comma after the last item in an
            object or array (<code>{`{"a":1,}`}</code>)
          </li>
          <li>
            <strong>Single quotes</strong> — JSON requires double quotes for
            strings and keys
          </li>
          <li>
            <strong>Unquoted keys</strong> — object keys must be double-quoted
            strings
          </li>
          <li>
            <strong>Comments</strong> — JSON does not support{" "}
            <code>// line</code> or <code>/* block */</code> comments
          </li>
          <li>
            <strong>Missing comma</strong> — values in arrays and objects must
            be separated by commas
          </li>
          <li>
            <strong>Invalid literals</strong> — <code>undefined</code>,{" "}
            <code>NaN</code>, and <code>Infinity</code> are JavaScript values,
            not valid JSON
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
          <Link to="/json-repair" className="tool-landing__related-link">
            Fix &amp; Repair JSON
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
