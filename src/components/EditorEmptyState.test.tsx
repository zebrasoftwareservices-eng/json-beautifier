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
      />,
    );
    expect(
      screen.getByRole("button", { name: "Load from URL" }),
    ).toBeInTheDocument();
  });

  it("renders exactly 3 buttons", () => {
    render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button")).toHaveLength(3);
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
      />,
    );
    await user.click(screen.getByRole("button", { name: "Load from URL" }));
    expect(onLoadUrl).toHaveBeenCalledOnce();
  });

  it("does not call onSample or onLoadUrl when Paste is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Paste from clipboard" }),
    );
    expect(onSample).not.toHaveBeenCalled();
    expect(onLoadUrl).not.toHaveBeenCalled();
  });

  it("does not call onPaste or onLoadUrl when Try sample JSON is clicked", async () => {
    const onPaste = vi.fn();
    const onSample = vi.fn();
    const onLoadUrl = vi.fn();
    const user = userEvent.setup();
    render(
      <EditorEmptyState
        onPaste={onPaste}
        onSample={onSample}
        onLoadUrl={onLoadUrl}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Try sample JSON" }));
    expect(onPaste).not.toHaveBeenCalled();
    expect(onLoadUrl).not.toHaveBeenCalled();
  });
});

// ── 4. Accessibility ──────────────────────────────────────────────────────────

describe("EditorEmptyState — accessibility", () => {
  it("has an aria-label on the container div", () => {
    const { container } = render(
      <EditorEmptyState
        onPaste={vi.fn()}
        onSample={vi.fn()}
        onLoadUrl={vi.fn()}
      />,
    );
    const root = container.querySelector(".editor-empty-state");
    expect(root).toHaveAttribute("aria-label", "Empty editor quick actions");
  });
});
