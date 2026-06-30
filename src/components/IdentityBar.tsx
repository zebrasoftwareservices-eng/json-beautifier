import { useRef } from "react";
import { IconSearch } from "@tabler/icons-react";
import { ThemeToggle } from "./ThemeToggle";
import "./IdentityBar.css";

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

interface IdentityBarProps {
  fileName: string | null;
  onOpenPalette: () => void;
}

export function IdentityBar({ fileName, onOpenPalette }: IdentityBarProps) {
  const searchRef = useRef<HTMLButtonElement>(null);

  const displayName = fileName
    ? fileName.length > 40
      ? "…" + fileName.slice(-37)
      : fileName
    : "untitled";

  return (
    <div className="identity-bar" role="banner">
      {/* Brand mark + name */}
      <div className="identity-bar__brand">
        <span className="identity-bar__mark" aria-hidden="true">
          {"{}"}
        </span>
        <span className="identity-bar__app-name">Brace</span>
        <span className="identity-bar__sep" aria-hidden="true">
          /
        </span>
        <span className="identity-bar__filename" title={fileName ?? "untitled"}>
          {displayName}
        </span>
      </div>

      {/* Command search — pill on wide, icon on narrow */}
      <button
        ref={searchRef}
        className="identity-bar__search"
        onClick={onOpenPalette}
        aria-label="Open command palette"
        type="button"
      >
        <IconSearch size={14} aria-hidden />
        <span className="identity-bar__search-label">
          Search or run a command
        </span>
        <kbd className="identity-bar__kbd">{isMac ? "⌘K" : "Ctrl+K"}</kbd>
      </button>

      {/* Theme toggle */}
      <div className="identity-bar__actions">
        <ThemeToggle />
      </div>
    </div>
  );
}
