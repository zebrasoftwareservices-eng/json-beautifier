import { IconJson } from "@tabler/icons-react";
import "./EditorEmptyState.css";

interface EditorEmptyStateProps {
  onPaste: () => void;
  onSample: () => void;
  onLoadUrl: () => void;
  onUpload: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

export function EditorEmptyState({
  onPaste,
  onSample,
  onLoadUrl,
  onUpload,
}: EditorEmptyStateProps) {
  return (
    <div
      className="editor-empty-state"
      role="group"
      aria-label="Empty editor quick actions"
    >
      <div className="editor-empty-state__grid" aria-hidden="true" />
      <div className="editor-empty-state__card">
        <div className="editor-empty-state__icon" aria-hidden="true">
          <IconJson size={32} />
        </div>
        <p className="editor-empty-state__heading">Nothing to format yet</p>
        <p className="editor-empty-state__hint">
          Paste JSON, drop a file, or load from URL
        </p>
        <div className="editor-empty-state__actions">
          <button
            type="button"
            className="editor-empty-state__btn"
            onClick={onPaste}
            aria-label="Paste from clipboard"
          >
            Paste
            <kbd className="editor-empty-state__kbd">
              {isMac ? "⌘V" : "Ctrl+V"}
            </kbd>
          </button>
          <button
            type="button"
            className="editor-empty-state__btn secondary"
            onClick={onSample}
            aria-label="Try sample JSON"
          >
            Try sample JSON
          </button>
          <button
            type="button"
            className="editor-empty-state__btn secondary"
            onClick={onLoadUrl}
            aria-label="Load from URL"
          >
            Load URL
          </button>
          <button
            type="button"
            className="editor-empty-state__btn secondary"
            onClick={onUpload}
            aria-label="Upload file"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
