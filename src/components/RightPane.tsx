import { useState } from "react";
import { CodeEditor, type CodeEditorError } from "./CodeEditor";
import { TreeView } from "./TreeView";
import { TableView } from "./TableView";

export type TabId =
  | "tree"
  | "code"
  | "error"
  | "repair"
  | "table"
  | "diff"
  | "schema";

const TABS: { id: TabId; label: string }[] = [
  { id: "tree", label: "Tree" },
  { id: "code", label: "Code" },
  { id: "error", label: "Error" },
  { id: "repair", label: "Repair" },
  { id: "table", label: "Table" },
  { id: "diff", label: "Diff" },
  { id: "schema", label: "Schema" },
];

export type RepairResult =
  | { ok: true; result: string; fixes: string[] }
  | { ok: false; message: string };

interface RightPaneProps {
  output: string;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  error?: CodeEditorError | null;
  input?: string;
  repairResult?: RepairResult | null;
  onAcceptRepair?: (text: string) => void;
  partialJson?: string | null;
  isPartialTree?: boolean;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="tab-placeholder">
      <span>{label} view — coming soon</span>
    </div>
  );
}

function ErrorPanel({
  error,
  input,
}: {
  error: CodeEditorError | null | undefined;
  input: string | undefined;
}) {
  if (!error) {
    return (
      <div className="error-panel error-panel--none">
        <span>No errors — JSON is valid</span>
      </div>
    );
  }

  let contextSnippet = "";
  if (input && error.line != null) {
    const lines = input.split("\n");
    const start = Math.max(0, error.line - 3);
    const end = Math.min(lines.length, error.line + 2);
    contextSnippet = lines
      .slice(start, end)
      .map((l, i) => {
        const lineNum = start + i + 1;
        const marker = lineNum === error.line ? "→ " : "  ";
        return `${marker}${lineNum}: ${l}`;
      })
      .join("\n");
  }

  return (
    <div className="error-panel">
      <p className="error-panel__heading">
        {error.line != null
          ? `Line ${error.line}${error.column != null ? `, col ${error.column}` : ""}`
          : "Parse error"}
      </p>
      <p className="error-panel__message">{error.message}</p>
      {error.suggestion && (
        <p className="error-panel__suggestion">
          <span className="error-panel__suggestion-label">Did you mean?</span>{" "}
          {error.suggestion}
        </p>
      )}
      {contextSnippet && (
        <pre className="error-panel__snippet">{contextSnippet}</pre>
      )}
    </div>
  );
}

function RepairPanel({
  repairResult,
  onAcceptRepair,
}: {
  repairResult: RepairResult | null | undefined;
  onAcceptRepair?: (text: string) => void;
}) {
  if (!repairResult) {
    return (
      <div className="error-panel error-panel--none">
        <span>Click Repair when JSON is invalid to auto-fix common issues</span>
      </div>
    );
  }

  if (!repairResult.ok) {
    return (
      <div className="repair-panel">
        <p className="repair-panel__heading repair-panel__heading--fail">
          Could not auto-repair
        </p>
        <p className="repair-panel__message">{repairResult.message}</p>
        <ul className="repair-panel__hints">
          <li>Check for unclosed strings or brackets</li>
          <li>Remove custom extensions (e.g. functions, dates)</li>
          <li>Paste into a linter for more detail</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="repair-panel repair-panel--success">
      <div className="repair-panel__header">
        <p className="repair-panel__heading">Repaired preview</p>
        {onAcceptRepair && (
          <button
            className="repair-panel__accept-btn"
            onClick={() => onAcceptRepair(repairResult.result)}
          >
            Accept repair
          </button>
        )}
      </div>
      <ul className="repair-panel__fixes">
        {repairResult.fixes.map((fix, i) => (
          <li key={i} className="repair-panel__fix-item">
            ✓ {fix}
          </li>
        ))}
      </ul>
      <div className="repair-panel__preview">
        <CodeEditor value={repairResult.result} readOnly />
      </div>
    </div>
  );
}

export function RightPane({
  output,
  activeTab,
  onTabChange,
  error,
  input,
  repairResult,
  onAcceptRepair,
  partialJson,
  isPartialTree,
}: RightPaneProps) {
  const [activeTreePath, setActiveTreePath] = useState("$");
  const [wrapCode, setWrapCode] = useState(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (e.key === "ArrowLeft" && currentIndex > 0) {
      e.preventDefault();
      onTabChange(TABS[currentIndex - 1].id);
    } else if (e.key === "ArrowRight" && currentIndex < TABS.length - 1) {
      e.preventDefault();
      onTabChange(TABS[currentIndex + 1].id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onTabChange(TABS[0].id);
    } else if (e.key === "End") {
      e.preventDefault();
      onTabChange(TABS[TABS.length - 1].id);
    }
  };

  return (
    <div className="right-pane">
      <div className="tab-strip">
        <div className="tab-bar" role="tablist" onKeyDown={onKeyDown}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              className={`tab-btn${tab.id === "error" && error ? " tab-btn--error" : ""}${activeTab === tab.id ? " active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.id === "tree" && isPartialTree && (
                <span className="tab-btn__badge" aria-label="partial tree">
                  ⚠
                </span>
              )}
            </button>
          ))}
        </div>

        <select
          className="tab-select"
          aria-label="Select output view"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value as TabId)}
        >
          {TABS.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>

        <div className="tab-strip__context">
          {activeTab === "tree" && (
            <button
              className="tab-strip__ctrl-btn"
              onClick={() =>
                navigator.clipboard.writeText(activeTreePath).catch(() => {})
              }
              title="Copy the currently hovered JSONPath"
            >
              Copy path
            </button>
          )}
          {activeTab === "code" && (
            <button
              className={`tab-strip__ctrl-btn${wrapCode ? " active" : ""}`}
              aria-pressed={wrapCode}
              onClick={() => setWrapCode((w) => !w)}
              title="Toggle line wrap"
            >
              Wrap
            </button>
          )}
        </div>
      </div>

      <div className="tab-content">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            style={{ height: "100%" }}
          >
            {tab.id === "tree" ? (
              <TreeView
                json={isPartialTree && partialJson ? partialJson : output}
                isPartial={isPartialTree}
                onActivePathChange={setActiveTreePath}
              />
            ) : tab.id === "code" ? (
              <CodeEditor
                value={output}
                readOnly
                placeholder="Output appears here…"
                wrap={wrapCode}
              />
            ) : tab.id === "error" ? (
              <ErrorPanel error={error} input={input} />
            ) : tab.id === "repair" ? (
              <RepairPanel
                repairResult={repairResult}
                onAcceptRepair={onAcceptRepair}
              />
            ) : tab.id === "table" ? (
              <TableView json={output} />
            ) : (
              <Placeholder label={tab.label} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
