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
}

export function AppShell({
  identityBar,
  toolbar,
  left,
  right,
  statusBar,
  modals,
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
      <div className="app-shell__content">
        <SplitPane
          left={left}
          right={right}
          storageKey="brace-split-ratio"
          defaultPct={44}
        />
      </div>
      <div className="app-shell__status-bar">{statusBar}</div>
      {modals}
    </div>
  );
}
