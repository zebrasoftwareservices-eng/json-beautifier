import { useState, useRef, useCallback } from "react";
import {
  IconBolt,
  IconCheck,
  IconClipboard,
  IconCopy,
  IconDownload,
  IconFileText,
  IconLink,
  IconMinimize,
  IconTerminal2,
  IconTrash,
  IconUpload,
  IconWand,
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

/** Vertical divider between toolbar zones */
function ZoneDivider() {
  return <div className="toolbar-divider" aria-hidden />;
}

/** Toggle switch for Auto-format */
function AutoToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`auto-toggle${disabled ? " auto-toggle--disabled" : ""}`}>
      <span
        className={`auto-toggle__track${checked ? " auto-toggle__track--on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label="Auto-format"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span className="auto-toggle__thumb" />
      </span>
      Auto-format
    </label>
  );
}

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
  /** Number of fixable errors. Badge shown when > 0; Repair button enabled. */
  repairErrorCount?: number;
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
  repairErrorCount = 0,
}: ActionBarProps) {
  const repairEnabled = repairErrorCount > 0;

  // Clear confirmation: first click arms, second click (within 2s) executes.
  const [clearArmed, setClearArmed] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClearClick = useCallback(() => {
    if (clearArmed) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
      setClearArmed(false);
      onClear();
    } else {
      setClearArmed(true);
      clearTimerRef.current = setTimeout(() => {
        setClearArmed(false);
        clearTimerRef.current = null;
      }, 2000);
    }
  }, [clearArmed, onClear]);

  return (
    <div className="action-bar" role="toolbar" aria-label="Editor toolbar">
      {/* ── Zone 1: In ── */}
      <div className="toolbar-zone">
        <DwellButton
          tooltip="Paste from clipboard"
          disabled={processing}
          onClick={onPaste}
          className="toolbar-btn toolbar-btn--in"
        >
          <IconClipboard size={15} className="toolbar-btn__icon" aria-hidden />
          Paste
        </DwellButton>
        <DwellButton
          tooltip="Upload JSON file"
          disabled={processing}
          onClick={onUpload}
          className="toolbar-btn toolbar-btn--in"
        >
          <IconUpload size={15} className="toolbar-btn__icon" aria-hidden />
          Upload
        </DwellButton>
        <DwellButton
          tooltip="Load JSON from URL"
          shortcut={SC.loadUrl}
          disabled={processing}
          onClick={onLoadUrl}
          className="toolbar-btn toolbar-btn--in"
        >
          <IconLink size={15} className="toolbar-btn__icon" aria-hidden />
          Load URL
        </DwellButton>
        <DwellButton
          tooltip="Load sample JSON"
          disabled={processing}
          onClick={onSample}
          className="toolbar-btn toolbar-btn--neutral"
        >
          <IconFileText size={15} className="toolbar-btn__icon" aria-hidden />
          Sample
        </DwellButton>
      </div>

      <ZoneDivider />

      {/* ── Zone 2: Transform ── */}
      <div className="toolbar-zone">
        <DwellButton
          tooltip="Format JSON"
          shortcut={SC.format}
          disabled={processing}
          className="toolbar-btn toolbar-btn--primary"
          onClick={onFormat}
        >
          <IconBolt size={15} className="toolbar-btn__icon" aria-hidden />
          {processing ? "Working…" : "Format"}
        </DwellButton>
        <DwellButton
          tooltip="Minify JSON"
          shortcut={SC.minify}
          disabled={processing}
          className="toolbar-btn toolbar-btn--minify"
          onClick={onMinify}
        >
          <IconMinimize size={15} className="toolbar-btn__icon" aria-hidden />
          Minify
        </DwellButton>
        <DwellButton
          tooltip="Validate JSON"
          shortcut={SC.validate}
          disabled={processing}
          className="toolbar-btn toolbar-btn--validate"
          onClick={onValidate}
        >
          <IconCheck size={15} className="toolbar-btn__icon" aria-hidden />
          Validate
        </DwellButton>
        <div className="toolbar-repair-wrapper">
          <DwellButton
            tooltip={
              repairEnabled
                ? "Auto-repair JSON issues"
                : "Repair — available when JSON is invalid"
            }
            shortcut={repairEnabled ? SC.repair : undefined}
            disabled={processing || !repairEnabled}
            className="toolbar-btn toolbar-btn--repair"
            onClick={onRepair}
          >
            <IconWand size={15} className="toolbar-btn__icon" aria-hidden />
            Repair
          </DwellButton>
          {repairErrorCount > 0 && (
            <span
              className="toolbar-repair-badge"
              aria-label={`${repairErrorCount} fixable error`}
            >
              {repairErrorCount}
            </span>
          )}
        </div>
      </div>

      <ZoneDivider />

      {/* ── Zone 3: Settings ── */}
      <div className="toolbar-zone">
        <label className="indent-label">
          Indent
          <select
            value={indent}
            onChange={(e) => onIndentChange(Number(e.target.value))}
            disabled={processing}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>Tab</option>
          </select>
        </label>
        <AutoToggle
          checked={autoFormat}
          onChange={(v) => onAutoFormatChange?.(v)}
          disabled={processing}
        />
      </div>

      <ZoneDivider />

      {/* ── Zone 4: Out ── */}
      <div className="toolbar-zone">
        <DwellButton
          tooltip="Copy output"
          shortcut={SC.copy}
          disabled={processing}
          className="toolbar-btn toolbar-btn--copy"
          onClick={onCopy}
        >
          <IconCopy size={15} className="toolbar-btn__icon" aria-hidden />
          {copyLabel}
        </DwellButton>
        <DwellButton
          tooltip="Download JSON"
          shortcut={SC.download}
          disabled={processing}
          className="toolbar-btn toolbar-btn--export"
          onClick={onDownload}
        >
          <IconDownload size={15} className="toolbar-btn__icon" aria-hidden />
          Download
        </DwellButton>
      </div>

      {/* ── Spacer ── */}
      <div className="toolbar-spacer" aria-hidden />

      {/* ── Utility ── */}
      <div className="toolbar-zone">
        <DwellButton
          tooltip="Command palette"
          shortcut={SC.palette}
          className="toolbar-btn toolbar-btn--icon-only"
          onClick={onOpenPalette}
          aria-label="Command palette"
        >
          <IconTerminal2 size={15} aria-hidden />
        </DwellButton>
        <DwellButton
          tooltip={clearArmed ? "Click again to confirm clear" : "Clear editor"}
          shortcut={SC.clear}
          disabled={processing}
          className={`toolbar-btn toolbar-btn--icon-only toolbar-btn--clear${clearArmed ? " toolbar-btn--clear-armed" : ""}`}
          onClick={handleClearClick}
          aria-label={clearArmed ? "Confirm clear editor" : "Clear editor"}
        >
          <IconTrash size={15} aria-hidden />
        </DwellButton>
      </div>
    </div>
  );
}

export { SAMPLE_JSON };
