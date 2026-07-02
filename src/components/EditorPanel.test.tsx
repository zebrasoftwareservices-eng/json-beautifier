import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EditorPanel } from "./EditorPanel";
import type { CodeEditorError } from "./CodeEditor";

// Mock CodeEditor — render a plain textarea driven by props
vi.mock("./CodeEditor", () => ({
  CodeEditor: ({
    value,
    placeholder,
  }: {
    value: string;
    placeholder?: string;
  }) => <textarea readOnly value={value} placeholder={placeholder} />,
}));

function renderEditorPanel(
  props: Partial<React.ComponentProps<typeof EditorPanel>> = {},
) {
  const defaults: React.ComponentProps<typeof EditorPanel> = {
    value: "",
    onChange: vi.fn(),
    lineCount: 0,
    sizeLabel: null,
    isDragging: false,
    onDragOver: vi.fn(),
    onDragLeave: vi.fn(),
    onDrop: vi.fn(),
    uploadProgress: null,
  };
  return render(<EditorPanel {...defaults} {...props} />);
}

describe("EditorPanel — label and stats", () => {
  it("renders the 'Input' label", () => {
    renderEditorPanel();
    expect(screen.getByText("Input")).toBeInTheDocument();
  });

  it("shows line count and size label when there is no error", () => {
    renderEditorPanel({ lineCount: 5, sizeLabel: "1.2 KB" });
    expect(screen.getByText("5 lines · 1.2 KB")).toBeInTheDocument();
  });

  it("uses singular 'line' when lineCount is 1", () => {
    renderEditorPanel({ lineCount: 1, sizeLabel: "10 B" });
    expect(screen.getByText("1 line · 10 B")).toBeInTheDocument();
  });

  it("omits the size segment when sizeLabel is null", () => {
    renderEditorPanel({ lineCount: 3, sizeLabel: null });
    expect(screen.getByText("3 lines")).toBeInTheDocument();
  });

  it("shows '1 error' in the stats when error prop is set", () => {
    const error: CodeEditorError = { message: "Unexpected token" };
    renderEditorPanel({ error, lineCount: 5, sizeLabel: "1.2 KB" });
    expect(screen.getByText("1 error")).toBeInTheDocument();
    expect(screen.queryByText("5 lines · 1.2 KB")).not.toBeInTheDocument();
  });

  it("shows line/size stats (not '1 error') when error is null", () => {
    renderEditorPanel({ error: null, lineCount: 2, sizeLabel: "50 B" });
    expect(screen.getByText("2 lines · 50 B")).toBeInTheDocument();
    expect(screen.queryByText("1 error")).not.toBeInTheDocument();
  });
});

describe("EditorPanel — empty state", () => {
  it("renders emptyState when value is an empty string", () => {
    renderEditorPanel({
      value: "",
      emptyState: <div data-testid="empty-state">Empty!</div>,
    });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("does not render emptyState when value is non-empty", () => {
    renderEditorPanel({
      value: '{"a":1}',
      emptyState: <div data-testid="empty-state">Empty!</div>,
    });
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("renders nothing extra when emptyState is not provided and value is empty", () => {
    renderEditorPanel({ value: "" });
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });

  it("does not render emptyState when value is empty and isDragging is true (avoids colliding with drop overlay)", () => {
    renderEditorPanel({
      value: "",
      isDragging: true,
      emptyState: <div data-testid="empty-state">Empty!</div>,
    });
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
    expect(screen.getByText("Drop JSON file to load")).toBeInTheDocument();
  });

  it("does not render emptyState when value is empty and an upload is in progress (avoids a click racing the in-flight file read)", () => {
    renderEditorPanel({
      value: "",
      uploadProgress: 42,
      emptyState: <div data-testid="empty-state">Empty!</div>,
    });
    expect(screen.queryByTestId("empty-state")).not.toBeInTheDocument();
  });
});

describe("EditorPanel — drag and drop", () => {
  it("does not apply drop-zone--active class when isDragging is false", () => {
    renderEditorPanel({ isDragging: false });
    const dropZone = document.querySelector(".drop-zone");
    expect(dropZone).toBeInTheDocument();
    expect(dropZone).not.toHaveClass("drop-zone--active");
  });

  it("applies drop-zone--active class when isDragging is true", () => {
    renderEditorPanel({ isDragging: true });
    const dropZone = document.querySelector(".drop-zone");
    expect(dropZone).toHaveClass("drop-zone--active");
  });

  it("shows the drop overlay text when isDragging is true", () => {
    renderEditorPanel({ isDragging: true });
    expect(screen.getByText("Drop JSON file to load")).toBeInTheDocument();
  });

  it("does not show the drop overlay text when isDragging is false", () => {
    renderEditorPanel({ isDragging: false });
    expect(
      screen.queryByText("Drop JSON file to load"),
    ).not.toBeInTheDocument();
  });

  it("calls onDragOver when a dragover event fires on the drop zone", () => {
    const onDragOver = vi.fn();
    renderEditorPanel({ onDragOver });
    const dropZone = document.querySelector(".drop-zone") as HTMLElement;
    const event = new Event("dragover", { bubbles: true, cancelable: true });
    dropZone.dispatchEvent(event);
    expect(onDragOver).toHaveBeenCalled();
  });

  it("calls onDragLeave when a dragleave event fires on the drop zone", () => {
    const onDragLeave = vi.fn();
    renderEditorPanel({ onDragLeave });
    const dropZone = document.querySelector(".drop-zone") as HTMLElement;
    const event = new Event("dragleave", { bubbles: true, cancelable: true });
    dropZone.dispatchEvent(event);
    expect(onDragLeave).toHaveBeenCalled();
  });

  it("calls onDrop when a drop event fires on the drop zone", () => {
    const onDrop = vi.fn();
    renderEditorPanel({ onDrop });
    const dropZone = document.querySelector(".drop-zone") as HTMLElement;
    const event = new Event("drop", { bubbles: true, cancelable: true });
    dropZone.dispatchEvent(event);
    expect(onDrop).toHaveBeenCalled();
  });
});

describe("EditorPanel — upload progress", () => {
  it("renders the upload progress bar with correct width when uploadProgress is a number", () => {
    renderEditorPanel({ uploadProgress: 42 });
    const progressBar = document.querySelector(".upload-progress__bar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: "42%" });
  });

  it("exposes progressbar role with correct aria attributes", () => {
    renderEditorPanel({ uploadProgress: 75 });
    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "75");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders progress bar at 0% width", () => {
    renderEditorPanel({ uploadProgress: 0 });
    const progressBar = document.querySelector(".upload-progress__bar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: "0%" });
  });

  it("omits the upload progress bar when uploadProgress is null", () => {
    renderEditorPanel({ uploadProgress: null });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(
      document.querySelector(".upload-progress__bar"),
    ).not.toBeInTheDocument();
  });
});
