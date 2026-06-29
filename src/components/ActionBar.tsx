import {
  IconBolt,
  IconCheck,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";
import { DwellButton } from "./DwellButton";

const SAMPLE_JSON = JSON.stringify(
  {
    user: {
      id: 42,
      name: "Alice Chen",
      email: "alice@example.com",
      verified: true,
      address: {
        street: "123 Main St",
        city: "San Francisco",
        state: "CA",
        zip: "94107",
      },
      tags: ["developer", "open-source"],
      metadata: {
        created_at: "2024-01-15T10:30:00Z",
        last_login: "2026-06-29T09:00:00Z",
        preferences: {
          theme: "dark",
          notifications: true,
          language: "en",
        },
      },
    },
  },
  null,
  2,
);

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const m = isMac ? "⌘" : "Ctrl+";
const s = isMac ? "⇧" : "Shift+";

const SC = {
  format: `${m}${s}F`,
  minify: `${m}${s}M`,
  validate: `${m}${s}V`,
  repair: `${m}${s}R`,
  copy: `${m}${s}C`,
  download: `${m}S`,
  loadUrl: `${m}${s}U`,
  clear: isMac ? `${m}${s}⌫` : `${m}${s}Del`,
  palette: `${m}K`,
};

interface ActionBarProps {
  indent: number;
  onIndentChange: (n: number) => void;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onPaste: () => void;
  onSample: () => void;
  onUpload: () => void;
  onLoadUrl: () => void;
  onRepair: () => void;
  onOpenPalette: () => void;
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
  onValidate,
  onClear,
  onCopy,
  onDownload,
  onPaste,
  onSample,
  onUpload,
  onLoadUrl,
  onRepair,
  onOpenPalette,
  processing,
  copyLabel = "Copy",
  autoFormat = true,
  onAutoFormatChange,
  repairEnabled = false,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-group">
        <DwellButton
          tooltip="Paste from clipboard"
          disabled={processing}
          onClick={onPaste}
        >
          Paste
        </DwellButton>
        <DwellButton
          tooltip="Upload file"
          className="secondary"
          disabled={processing}
          onClick={onUpload}
        >
          Upload
        </DwellButton>
        <DwellButton
          tooltip="Load from URL"
          shortcut={SC.loadUrl}
          className="secondary"
          disabled={processing}
          onClick={onLoadUrl}
        >
          Load URL
        </DwellButton>
        <DwellButton
          tooltip="Load sample JSON"
          className="secondary"
          disabled={processing}
          onClick={onSample}
        >
          Sample
        </DwellButton>
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
        <DwellButton
          tooltip="Format JSON"
          shortcut={SC.format}
          disabled={processing}
          className="toolbar-btn toolbar-btn--format"
          onClick={onFormat}
        >
          <IconBolt size={15} className="toolbar-btn__icon" aria-hidden />
          {processing ? "Working…" : "Format"}
        </DwellButton>
        <DwellButton
          tooltip="Minify JSON"
          shortcut={SC.minify}
          disabled={processing}
          onClick={onMinify}
        >
          Minify
        </DwellButton>
        <label className="auto-format-label" title="Auto-format on paste">
          <input
            type="checkbox"
            checked={autoFormat}
            onChange={(e) => onAutoFormatChange?.(e.target.checked)}
            disabled={processing}
          />
          Auto
        </label>
        <DwellButton
          tooltip="Validate JSON"
          shortcut={SC.validate}
          className="toolbar-btn toolbar-btn--validate"
          disabled={processing}
          onClick={onValidate}
        >
          <IconCheck size={15} className="toolbar-btn__icon" aria-hidden />
          Validate
        </DwellButton>
        <DwellButton
          tooltip={
            repairEnabled
              ? "Auto-repair JSON issues"
              : "Repair — available when JSON is invalid"
          }
          shortcut={repairEnabled ? SC.repair : undefined}
          className="secondary"
          disabled={processing || !repairEnabled}
          onClick={onRepair}
        >
          Repair
        </DwellButton>
      </div>

      <div className="action-group">
        <DwellButton
          tooltip="Copy output"
          shortcut={SC.copy}
          disabled={processing}
          onClick={onCopy}
        >
          {copyLabel}
        </DwellButton>
        <DwellButton
          tooltip="Download JSON"
          shortcut={SC.download}
          className="toolbar-btn toolbar-btn--export"
          disabled={processing}
          onClick={onDownload}
        >
          <IconDownload size={15} className="toolbar-btn__icon" aria-hidden />
          Download
        </DwellButton>
        <button className="secondary" disabled title="Share — coming soon">
          Share
        </button>
        <DwellButton
          tooltip="Clear editor"
          shortcut={SC.clear}
          className="toolbar-btn toolbar-btn--clear"
          disabled={processing}
          onClick={onClear}
        >
          <IconTrash size={15} className="toolbar-btn__icon" aria-hidden />
          Clear
        </DwellButton>
      </div>

      <div className="action-group">
        <DwellButton
          tooltip="Command palette"
          shortcut={SC.palette}
          className="secondary"
          onClick={onOpenPalette}
        >
          {SC.palette}
        </DwellButton>
      </div>
    </div>
  );
}

export { SAMPLE_JSON };
