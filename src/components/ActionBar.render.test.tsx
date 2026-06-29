import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionBar } from "./ActionBar";

// ── Mock Tabler icons to avoid SVG rendering issues ───────────────────────────

vi.mock("@tabler/icons-react", () => ({
  IconBolt: () => <svg data-testid="icon-bolt" />,
  IconCheck: () => <svg data-testid="icon-check" />,
  IconDownload: () => <svg data-testid="icon-download" />,
  IconTrash: () => <svg data-testid="icon-trash" />,
}));

// ── Minimal props for ActionBar ───────────────────────────────────────────────

const noop = () => {};

const defaultProps = {
  indent: 2,
  onIndentChange: noop,
  onFormat: noop,
  onMinify: noop,
  onValidate: noop,
  onClear: noop,
  onCopy: noop,
  onDownload: noop,
  onPaste: noop,
  onSample: noop,
  onUpload: noop,
  onLoadUrl: noop,
  onRepair: noop,
  onOpenPalette: noop,
  processing: false,
};

// ── 1. CSS classes on restyled buttons ────────────────────────────────────────

describe("ActionBar — toolbar-btn CSS classes", () => {
  it("Format button has classes toolbar-btn and toolbar-btn--format", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--format");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Validate button has classes toolbar-btn and toolbar-btn--validate", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--validate");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Download button has classes toolbar-btn and toolbar-btn--export", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--export");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Clear button has classes toolbar-btn and toolbar-btn--clear", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--clear");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });
});

// ── 2. Icons render inside restyled buttons ───────────────────────────────────

describe("ActionBar — icon rendering inside restyled buttons", () => {
  it("Format button renders IconBolt (svg[data-testid=icon-bolt])", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--format");
    expect(btn!.querySelector('[data-testid="icon-bolt"]')).not.toBeNull();
  });

  it("Validate button renders IconCheck (svg[data-testid=icon-check])", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--validate");
    expect(btn!.querySelector('[data-testid="icon-check"]')).not.toBeNull();
  });

  it("Download button renders IconDownload (svg[data-testid=icon-download])", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--export");
    expect(btn!.querySelector('[data-testid="icon-download"]')).not.toBeNull();
  });

  it("Clear button renders IconTrash (svg[data-testid=icon-trash])", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--clear");
    expect(btn!.querySelector('[data-testid="icon-trash"]')).not.toBeNull();
  });
});

// ── 3. Minify button is NOT restyled ─────────────────────────────────────────

describe("ActionBar — unchanged buttons", () => {
  it("Minify button does NOT have the toolbar-btn class", () => {
    render(<ActionBar {...defaultProps} />);
    const minifyBtn = screen.getByRole("button", { name: /minify/i });
    expect(minifyBtn.classList.contains("toolbar-btn")).toBe(false);
  });
});

// ── 4. Callbacks fire on click ────────────────────────────────────────────────

describe("ActionBar — callbacks fire on click", () => {
  it("calls onFormat when Format button is clicked", () => {
    const onFormat = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onFormat={onFormat} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--format")!);
    expect(onFormat).toHaveBeenCalledTimes(1);
  });

  it("calls onValidate when Validate button is clicked", () => {
    const onValidate = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onValidate={onValidate} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--validate")!);
    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it("calls onDownload when Download button is clicked", () => {
    const onDownload = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onDownload={onDownload} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--export")!);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("calls onClear when Clear button is clicked", () => {
    const onClear = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onClear={onClear} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--clear")!);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
