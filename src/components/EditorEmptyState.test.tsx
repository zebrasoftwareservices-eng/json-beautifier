import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { EditorEmptyState } from "./EditorEmptyState";

// ── 1. Hint text ──────────────────────────────────────────────────────────────

describe("EditorEmptyState — hint text", () => {
  it("renders the hint text", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Paste JSON, drop a file, or load from URL"),
    ).toBeInTheDocument();
  });
});

// ── 2. Button rendering ───────────────────────────────────────────────────────

describe("EditorEmptyState — buttons", () => {
  it("renders the Paste button with correct aria-label", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Paste from clipboard" }),
    ).toBeInTheDocument();
  });

  it("renders the Try sample JSON button with correct aria-label", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Try sample JSON" }),
    ).toBeInTheDocument();
  });

  it("renders the Load URL button with correct aria-label", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Load from URL" }),
    ).toBeInTheDocument();
  });

  it("renders the Upload button with correct aria-label", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Upload file" }),
    ).toBeInTheDocument();
  });

  it("renders exactly 4 buttons", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });
});

// ── 3. Callbacks ──────────────────────────────────────────────────────────────

describe("EditorEmptyState — callbacks", () => {
  it("calls onPaste when the Paste button is clicked", async () => {
    const onPaste = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Paste from clipboard" }),
    );
    expect(onPaste).toHaveBeenCalledOnce();
  });

  it("calls onSample when the Try sample JSON button is clicked", async () => {
    const onSample = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={onSample}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Try sample JSON" }));
    expect(onSample).toHaveBeenCalledOnce();
  });

  it("calls onLoadUrl when the Load URL button is clicked", async () => {
    const onLoadUrl = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={onLoadUrl}
        onUpload={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Load from URL" }));
    expect(onLoadUrl).toHaveBeenCalledOnce();
  });

  it("calls onUpload when the Upload button is clicked", async () => {
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={onUpload}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Upload file" }));
    expect(onUpload).toHaveBeenCalledOnce();
  });

  it("does not call onSample, onLoadUrl, or onUpload when Paste is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
        onUpload={onUpload}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Paste from clipboard" }),
    );
    expect(onSample).not.toHaveBeenCalled();
    expect(onLoadUrl).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("does not call onPaste, onLoadUrl, or onUpload when Try sample JSON is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
        onUpload={onUpload}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Try sample JSON" }));
    expect(onPaste).not.toHaveBeenCalled();
    expect(onLoadUrl).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("does not call onPaste, onSample, or onUpload when Load URL is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
        onUpload={onUpload}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Load from URL" }));
    expect(onPaste).not.toHaveBeenCalled();
    expect(onSample).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("does not call onPaste, onSample, or onLoadUrl when Upload is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const onUpload = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
        onUpload={onUpload}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Upload file" }));
    expect(onPaste).not.toHaveBeenCalled();
    expect(onSample).not.toHaveBeenCalled();
    expect(onLoadUrl).not.toHaveBeenCalled();
  });
});

// ── 4. Accessibility ──────────────────────────────────────────────────────────

describe("EditorEmptyState — accessibility", () => {
  it("exposes a named group for assistive technology", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Empty editor quick actions" }),
    ).toBeInTheDocument();
  });
});

// ── 5. Heading ───────────────────────────────────────────────────────────────

describe("EditorEmptyState — heading", () => {
  it("renders the 'Nothing to format yet' heading", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(screen.getByText("Nothing to format yet")).toBeInTheDocument();
  });

  it("applies the editor-empty-state__heading class to the heading", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    expect(screen.getByText("Nothing to format yet")).toHaveClass(
      "editor-empty-state__heading",
    );
  });
});

// ── 6. Decorative grid background ─────────────────────────────────────────────

describe("EditorEmptyState — decorative grid", () => {
  it("renders a .editor-empty-state__grid element marked aria-hidden", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    const grid = document.querySelector(".editor-empty-state__grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute("aria-hidden", "true");
  });
});

// ── 7. Keyboard hint ───────────────────────────────────────────────────────────

describe("EditorEmptyState — keyboard hint", () => {
  it("shows a 'Ctrl+V' kbd hint inside the Paste button on non-Mac platforms", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    const pasteButton = screen.getByRole("button", {
      name: "Paste from clipboard",
    });
    const kbd = pasteButton.querySelector("kbd");
    expect(kbd).toBeInTheDocument();
    expect(kbd).toHaveTextContent("Ctrl+V");
    expect(kbd).toHaveClass("editor-empty-state__kbd");
  });

  it("does not render the kbd hint inside the other buttons", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
        onUpload={vi.fn()}
      />,
    );
    const sampleButton = screen.getByRole("button", {
      name: "Try sample JSON",
    });
    const loadUrlButton = screen.getByRole("button", {
      name: "Load from URL",
    });
    const uploadButton = screen.getByRole("button", { name: "Upload file" });
    expect(sampleButton.querySelector("kbd")).not.toBeInTheDocument();
    expect(loadUrlButton.querySelector("kbd")).not.toBeInTheDocument();
    expect(uploadButton.querySelector("kbd")).not.toBeInTheDocument();
  });
});
