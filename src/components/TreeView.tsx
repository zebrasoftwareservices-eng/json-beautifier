import { useState, useRef, useCallback, useMemo, useEffect, memo } from "react";
import {
  type FlatRow,
  TREE_BIGINT_SENTINEL as BIGINT_SENTINEL,
  parseForTree,
  flatten,
  collectAllPaths,
  formatTreeValue as formatValue,
} from "../lib/json/tree";

// ── Virtual list constants ────────────────────────────────────────────────────

const ROW_HEIGHT = 28;
const OVERSCAN = 8;

// ── TreeRow ───────────────────────────────────────────────────────────────────

interface TreeRowProps {
  row: FlatRow;
  onToggle: (path: string) => void;
  onHover: (path: string) => void;
  searchTerm: string;
}

const TreeRow = memo(function TreeRow({
  row,
  onToggle,
  onHover,
  searchTerm,
}: TreeRowProps) {
  const [hovered, setHovered] = useState(false);

  const handleCopyValue = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      let text: string;
      if (row.type === "string") {
        text = String(row.value);
      } else if (row.type === "bigint") {
        text = String(row.value).slice(BIGINT_SENTINEL.length);
      } else {
        text = JSON.stringify(row.value, null, 2);
      }
      await navigator.clipboard.writeText(text).catch(() => {});
    },
    [row.value, row.type],
  );

  const handleCopyPath = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(row.path).catch(() => {});
    },
    [row.path],
  );

  const keyLabel =
    row.displayKey ??
    String(
      // for array items, extract index from path
      row.path.match(/\[(\d+)\]$/)?.[1] ?? "",
    );

  const valueStr = formatValue(row);
  const isPrimitive = row.type !== "object" && row.type !== "array";

  function highlight(text: string): React.ReactNode {
    if (!searchTerm) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="tree-match">
          {text.slice(idx, idx + searchTerm.length)}
        </mark>
        {text.slice(idx + searchTerm.length)}
      </>
    );
  }

  return (
    <div
      className={`tree-row${hovered ? " tree-row--hovered" : ""}`}
      style={{
        height: ROW_HEIGHT,
        paddingLeft: row.depth * 16 + 4,
      }}
      onMouseEnter={() => {
        setHovered(true);
        onHover(row.path);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Toggle button */}
      <span
        className={`tree-toggle${row.hasChildren ? "" : " tree-toggle--leaf"}`}
        onClick={() => row.hasChildren && onToggle(row.path)}
        aria-label={row.isExpanded ? "Collapse" : "Expand"}
      >
        {row.hasChildren ? (row.isExpanded ? "▾" : "▸") : ""}
      </span>

      {/* Key */}
      {keyLabel !== "" && (
        <span className={`tree-key tree-key--${row.type}`}>
          {highlight(keyLabel)}
          <span className="tree-colon">: </span>
        </span>
      )}

      {/* Value */}
      <span className={`tree-value tree-value--${row.type}`}>
        {row.type === "bigint" ? (
          <>
            {highlight(valueStr)}
            <span className="tree-bigint-badge">int64</span>
          </>
        ) : isPrimitive ? (
          highlight(valueStr)
        ) : (
          <span className="tree-summary">{valueStr}</span>
        )}
      </span>

      {/* Hover actions */}
      {hovered && (
        <span className="tree-actions">
          <button
            className="tree-action-btn"
            onClick={handleCopyValue}
            title="Copy value"
          >
            Copy value
          </button>
          <button
            className="tree-action-btn"
            onClick={handleCopyPath}
            title="Copy JSONPath"
          >
            Copy path
          </button>
        </span>
      )}
    </div>
  );
});

// ── TreeView ──────────────────────────────────────────────────────────────────

interface TreeViewProps {
  json: string;
  isPartial?: boolean;
}

