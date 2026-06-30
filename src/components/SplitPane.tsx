import { useRef, useState, useCallback } from "react";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  storageKey?: string;
  defaultPct?: number;
}

const STORAGE_KEY = "json-beautifier:panel-ratio";
const DEFAULT_PCT = 50;
/** Minimum left-pane width in pixels. */
const MIN_PX = 120;
/** Maximum left-pane width as a percentage of container. */
const MAX_PCT = 80;
/** Pixel nudge per Alt+Arrow keypress. */
const NUDGE_PX = 10;

function loadStoredRatio(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    if (v !== null) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0 && n <= MAX_PCT) return n;
    }
  } catch {
    /* ignore — private browsing or storage full */
  }
  return fallback;
}

function persist(key: string, pct: number): void {
  try {
    localStorage.setItem(key, String(pct));
  } catch {
    /* ignore */
  }
}

export function SplitPane({
  left,
  right,
  storageKey = STORAGE_KEY,
  defaultPct = DEFAULT_PCT,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [leftPct, setLeftPct] = useState<number>(() =>
    loadStoredRatio(storageKey, defaultPct),
  );
  // Tracks whether the left pane is at its minimum (collapsed) width.
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Store the ratio to restore after a double-click collapse.
  const prevRatioRef = useRef<number>(defaultPct);
  // Track value during drag for persistence on mouseup without stale closure.
  const dragPctRef = useRef<number | null>(null);

  const minPct = useCallback((): number => {
    const w = containerRef.current?.offsetWidth ?? 0;
    return w > 0 ? (MIN_PX / w) * 100 : 0;
  }, []);

  const clamp = useCallback(
    (pct: number): number => Math.min(MAX_PCT, Math.max(minPct(), pct)),
    [minPct],
  );

  // Alt+Left / Alt+Right nudge by 10 px when handle is focused.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const nudgePct = (NUDGE_PX / container.offsetWidth) * 100;
      setLeftPct((prev) => {
        const next = clamp(
          e.key === "ArrowLeft" ? prev - nudgePct : prev + nudgePct,
        );
        persist(storageKey, next);
        return next;
      });
    },
    [clamp, storageKey],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Ignore right-click.
      if (e.button !== 0) return;
      e.preventDefault();
      const startX = e.clientX;
      const startPct = leftPct;

      const onMouseMove = (ev: MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const delta = ev.clientX - startX;
        const raw = startPct + (delta / container.offsetWidth) * 100;
        const clamped = Math.min(
          MAX_PCT,
          Math.max((MIN_PX / container.offsetWidth) * 100, raw),
        );
        dragPctRef.current = clamped;
        setLeftPct(clamped);
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        if (dragPctRef.current !== null) {
          persist(storageKey, dragPctRef.current);
          dragPctRef.current = null;
        }
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [leftPct, storageKey],
  );

  // Double-click handle: collapse to minimum or restore previous ratio.
  const onDoubleClick = useCallback(() => {
    const min = minPct();
    if (isCollapsed) {
      // Restore from collapsed state.
      const restore =
        prevRatioRef.current > min + 1 ? prevRatioRef.current : defaultPct;
      setLeftPct(restore);
      setIsCollapsed(false);
      persist(storageKey, restore);
    } else {
      // Collapse left pane.
      prevRatioRef.current = leftPct;
      setLeftPct(min);
      setIsCollapsed(true);
      persist(storageKey, min);
    }
  }, [isCollapsed, leftPct, minPct, storageKey, defaultPct]);

  return (
    <div ref={containerRef} className="split-pane">
      <div className="split-left" style={{ width: `${leftPct}%` }}>
        {left}
      </div>
      <div
        className={`split-handle${isCollapsed ? " split-handle--collapsed" : ""}`}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        aria-label="Resize panels"
        aria-valuenow={Math.round(leftPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        title={
          isCollapsed
            ? "Double-click to restore panel"
            : "Drag to resize · Double-click to collapse"
        }
      >
        <span className="split-handle__dots" aria-hidden />
        {isCollapsed && (
          <span className="split-handle__restore" aria-hidden>
            ›
          </span>
        )}
      </div>
      <div className="split-right" style={{ width: `${100 - leftPct}%` }}>
        {right}
      </div>
    </div>
  );
}
