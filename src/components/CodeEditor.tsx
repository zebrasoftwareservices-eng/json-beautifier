import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  type DecorationSet,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  drawSelection,
  dropCursor,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { linter, setDiagnostics, type Diagnostic } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";

export interface CodeEditorError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

const setErrorLine = StateEffect.define<number | null>();

const errorLineDeco = Decoration.line({
  attributes: { class: "cm-error-line" },
});

const errorLineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setErrorLine)) {
        if (effect.value == null) return Decoration.none;
        const lineNum = Math.max(1, Math.min(effect.value, tr.state.doc.lines));
        const line = tr.state.doc.line(lineNum);
        return Decoration.set([errorLineDeco.range(line.from)]);
      }
    }
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface CodeEditorCursor {
  line: number;
  column: number;
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onPaste?: (value: string) => void;
  onCursorChange?: (cursor: CodeEditorCursor) => void;
  error?: CodeEditorError | null;
  readOnly?: boolean;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  onPaste,
  onCursorChange,
  error,
  readOnly = false,
  placeholder,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onPasteRef = useRef(onPaste);
  const onCursorChangeRef = useRef(onCursorChange);
  const justPastedRef = useRef(false);
  useEffect(() => {
    onChangeRef.current = onChange;
    onPasteRef.current = onPaste;
    onCursorChangeRef.current = onCursorChange;
  });

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      drawSelection(),
      dropCursor(),
      history(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      json(),
      ...(prefersDark ? [oneDark] : []),
      linter(() => []),
      errorLineField,
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          onChangeRef.current?.(newValue);
          if (justPastedRef.current) {
            justPastedRef.current = false;
            onPasteRef.current?.(newValue);
          }
        } else if (justPastedRef.current) {
          justPastedRef.current = false;
        }
        if (update.docChanged || update.selectionSet) {
          const pos = update.state.selection.main.head;
          const line = update.state.doc.lineAt(pos);
          onCursorChangeRef.current?.({
            line: line.number,
            column: pos - line.from + 1,
          });
        }
      }),
      EditorView.domEventHandlers({
        paste() {
          justPastedRef.current = true;
        },
      }),
      EditorView.theme({
        "&": {
          height: "100%",
          fontSize: "13px",
          background: "var(--surface-panel)",
        },
        ".cm-gutters": {
          background: "var(--surface-panel)",
          borderRight: "1px solid var(--border)",
        },
        ".cm-scroller": {
          overflow: "auto",
          fontFamily: "var(--mono)",
          letterSpacing: "0",
        },
        ".cm-content": { padding: "12px 0" },
        "&.cm-focused": { outline: "none" },
        ".cm-error-line": { background: "var(--danger-bg)" },
        ".cm-lintRange-error": {
          backgroundImage: "none",
          textDecoration: "wavy underline var(--danger)",
        },
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    if (placeholder) {
      extensions.push(cmPlaceholder(placeholder));
    }

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Sync external value into editor without triggering onChange
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  // Push error diagnostic into CodeMirror lint system
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    if (!error) {
      view.dispatch(setDiagnostics(view.state, []), {
        effects: setErrorLine.of(null),
      });
      return;
    }

    const doc = view.state.doc;
    let from = 0;
    if (error.line != null) {
      const lineNum = Math.max(1, Math.min(error.line, doc.lines));
      const lineObj = doc.line(lineNum);
      const col = Math.max(0, (error.column ?? 1) - 1);
      from = Math.max(lineObj.from, Math.min(lineObj.from + col, lineObj.to));
    }

    const diagnostics: Diagnostic[] = [
      {
        from,
        to: Math.min(from + 1, doc.length),
        severity: "error",
        message: error.message,
      },
    ];
    view.dispatch(setDiagnostics(view.state, diagnostics), {
      effects: setErrorLine.of(error.line ?? null),
    });
  }, [error]);

  return <div ref={containerRef} className="code-editor" />;
}