export function TreeView({ json, isPartial }: TreeViewProps) {
  const { parsed, parseError } = useMemo(() => {
    if (!json.trim()) return { parsed: null, parseError: false };
    try {
      return {
        parsed: parseForTree(json),
        parseError: false,
      };
    } catch {
      return { parsed: null, parseError: true };
    }
  }, [json]);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["$"]));
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(400);
  const [breadcrumb, setBreadcrumb] = useState("$");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for keyboard shortcut events dispatched from App
  useEffect(() => {
    function onCollapseAll() {
      setExpanded(new Set(["$"]));
    }
    function onFocusSearch() {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
    window.addEventListener("tree:collapse-all", onCollapseAll);
    window.addEventListener("tree:focus-search", onFocusSearch);
    return () => {
      window.removeEventListener("tree:collapse-all", onCollapseAll);
      window.removeEventListener("tree:focus-search", onFocusSearch);
    };
  }, []);

  // Reset expanded state when JSON changes to a different document
  const prevJsonRef = useRef(json);
  useEffect(() => {
    if (prevJsonRef.current !== json) {
      prevJsonRef.current = json;
      setExpanded(new Set(["$"]));
    }
  }, [json]);

  // Track container height for virtualization
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Flatten visible tree
  const flatRows = useMemo(() => {
    if (parsed === null) return [];
    const rows: FlatRow[] = [];
    flatten(parsed, "$", null, 0, expanded, rows);
    return rows;
  }, [parsed, expanded]);

  // Apply search filter
  const displayRows = useMemo(() => {
    if (!search) return flatRows;
    const term = search.toLowerCase();
    return flatRows.filter((row) => {
      const keyMatch = row.displayKey?.toLowerCase().includes(term) ?? false;
      const valMatch =
        row.type !== "object" &&
        row.type !== "array" &&
        String(row.value).toLowerCase().includes(term);
      return keyMatch || valMatch;
    });
  }, [flatRows, search]);

  // Virtualised window
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    displayRows.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
  );
  const windowedRows = displayRows.slice(startIndex, endIndex);
  const totalHeight = displayRows.length * ROW_HEIGHT;

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    if (!parsed) return;
    const paths = new Set<string>();
    collectAllPaths(parsed, "$", paths);
    setExpanded(paths);
  }, [parsed]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set(["$"]));
  }, []);

  const onHover = useCallback((path: string) => {
    setBreadcrumb(path);
  }, []);

  if (!json.trim()) {
    return (
      <div className="tree-empty-state">
        <div className="tree-ghost" aria-hidden="true">
          <div className="tree-ghost__row tree-ghost__row--1" />
          <div className="tree-ghost__row tree-ghost__row--2" />
          <div className="tree-ghost__row tree-ghost__row--3" />
          <div className="tree-ghost__row tree-ghost__row--4" />
          <div className="tree-ghost__row tree-ghost__row--5" />
        </div>
        <p className="tree-empty-state__cta">
          Paste JSON on the left to explore it here
        </p>
      </div>
    );
  }

  if (parseError) {
    return (
      <div className="tree-empty">
        <span>Fix JSON errors to view tree</span>
      </div>
    );
  }

  return (
    <div className="tree-view">
      {isPartial && (
        <div className="tree-partial-banner" role="status">
          ⚠ Showing partial tree — JSON has errors
        </div>
      )}
      {/* Toolbar */}
      <div className="tree-toolbar">
        <input
          ref={searchInputRef}
          className="tree-search"
          type="search"
          placeholder="Search keys and values…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search tree"
        />
        <button
          className="tree-ctrl-btn"
          onClick={expandAll}
          title="Expand all"
        >
          ⊞ All
        </button>
        <button
          className="tree-ctrl-btn"
          onClick={collapseAll}
          title="Collapse all"
        >
          ⊟ All
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="tree-breadcrumb" title={breadcrumb}>
        {breadcrumb}
      </div>

      {/* Search result count */}
      {search && (
        <div className="tree-count">
          {displayRows.length} match{displayRows.length !== 1 ? "es" : ""}
        </div>
      )}

      {/* Virtual list */}
      <div
        ref={containerRef}
        className="tree-list"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: startIndex * ROW_HEIGHT,
              left: 0,
              right: 0,
            }}
          >
            {windowedRows.map((row) => (
              <TreeRow
                key={row.path}
                row={row}
                onToggle={toggle}
                onHover={onHover}
                searchTerm={search}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
