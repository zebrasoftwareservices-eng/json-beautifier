import type { ComponentPropsWithoutRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionBar } from "./ActionBar";

// ── Mock Tabler icons — forward props so className/aria-hidden/size are covered

vi.mock("@tabler/icons-react", () => ({
  IconBolt: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-bolt" {...props} />
  ),
  IconCheck: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-check" {...props} />
  ),
  IconClipboard: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-clipboard" {...props} />
  ),
  IconCopy: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-copy" {...props} />
  ),
  IconDownload: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-download" {...props} />
  ),
  IconFileText: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-file-text" {...props} />
  ),
  IconLink: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-link" {...props} />
  ),
  IconMinimize: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-minimize" {...props} />
  ),
  IconTerminal2: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-terminal2" {...props} />
  ),
  IconTrash: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-trash" {...props} />
  ),
  IconUpload: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-upload" {...props} />
  ),
  IconWand: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-wand" {...props} />
  ),
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

// ── 1. CSS classes on toolbar buttons ─────────────────────────────────────────

describe("ActionBar — toolbar-btn CSS classes", () => {
  it("Format button has toolbar-btn and toolbar-btn--primary classes", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--primary");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Validate button has toolbar-btn and toolbar-btn--validate classes", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--validate");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Download button has toolbar-btn and toolbar-btn--export classes", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--export");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Clear button has toolbar-btn and toolbar-btn--clear classes", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--clear");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });

  it("Minify button has toolbar-btn and toolbar-btn--minify classes", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--minify");
    expect(btn).not.toBeNull();
    expect(btn!.classList.contains("toolbar-btn")).toBe(true);
  });
});

// ── 2. Icons render inside toolbar buttons ────────────────────────────────────

describe("ActionBar — icon rendering inside restyled buttons", () => {
  it("Format button renders IconBolt", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--primary");
    expect(btn!.querySelector('[data-testid="icon-bolt"]')).not.toBeNull();
  });

  it("Validate button renders IconCheck", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--validate");
    expect(btn!.querySelector('[data-testid="icon-check"]')).not.toBeNull();
  });

  it("Download button renders IconDownload", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--export");
    expect(btn!.querySelector('[data-testid="icon-download"]')).not.toBeNull();
  });

  it("Clear button renders IconTrash", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--clear");
    expect(btn!.querySelector('[data-testid="icon-trash"]')).not.toBeNull();
  });

  it("Repair button renders IconWand", () => {
    const { container } = render(
      <ActionBar {...defaultProps} repairErrorCount={1} />,
    );
    const btn = container.querySelector(".toolbar-btn--repair");
    expect(btn!.querySelector('[data-testid="icon-wand"]')).not.toBeNull();
  });

  it("Minify button renders IconMinimize", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(".toolbar-btn--minify");
    expect(btn!.querySelector('[data-testid="icon-minimize"]')).not.toBeNull();
  });
});

// ── 3. Zone layout ────────────────────────────────────────────────────────────

describe("ActionBar — zone layout", () => {
  it("renders 4 toolbar zones", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    expect(container.querySelectorAll(".toolbar-zone").length).toBe(5); // In, Transform, Settings, Out, Utility
  });

  it("renders 3 zone dividers between zones (In→Transform→Settings→Out)", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    expect(container.querySelectorAll(".toolbar-divider").length).toBe(3);
  });

  it("renders a spacer between Out zone and Utility", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    expect(container.querySelector(".toolbar-spacer")).not.toBeNull();
  });

  it("Clear and palette buttons are icon-only (toolbar-btn--icon-only)", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    expect(container.querySelectorAll(".toolbar-btn--icon-only").length).toBe(
      2,
    );
  });
});

// ── 4. Callbacks fire on click ────────────────────────────────────────────────

describe("ActionBar — callbacks fire on click", () => {
  it("calls onFormat when Format button is clicked", () => {
    const onFormat = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onFormat={onFormat} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--primary")!);
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

  it("calls onClear after two clicks (confirmation flow)", () => {
    const onClear = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onClear={onClear} />,
    );
    const clearBtn = container.querySelector(".toolbar-btn--clear")!;
    // First click arms — onClear not yet called
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(0);
    // Second click confirms
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("onClear is NOT called when only one click is made", () => {
    const onClear = vi.fn();
    const { container } = render(
      <ActionBar {...defaultProps} onClear={onClear} />,
    );
    fireEvent.click(container.querySelector(".toolbar-btn--clear")!);
    expect(onClear).not.toHaveBeenCalled();
  });
});

// ── 5. Repair badge ───────────────────────────────────────────────────────────

describe("ActionBar — repair badge", () => {
  it("hides badge when repairErrorCount is 0 (default)", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    expect(container.querySelector(".toolbar-repair-badge")).toBeNull();
  });

  it("shows badge when repairErrorCount > 0", () => {
    const { container } = render(
      <ActionBar {...defaultProps} repairErrorCount={3} />,
    );
    const badge = container.querySelector(".toolbar-repair-badge");
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe("3");
  });

  it("Repair button is disabled when repairErrorCount is 0", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const btn = container.querySelector(
      ".toolbar-btn--repair",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("Repair button is enabled when repairErrorCount > 0", () => {
    const { container } = render(
      <ActionBar {...defaultProps} repairErrorCount={1} />,
    );
    const btn = container.querySelector(
      ".toolbar-btn--repair",
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

// ── 6. Auto-format toggle ─────────────────────────────────────────────────────

describe("ActionBar — auto-format toggle", () => {
  it("renders a role=switch for auto-format", () => {
    render(<ActionBar {...defaultProps} autoFormat />);
    expect(screen.getByRole("switch", { name: /auto-format/i })).not.toBeNull();
  });

  it("toggle is checked when autoFormat=true", () => {
    render(<ActionBar {...defaultProps} autoFormat />);
    const toggle = screen.getByRole("switch", { name: /auto-format/i });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("toggle is unchecked when autoFormat=false", () => {
    render(<ActionBar {...defaultProps} autoFormat={false} />);
    const toggle = screen.getByRole("switch", { name: /auto-format/i });
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("calls onAutoFormatChange when toggle is clicked", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionBar
        {...defaultProps}
        autoFormat
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: /auto-format/i }));
    expect(onAutoFormatChange).toHaveBeenCalledWith(false);
  });
});

// ── 7. Clear button armed state ───────────────────────────────────────────────

describe("ActionBar — clear button armed state", () => {
  it("adds toolbar-btn--clear-armed class after first click", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const clearBtn = container.querySelector(".toolbar-btn--clear")!;
    fireEvent.click(clearBtn);
    expect(clearBtn.classList.contains("toolbar-btn--clear-armed")).toBe(true);
  });

  it("clears armed state after second click", () => {
    const { container } = render(<ActionBar {...defaultProps} />);
    const clearBtn = container.querySelector(".toolbar-btn--clear")!;
    fireEvent.click(clearBtn);
    fireEvent.click(clearBtn);
    expect(clearBtn.classList.contains("toolbar-btn--clear-armed")).toBe(false);
  });

  it("auto-resets armed state after 2s timeout", async () => {
    vi.useFakeTimers();
    const { container } = render(<ActionBar {...defaultProps} />);
    const clearBtn = container.querySelector(".toolbar-btn--clear")!;
    fireEvent.click(clearBtn);
    expect(clearBtn.classList.contains("toolbar-btn--clear-armed")).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(2001);
    });
    expect(clearBtn.classList.contains("toolbar-btn--clear-armed")).toBe(false);
    vi.useRealTimers();
  });
});
