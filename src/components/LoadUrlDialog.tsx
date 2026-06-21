import { useState } from "react";

interface LoadUrlDialogProps {
  onLoad: (url: string) => void;
  onClose: () => void;
  loading: boolean;
}

export function LoadUrlDialog({
  onLoad,
  onClose,
  loading,
}: LoadUrlDialogProps) {
  const [url, setUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onLoad(trimmed);
  }

  function handleBackdropKeyDown(e: React.KeyboardEvent) {
    if (!loading && e.key === "Escape") onClose();
  }

  return (
    <div
      className="url-dialog-backdrop"
      onClick={loading ? undefined : onClose}
      onKeyDown={handleBackdropKeyDown}
      role="presentation"
    >
      <div
        className="url-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Load from URL"
      >
        <p className="url-dialog__title">Load from URL</p>
        <form onSubmit={handleSubmit} className="url-dialog__form">
          <input
            className="url-dialog__input"
            type="url"
            placeholder="https://api.example.com/data.json"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            disabled={loading}
            aria-label="URL"
          />
          <div className="url-dialog__actions">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="primary-btn"
            >
              {loading ? "Loading…" : "Load"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
