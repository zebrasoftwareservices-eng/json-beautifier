import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
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
