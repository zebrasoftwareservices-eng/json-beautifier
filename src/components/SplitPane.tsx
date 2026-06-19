import { useRef, useState, useCallback } from "react";

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const MIN_PCT = 20;
const MAX_PCT = 80;

export function SplitPane({ left, right }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftPct, setLeftPct] = useState(50);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setLeftPct((prev) => Math.max(MIN_PCT, prev - 5));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setLeftPct((prev) => Math.min(MAX_PCT, prev + 5));
    }
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startPct = leftPct;

      const onMouseMove = (ev: MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const delta = ev.clientX - startX;
        const pct = startPct + (delta / container.offsetWidth) * 100;
        setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, pct)));
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [leftPct],
  );

  return (
    <div ref={containerRef} className="split-pane">
      <div className="split-left" style={{ width: `${leftPct}%` }}>
        {left}
      </div>
      <div
        className="split-handle"
        onMouseDown={onMouseDown}
        onKeyDown={onKeyDown}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        aria-label="Resize panels"
      />
      <div className="split-right" style={{ width: `${100 - leftPct}%` }}>
        {right}
      </div>
    </div>
  );
}
