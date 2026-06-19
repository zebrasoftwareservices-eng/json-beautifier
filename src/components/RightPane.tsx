import { CodeEditor } from "./CodeEditor";

export type TabId = "tree" | "code" | "table" | "diff" | "schema";

const TABS: { id: TabId; label: string }[] = [
  { id: "tree", label: "Tree" },
  { id: "code", label: "Code" },
  { id: "table", label: "Table" },
  { id: "diff", label: "Diff" },
  { id: "schema", label: "Schema" },
];

interface RightPaneProps {
  output: string;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="tab-placeholder">
      <span>{label} view — coming soon</span>
    </div>
  );
}

export function RightPane({ output, activeTab, onTabChange }: RightPaneProps) {
  return (
    <div className="right-pane">
      <div className="tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "tree" && <Placeholder label="Tree" />}
        {activeTab === "code" && (
          <CodeEditor
            value={output}
            readOnly
            placeholder="Output appears here…"
          />
        )}
        {activeTab === "table" && <Placeholder label="Table" />}
        {activeTab === "diff" && <Placeholder label="Diff" />}
        {activeTab === "schema" && <Placeholder label="Schema" />}
      </div>
    </div>
  );
}
