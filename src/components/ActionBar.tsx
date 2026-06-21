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
  onDownload: () => void;
  onPaste: () => void;
  onSample: () => void;
  onUpload: () => void;
  onLoadUrl: () => void;
  onRepair: () => void;
  processing: boolean;
  copyLabel?: string;
  autoFormat?: boolean;
  onAutoFormatChange?: (v: boolean) => void;
  repairEnabled?: boolean;
}

export function ActionBar({
  indent,
  onIndentChange,
  onFormat,
  onMinify,
  onClear,
  onCopy,
  onDownload,
  onPaste,
  onSample,
  onUpload,
  onLoadUrl,
  onRepair,
  processing,
  copyLabel = "Copy",
  autoFormat = true,
  onAutoFormatChange,
  repairEnabled = false,
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
          onClick={onUpload}
          disabled={processing}
          title="Upload .json, .txt, or .jsonl file"
        >
          Upload
        </button>
        <button
          className="secondary"
          onClick={onLoadUrl}
          disabled={processing}
          title="Load JSON from a URL"
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
        <button
          className="secondary"
          onClick={onRepair}
          disabled={processing || !repairEnabled}
          title={
            repairEnabled
              ? "Auto-repair common JSON issues"
              : "Repair — available when JSON is invalid"
          }
        >
          Repair
        </button>
      </div>

      <div className="action-group">
        <button onClick={onCopy} disabled={processing}>
          {copyLabel}
        </button>
        <button
          className="secondary"
          onClick={onDownload}
          disabled={processing}
          title="Download formatted JSON as a file"
        >
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
