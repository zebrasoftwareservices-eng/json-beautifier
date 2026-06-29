import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./CommandPalette.css";

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut: string;
  action: () => void;
  disabled?: boolean;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}

function fuzzyMatch(label: string, query: string): boolean {
  if (!query) return true;
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

const RECENT_KEY = "jb:palette-recent";
const MAX_RECENT = 3;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveRecent(id: string) {
  const prev = loadRecent().filter((x) => x !== id);
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([id, ...prev].slice(0, MAX_RECENT)),
  );
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const recent = useMemo(() => loadRecent(), []);

  const filtered = useMemo(() => {
    const available = commands.filter((c) => !c.disabled);
    if (!query) {
      const recentCmds = recent
        .map((id) => available.find((c) => c.id === id))
        .filter(Boolean) as PaletteCommand[];
      const rest = available.filter((c) => !recent.includes(c.id));
      return [...recentCmds, ...rest];
    }
    return available.filter((c) => fuzzyMatch(c.label, query));
  }, [commands, query, recent]);

  // Focus the input on mount (palette is remounted on each open via key prop)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep active item in view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[activeIdx] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const execute = useCallback(
    (cmd: PaletteCommand) => {
      saveRecent(cmd.id);
      onClose();
      cmd.action();
    },
    [onClose],
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const cmd = filtered[activeIdx];
      if (cmd) execute(cmd);
    }
  }

  if (!open) return null;

  return (
    <div
      className="palette-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      <div
        className="palette-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          className="palette-input"
          type="text"
          placeholder="Type a command…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          aria-label="Search commands"
          aria-autocomplete="list"
          aria-controls="palette-list"
          aria-activedescendant={
            filtered[activeIdx]
              ? `palette-item-${filtered[activeIdx].id}`
              : undefined
          }
        />
        <ul
          ref={listRef}
          id="palette-list"
          className="palette-list"
          role="listbox"
          aria-label="Commands"
        >
          {filtered.length === 0 && (
            <li className="palette-empty">No commands match</li>
          )}
          {filtered.map((cmd, i) => (
            <li
              key={cmd.id}
              id={`palette-item-${cmd.id}`}
              role="option"
              aria-selected={i === activeIdx}
              className={`palette-item${i === activeIdx ? " palette-item--active" : ""}${i < recent.length && !query ? " palette-item--recent" : ""}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => execute(cmd)}
            >
              <span className="palette-item__label">{cmd.label}</span>
              <kbd className="palette-item__kbd">{cmd.shortcut}</kbd>
            </li>
          ))}
        </ul>
        {!query && recent.length > 0 && filtered.length > 0 && (
          <div className="palette-hint">
            ↑↓ navigate · Enter select · Esc close
          </div>
        )}
        {(query || recent.length === 0) && (
          <div className="palette-hint">
            ↑↓ navigate · Enter select · Esc close
          </div>
        )}
      </div>
    </div>
  );
}
