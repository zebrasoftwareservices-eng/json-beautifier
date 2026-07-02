import {
  CodeEditor,
  type CodeEditorCursor,
  type CodeEditorError,
  type CodeEditorJumpTarget,
} from "./CodeEditor";
import "./EditorPanel.css";

interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (value: string) => void;
  onCursorChange?: (cursor: CodeEditorCursor) => void;
  error?: CodeEditorError | null;
  placeholder?: string;
  lineCount: number;
  sizeLabel: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  uploadProgress: number | null;
  emptyState?: React.ReactNode;
  jumpTarget?: CodeEditorJumpTarget | null;
}

export function EditorPanel({
  value,
  onChange,
  onPaste,
  onCursorChange,
  error,
  placeholder,
  lineCount,
  sizeLabel,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  uploadProgress,
  emptyState,
  jumpTarget,
}: EditorPanelProps) {
  const statsLabel = error
    ? "1 error"
    : sizeLabel
      ? `${lineCount} line${lineCount === 1 ? "" : "s"} · ${sizeLabel}`
      : `${lineCount} line${lineCount === 1 ? "" : "s"}`;

  return (
    <div className="editor-panel">
      <div className="editor-panel__label">
        <span>Input</span>
        <span>{statsLabel}</span>
      </div>
      <div
        className={`drop-zone${isDragging ? " drop-zone--active" : ""}`}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <CodeEditor
          value={value}
          onChange={onChange}
          onPaste={onPaste}
          onCursorChange={onCursorChange}
          error={error}
          placeholder={placeholder}
          jumpTarget={jumpTarget}
        />
        {!value && !isDragging && uploadProgress === null && emptyState}
        {isDragging && (
          <div className="drop-overlay" aria-hidden="true">
            <span>Drop JSON file to load</span>
          </div>
        )}
        {uploadProgress !== null && (
          <div
            className="upload-progress"
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="upload-progress__bar"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
