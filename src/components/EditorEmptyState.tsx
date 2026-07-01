import "./EditorEmptyState.css";

interface EditorEmptyStateProps {
  onPaste: () => void;
  onSample: () => void;
  onLoadUrl: () => void;
  onUpload: () => void;
}

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
      <p className="editor-empty-state__hint">
        Paste JSON, drop a file, or load from URL
      </p>
      <div className="editor-empty-state__actions">
        <button
          type="button"
          className="secondary"
          onClick={onPaste}
          aria-label="Paste from clipboard"
        >
          Paste
        </button>
        <button type="button" onClick={onSample} aria-label="Try sample JSON">
          Try sample JSON
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onLoadUrl}
          aria-label="Load from URL"
        >
          Load URL
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onUpload}
          aria-label="Upload file"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
