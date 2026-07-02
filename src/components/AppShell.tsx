import { useEffect } from "react";
import { SplitPane } from "./SplitPane";
import "./AppShell.css";

interface AppShellProps {
  identityBar: React.ReactNode;
  toolbar: React.ReactNode;
  left: React.ReactNode;
  right: React.ReactNode;
  statusBar: React.ReactNode;
  modals?: React.ReactNode;
  mobileBar?: React.ReactNode;
  mobilePane?: "left" | "right";
  onMobilePaneChange?: (pane: "left" | "right") => void;
}

export function AppShell({
  identityBar,
  toolbar,
  left,
  right,
  statusBar,
  modals,
  mobileBar,
  mobilePane = "left",
  onMobilePaneChange,
}: AppShellProps) {
  useEffect(() => {
    document.documentElement.dataset.layout = "app";
    return () => {
      delete document.documentElement.dataset.layout;
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="app-shell__identity-bar">{identityBar}</div>
      <div className="app-shell__toolbar">{toolbar}</div>

      {/* Input / Output pane toggle — mobile only */}
      <div className="app-shell__mobile-toggle">
        <div
          className="app-shell__mobile-segmented"
          role="tablist"
          aria-label="Switch pane"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobilePane === "left"}
            className={`app-shell__mobile-tab${mobilePane === "left" ? " app-shell__mobile-tab--active" : ""}`}
            onClick={() => onMobilePaneChange?.("left")}
          >
            Input
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobilePane === "right"}
            className={`app-shell__mobile-tab${mobilePane === "right" ? " app-shell__mobile-tab--active" : ""}`}
            onClick={() => onMobilePaneChange?.("right")}
          >
            Output
          </button>
        </div>
      </div>

      <div className="app-shell__content">
        <SplitPane
          left={left}
          right={right}
          storageKey="brace-split-ratio"
          defaultPct={44}
          mobilePaneActive={mobilePane}
        />
      </div>

      {/* Sticky bottom bar — mobile only, rendered via CSS show/hide */}
      {mobileBar}

      <div className="app-shell__status-bar">{statusBar}</div>
      {modals}
    </div>
  );
}
