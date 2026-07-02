import "./StatusBar.css";

export type JsonValidityState = "valid" | "invalid" | "idle";

interface StatusBarProps {
  state: JsonValidityState;
  errorCount: number;
  lineCount: number;
  sizeLabel: string | null;
  cursorLine: number;
  cursorColumn: number;
  indentLabel: string;
  onOpenPalette: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

const DOT_CLASS: Record<JsonValidityState, string> = {
  valid: "status-bar__dot--valid",
  invalid: "status-bar__dot--invalid",
  idle: "status-bar__dot--idle",
};

export function StatusBar({
  state,
  errorCount,
  lineCount,
  sizeLabel,
  cursorLine,
  cursorColumn,
  indentLabel,
  onOpenPalette,
}: StatusBarProps) {
  const stateLabel =
    state === "valid"
      ? "Valid JSON"
      : state === "invalid"
        ? `Invalid JSON · ${errorCount} error${errorCount === 1 ? "" : "s"}`
        : "Ready";

  const stats = sizeLabel
    ? [`${lineCount} line${lineCount === 1 ? "" : "s"}`, sizeLabel, "UTF-8"]
    : [];

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        <span
          className={`status-bar__dot ${DOT_CLASS[state]}`}
          role="status"
          aria-label={stateLabel}
        />
        <span aria-hidden="true">{stateLabel}</span>
        {stats.map((stat) => (
          <span
            key={stat}
            className="status-bar__stat status-bar__stat--optional"
          >
            <span className="status-bar__sep" aria-hidden="true">
              ·
            </span>
            {stat}
          </span>
        ))}
      </div>
      <div className="status-bar__right">
        <span className="status-bar__stat">
          Ln {cursorLine}, Col {cursorColumn}
        </span>
        <span
          className="status-bar__sep status-bar__stat--optional"
          aria-hidden="true"
        >
          ·
        </span>
        <span className="status-bar__stat status-bar__stat--optional">
          {indentLabel}
        </span>
        <span className="status-bar__sep" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          className="status-bar__commands"
          onClick={onOpenPalette}
        >
          {isMac ? "⌘K" : "Ctrl+K"} commands
        </button>
        <span className="status-bar__sep" aria-hidden="true">
          ·
        </span>
        <span className="status-bar__privacy">Processed locally</span>
      </div>
    </div>
  );
}
