const SAMPLE_JSON = JSON.stringify(
  {
    name: "Alice",
    age: 30,
    address: { city: "San Francisco", zip: "94107" },
    tags: ["json", "beautifier"],
  },
  null,
  2,
);

interface ActionBarProps {
  indent: number;
  onIndentChange: (n: number) => void;
  onFormat: () => void;
  onMinify: () => void;
  onClear: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSample: () => void;
  processing: boolean;
  copyLabel?: string;
  autoFormat?: boolean;
  onAutoFormatChange?: (v: boolean) => void;
}

export function ActionBar({
  indent,
  onIndentChange,
  onFormat,
  onMinify,
  onClear,
  onCopy,
  onPaste,
  onSample,
  processing,
  copyLabel = "Copy",
  autoFormat = true,
  onAutoFormatChange,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-group">
        <button
          onClick={onPaste}
          disabled={processing}
          title="Paste from clipboard"
        >
          Paste
        </button>
        <button
          className="secondary"
          disabled
          title="Upload file — coming soon"
        >
          Upload
        </button>
        <button
          className="secondary"
          disabled
          title="Load from URL — coming soon"
        >
          Load URL
        </button>
        <button className="secondary" onClick={onSample} disabled={processing}>
          Sample
        </button>
      </div>

      <div className="action-group">
        <label className="indent-label">
          Indent
          <select
            value={indent}
            onChange={(e) => onIndentChange(Number(e.target.value))}
            disabled={processing}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
        <button
          onClick={onFormat}
          disabled={processing}
          className="primary-btn"
        >
          {processing ? "Working…" : "Format"}
        </button>
        <button onClick={onMinify} disabled={processing}>
          Minify
        </button>
        <label className="auto-format-label" title="Auto-format on paste">
          <input
            type="checkbox"
            checked={autoFormat}
            onChange={(e) => onAutoFormatChange?.(e.target.checked)}
            disabled={processing}
          />
          Auto
        </label>
        <button className="secondary" disabled title="Validate — coming soon">
          Validate
        </button>
        <button className="secondary" disabled title="Repair — coming soon">
          Repair
        </button>
      </div>

      <div className="action-group">
        <button onClick={onCopy} disabled={processing}>
          {copyLabel}
        </button>
        <button className="secondary" disabled title="Download — coming soon">
          Download
        </button>
        <button className="secondary" disabled title="Share — coming soon">
          Share
        </button>
        <button className="secondary" onClick={onClear} disabled={processing}>
          Clear
        </button>
      </div>
    </div>
  );
}

export { SAMPLE_JSON };
