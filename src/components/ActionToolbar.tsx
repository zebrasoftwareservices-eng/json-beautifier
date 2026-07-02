import { useState } from "react";
import {
  IconBolt,
  IconCheck,
  IconCopy,
  IconDownload,
  IconMinimize,
  IconWand,
  IconX,
} from "@tabler/icons-react";
import { DwellButton } from "./DwellButton";
import "./ActionToolbar.css";

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
const m = isMac ? "⌘" : "Ctrl+";
const s = isMac ? "⇧" : "Shift+";

const SC = {
  format: `${m}⏎`,
  minify: `${m}${s}M`,
  repair: `${m}${s}R`,
};

const INDENT_OPTIONS: { label: string; value: number | "\t" }[] = [
  { label: "2", value: 2 },
  { label: "4", value: 4 },
  { label: "Tab", value: "\t" },
];

type PrimaryAction = "format" | "minify" | "validate" | "repair";

interface ActionToolbarProps {
  indent: number | "\t";
  onIndentChange: (n: number | "\t") => void;
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onRepair: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onClear: () => void;
  processing: boolean;
  hasInput: boolean;
  copyLabel?: string;
  autoFormat: boolean;
  onAutoFormatChange: (v: boolean) => void;
  /** Number of fixable errors. Repair segment enabled when > 0. */
  repairErrorCount?: number;
}

export function ActionToolbar({
  indent,
  onIndentChange,
  onFormat,
  onMinify,
  onValidate,
  onRepair,
  onCopy,
  onDownload,
  onClear,
  processing,
  hasInput,
  copyLabel = "Copy",
  autoFormat,
  onAutoFormatChange,
  repairErrorCount = 0,
}: ActionToolbarProps) {
  const [lastAction, setLastAction] = useState<PrimaryAction | null>(null);
  const repairEnabled = repairErrorCount > 0;

  function run(action: PrimaryAction, handler: () => void) {
    setLastAction(action);
    handler();
  }

  return (
    <div className="action-toolbar" role="toolbar" aria-label="Editor toolbar">
      {/* Primary SegmentedControl */}
      <div className="segmented segmented--actions">
        <DwellButton
          tooltip="Format JSON"
          shortcut={SC.format}
          disabled={processing || !hasInput}
          className={`segmented__item${lastAction === "format" ? " segmented__item--active" : ""}`}
          onClick={() => run("format", onFormat)}
        >
          <IconBolt size={14} aria-hidden />
          Format
        </DwellButton>
        <DwellButton
          tooltip="Minify JSON"
          shortcut={SC.minify}
          disabled={processing}
          className={`segmented__item${lastAction === "minify" ? " segmented__item--active" : ""}`}
          onClick={() => run("minify", onMinify)}
        >
          <IconMinimize size={14} aria-hidden />
          Minify
        </DwellButton>
        <DwellButton
          tooltip="Validate JSON"
          disabled={processing}
          className={`segmented__item${lastAction === "validate" ? " segmented__item--active" : ""}`}
          onClick={() => run("validate", onValidate)}
        >
          <IconCheck size={14} aria-hidden />
          Validate
        </DwellButton>
        <DwellButton
          tooltip={
            repairEnabled
              ? "Auto-repair JSON issues"
              : "Repair — available when JSON is invalid"
          }
          shortcut={repairEnabled ? SC.repair : undefined}
          disabled={processing || !repairEnabled}
          className={`segmented__item${lastAction === "repair" ? " segmented__item--active" : ""}${
            repairEnabled && lastAction !== "repair"
              ? " segmented__item--suggested"
              : ""
          }`}
          onClick={() => run("repair", onRepair)}
        >
          <IconWand size={14} aria-hidden />
          Repair
        </DwellButton>
      </div>

      {/* Row break at tablet: forces indent/auto-format/utility onto row 2 */}
      <span className="action-toolbar__row-break" aria-hidden />

      {/* Indent SegmentedControl */}
      <div
        className="segmented segmented--indent"
        role="radiogroup"
        aria-label="Indent size"
      >
        {INDENT_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={indent === opt.value}
            disabled={processing}
            className={`segmented__item segmented__item--indent${
              indent === opt.value ? " segmented__item--active-indent" : ""
            }`}
            onClick={() => onIndentChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Auto-format switch */}
      <label className="auto-format">
        <span
          className={`auto-format__track${autoFormat ? " auto-format__track--on" : ""}`}
          role="switch"
          aria-checked={autoFormat}
          aria-label="Auto-format"
          tabIndex={processing ? -1 : 0}
          onClick={() => !processing && onAutoFormatChange(!autoFormat)}
          onKeyDown={(e) => {
            if (!processing && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onAutoFormatChange(!autoFormat);
            }
          }}
        >
          <span className="auto-format__thumb" />
        </span>
        Auto-format
      </label>

      <div className="action-toolbar__spacer" aria-hidden />

      {/* Right-aligned utility buttons */}
      <div className="action-toolbar__utility">
        <button
          type="button"
          className="ghost-btn"
          disabled={processing || !hasInput}
          onClick={onCopy}
        >
          <IconCopy size={14} aria-hidden />
          {copyLabel}
        </button>
        <button
          type="button"
          className="ghost-btn"
          disabled={processing || !hasInput}
          onClick={onDownload}
        >
          <IconDownload size={14} aria-hidden />
          Download
        </button>
        <button
          type="button"
          className="ghost-btn ghost-btn--icon"
          disabled={processing}
          onClick={onClear}
          aria-label="Clear editor"
          title="Clear editor"
        >
          <IconX size={15} aria-hidden />
        </button>
      </div>
    </div>
  );
}
