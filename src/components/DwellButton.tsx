import { useRef, useState, useCallback } from "react";

interface DwellButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  shortcut?: string;
}

const DWELL_DELAY_MS = 1500;

export function DwellButton({
  tooltip,
  shortcut,
  children,
  ...rest
}: DwellButtonProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), DWELL_DELAY_MS);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <div
      className="dwell-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button {...rest}>{children}</button>
      {visible && (
        <div className="dwell-tooltip" role="tooltip">
          <span className="dwell-tooltip__label">{tooltip}</span>
          {shortcut && <kbd className="dwell-tooltip__kbd">{shortcut}</kbd>}
        </div>
      )}
    </div>
  );
}
