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
      <div className="tab-bar" role="tablist" onKeyDown={onKeyDown}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
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
            {tab.id === "code" ? (
              <CodeEditor
                value={output}
                readOnly
                placeholder="Output appears here…"
              />
            ) : (
              <Placeholder label={tab.label} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
