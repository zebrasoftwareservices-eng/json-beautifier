import { IconBolt, IconCopy, IconSearch } from "@tabler/icons-react";
import "./MobileActionBar.css";

interface MobileActionBarProps {
  onFormat: () => void;
  onCopy: () => void;
  onOpenPalette: () => void;
  processing: boolean;
  hasInput: boolean;
  copyLabel?: string;
}

export function MobileActionBar({
  onFormat,
  onCopy,
  onOpenPalette,
  processing,
  hasInput,
  copyLabel = "Copy",
}: MobileActionBarProps) {
  return (
    <div
      className="mobile-action-bar"
      role="toolbar"
      aria-label="Quick actions"
    >
      <button
        type="button"
        className="mobile-action-bar__format"
        onClick={onFormat}
        disabled={processing || !hasInput}
      >
        <IconBolt size={16} aria-hidden />
        Format
      </button>
      <button
        type="button"
        className="mobile-action-bar__icon-btn"
        onClick={onCopy}
        disabled={processing || !hasInput}
        aria-label={copyLabel}
        title={copyLabel}
      >
        <IconCopy size={18} aria-hidden />
      </button>
      <button
        type="button"
        className="mobile-action-bar__icon-btn"
        onClick={onOpenPalette}
        aria-label="More actions"
        title="More actions (⌘K)"
      >
        <IconSearch size={18} aria-hidden />
      </button>
    </div>
  );
}
