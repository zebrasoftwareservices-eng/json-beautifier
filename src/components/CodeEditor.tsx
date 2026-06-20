import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
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
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  onPaste?: (value: string) => void;
  error?: CodeEditorError | null;
  readOnly?: boolean;
  placeholder?: string;
}

export function CodeEditor({
  value,
  onChange,
  onPaste,
  error,
  readOnly = false,
  placeholder,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onPasteRef = useRef(onPaste);
  const justPastedRef = useRef(false);
  useEffect(() => {
    onChangeRef.current = onChange;
    onPasteRef.current = onPaste;
  });

  // Create editor on mount
  useEffect(() => {
    if (!containerRef.current) return;

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
      oneDark,
      linter(() => []),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) {
          if (justPastedRef.current) justPastedRef.current = false;
          return;
        }
        const newValue = update.state.doc.toString();
        onChangeRef.current?.(newValue);
        if (justPastedRef.current) {
          justPastedRef.current = false;
          onPasteRef.current?.(newValue);
        }
      }),
      EditorView.domEventHandlers({
        paste() {
          justPastedRef.current = true;
        },
      }),
      EditorView.theme({
        "&": { height: "100%", fontSize: "13px" },
        ".cm-scroller": { overflow: "auto", fontFamily: "var(--mono)" },
        ".cm-content": { padding: "12px 0" },
        "&.cm-focused": { outline: "none" },
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
      view.dispatch(setDiagnostics(view.state, []));
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
    view.dispatch(setDiagnostics(view.state, diagnostics));
  }, [error]);

  return <div ref={containerRef} className="code-editor" />;
}
