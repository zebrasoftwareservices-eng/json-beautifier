import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import { CodeEditor, type CodeEditorError } from "./CodeEditor";

// CodeEditor mounts a real CodeMirror 6 instance. jsdom + CodeMirror DOM
// measurement is brittle, so these tests focus on "mounts/updates without
// throwing" rather than asserting exact decoration DOM output.

afterEach(() => {
  cleanup();
});

describe("CodeEditor — mount and basic rendering", () => {
  it("mounts without throwing and renders a .code-editor container", () => {
    const { container } = render(<CodeEditor value='{"a":1}' />);
    expect(container.querySelector(".code-editor")).toBeInTheDocument();
  });

  it("renders the CodeMirror content reflecting the initial value", () => {
    const { container } = render(<CodeEditor value='{"a":1}' />);
    expect(container.querySelector(".cm-content")?.textContent).toContain(
      '{"a":1}',
    );
  });
});

describe("CodeEditor — error prop transitions", () => {
  it("does not throw when error goes from null -> {message, line} -> null", () => {
    const { rerender } = render(
      <CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={null} />,
    );

    const error: CodeEditorError = { message: "Unexpected token", line: 3 };
    expect(() =>
      rerender(<CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={error} />),
    ).not.toThrow();

    expect(() =>
      rerender(<CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={null} />),
    ).not.toThrow();
  });

  it("clamps an out-of-range error.line without throwing", () => {
    const { rerender } = render(
      <CodeEditor value={'{\n  "a": 1\n}'} error={null} />,
    );

    const error: CodeEditorError = { message: "Bad", line: 999 };
    expect(() =>
      rerender(<CodeEditor value={'{\n  "a": 1\n}'} error={error} />),
    ).not.toThrow();
  });

  it("does not throw when error has no line number", () => {
    const { rerender } = render(<CodeEditor value="{}" error={null} />);
    const error: CodeEditorError = { message: "Something went wrong" };
    expect(() =>
      rerender(<CodeEditor value="{}" error={error} />),
    ).not.toThrow();
  });

  it("applies the cm-error-line class to the DOM after an error with a line is set", () => {
    const { container, rerender } = render(
      <CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={null} />,
    );
    const error: CodeEditorError = { message: "Unexpected token", line: 2 };
    rerender(<CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={error} />);
    expect(container.querySelector(".cm-error-line")).toBeInTheDocument();
  });

  it("removes the cm-error-line class once error is cleared", () => {
    const { container, rerender } = render(
      <CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={null} />,
    );
    const error: CodeEditorError = { message: "Unexpected token", line: 2 };
    rerender(<CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={error} />);
    rerender(<CodeEditor value={'{\n  "a": 1,\n  "b":\n}'} error={null} />);
    expect(container.querySelector(".cm-error-line")).not.toBeInTheDocument();
  });
});

describe("CodeEditor — wrap prop", () => {
  it("mounts without throwing when wrap is true and still renders the value", () => {
    const { container } = render(<CodeEditor value='{"a":1}' wrap />);
    expect(container.querySelector(".code-editor")).toBeInTheDocument();
    expect(container.querySelector(".cm-content")?.textContent).toContain(
      '{"a":1}',
    );
  });

  it("mounts without throwing when wrap is false and still renders the value", () => {
    const { container } = render(<CodeEditor value='{"a":1}' wrap={false} />);
    expect(container.querySelector(".code-editor")).toBeInTheDocument();
    expect(container.querySelector(".cm-content")?.textContent).toContain(
      '{"a":1}',
    );
  });

  it("does not throw when wrap toggles from false to true after mount", () => {
    const { rerender, container } = render(
      <CodeEditor value='{"a":1}' wrap={false} />,
    );
    expect(() =>
      rerender(<CodeEditor value='{"a":1}' wrap={true} />),
    ).not.toThrow();
    expect(container.querySelector(".cm-content")?.textContent).toContain(
      '{"a":1}',
    );
  });
});

describe("CodeEditor — value sync and unmount", () => {
  it("does not throw when value updates externally", () => {
    const { rerender } = render(<CodeEditor value="{}" />);
    expect(() => rerender(<CodeEditor value='{"a":1}' />)).not.toThrow();
  });

  it("unmounts cleanly without throwing", () => {
    const { unmount } = render(<CodeEditor value="{}" />);
    expect(() => unmount()).not.toThrow();
  });
});

describe("CodeEditor — onCursorChange", () => {
  // These tests drive the real CodeMirror instance through its own view API
  // (EditorView.findFromDOM + state.replaceSelection) rather than simulating
  // raw DOM typing, since jsdom cannot reproduce CodeMirror's native
  // beforeinput/composition handling. This exercises the same
  // EditorView.updateListener code path that real keystrokes go through.

  function getView(container: HTMLElement): EditorView {
    const dom = container.querySelector(".code-editor") as HTMLElement;
    const view = EditorView.findFromDOM(dom);
    if (!view) throw new Error("Could not find CodeMirror view in DOM");
    return view;
  }

  it("fires with a sane { line: 1, column: 1 } shape when typing at the start of an empty document", () => {
    const onCursorChange = vi.fn();
    const { container } = render(
      <CodeEditor value="" onCursorChange={onCursorChange} />,
    );
    const view = getView(container);

    view.dispatch(view.state.replaceSelection("a"));

    expect(onCursorChange).toHaveBeenCalled();
    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1][0];
    expect(lastCall.line).toBeGreaterThanOrEqual(1);
    expect(lastCall.column).toBeGreaterThanOrEqual(1);
    // Typing a single character at the start of an empty document should
    // land the cursor right after it, i.e. line 1, column 2.
    expect(lastCall).toEqual({ line: 1, column: 2 });
  });

  it("moves the cursor to a later line/column after typing a newline and more text", () => {
    const onCursorChange = vi.fn();
    const { container } = render(
      <CodeEditor value="" onCursorChange={onCursorChange} />,
    );
    const view = getView(container);

    view.dispatch(view.state.replaceSelection("a"));
    view.dispatch(view.state.replaceSelection("\nbc"));

    expect(view.state.doc.toString()).toBe("a\nbc");

    const lastCall =
      onCursorChange.mock.calls[onCursorChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual({ line: 2, column: 3 });
  });

  it("does not crash when onCursorChange is omitted and the document changes", () => {
    const { container, rerender } = render(<CodeEditor value="" />);
    const view = getView(container);

    expect(() =>
      view.dispatch(view.state.replaceSelection("hello")),
    ).not.toThrow();
    expect(() => rerender(<CodeEditor value="hello world" />)).not.toThrow();
  });

  it("does not call onCursorChange when the document is created but not yet edited", () => {
    const onCursorChange = vi.fn();
    render(<CodeEditor value='{"a":1}' onCursorChange={onCursorChange} />);
    expect(onCursorChange).not.toHaveBeenCalled();
  });
});

describe("CodeEditor — jumpTarget", () => {
  function getView(container: HTMLElement): EditorView {
    const dom = container.querySelector(".code-editor") as HTMLElement;
    const view = EditorView.findFromDOM(dom);
    if (!view) throw new Error("Could not find CodeMirror view in DOM");
    return view;
  }

  const multilineValue = '{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}';

  it("scrolls to and selects the target position, and focuses the editor, when jumpTarget is set", () => {
    const { container, rerender } = render(
      <CodeEditor value={multilineValue} jumpTarget={null} />,
    );
    const view = getView(container);

    rerender(
      <CodeEditor
        value={multilineValue}
        jumpTarget={{ line: 3, column: 3, nonce: 1 }}
      />,
    );

    // Expected offset: start of line 3 + (column - 1)
    const lineObj = view.state.doc.line(3);
    const expectedPos = lineObj.from + 2;
    expect(view.state.selection.main.head).toBe(expectedPos);
    expect(view.state.selection.main.anchor).toBe(expectedPos);

    // The editor's content element should now be focused.
    expect(view.contentDOM.contains(document.activeElement)).toBe(true);
  });

  it("re-triggers the jump when the same line/column is requested again with an incremented nonce", () => {
    const { container, rerender } = render(
      <CodeEditor value={multilineValue} jumpTarget={null} />,
    );
    const view = getView(container);

    rerender(
      <CodeEditor
        value={multilineValue}
        jumpTarget={{ line: 2, column: 1, nonce: 1 }}
      />,
    );
    expect(() =>
      rerender(
        <CodeEditor
          value={multilineValue}
          jumpTarget={{ line: 2, column: 1, nonce: 2 }}
        />,
      ),
    ).not.toThrow();

    const lineObj = view.state.doc.line(2);
    expect(view.state.selection.main.head).toBe(lineObj.from);
    expect(view.contentDOM.contains(document.activeElement)).toBe(true);
  });

  it("does not throw and does not move the cursor when jumpTarget is omitted", () => {
    const { container } = render(<CodeEditor value={multilineValue} />);
    const view = getView(container);
    expect(view.state.selection.main.head).toBe(0);
  });

  it("does not throw when jumpTarget is null", () => {
    expect(() =>
      render(<CodeEditor value={multilineValue} jumpTarget={null} />),
    ).not.toThrow();
  });

  it("does not throw when jumpTarget transitions from a value back to null", () => {
    const { rerender } = render(
      <CodeEditor
        value={multilineValue}
        jumpTarget={{ line: 2, column: 1, nonce: 1 }}
      />,
    );
    expect(() =>
      rerender(<CodeEditor value={multilineValue} jumpTarget={null} />),
    ).not.toThrow();
  });
});
