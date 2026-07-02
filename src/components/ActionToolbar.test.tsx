import type { ComponentPropsWithoutRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ActionToolbar } from "./ActionToolbar";

// ── Mock Tabler icons — forward props so className/aria-hidden/size are covered

vi.mock("@tabler/icons-react", () => ({
  IconBolt: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-bolt" {...props} />
  ),
  IconCheck: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-check" {...props} />
  ),
  IconCopy: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-copy" {...props} />
  ),
  IconDownload: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-download" {...props} />
  ),
  IconMinimize: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-minimize" {...props} />
  ),
  IconWand: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-wand" {...props} />
  ),
  IconX: (props: ComponentPropsWithoutRef<"svg">) => (
    <svg data-testid="icon-x" {...props} />
  ),
}));

// ── Minimal props for ActionToolbar ───────────────────────────────────────────

const noop = () => {};

const defaultProps = {
  indent: 2,
  onIndentChange: noop,
  onFormat: noop,
  onMinify: noop,
  onValidate: noop,
  onRepair: noop,
  onCopy: noop,
  onDownload: noop,
  onClear: noop,
  processing: false,
  hasInput: true,
  autoFormat: false,
  onAutoFormatChange: noop,
};

// ── 1. Toolbar landmark ────────────────────────────────────────────────────────

describe("ActionToolbar — toolbar landmark", () => {
  it("renders a role=toolbar with the expected accessible name", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(
      screen.getByRole("toolbar", { name: "Editor toolbar" }),
    ).toBeInTheDocument();
  });
});

// ── 2. Primary action callbacks ────────────────────────────────────────────────

describe("ActionToolbar — primary action callbacks", () => {
  it("calls onFormat when Format is clicked", () => {
    const onFormat = vi.fn();
    render(<ActionToolbar {...defaultProps} onFormat={onFormat} />);
    fireEvent.click(screen.getByRole("button", { name: /Format/ }));
    expect(onFormat).toHaveBeenCalledTimes(1);
  });

  it("calls onMinify when Minify is clicked", () => {
    const onMinify = vi.fn();
    render(<ActionToolbar {...defaultProps} onMinify={onMinify} />);
    fireEvent.click(screen.getByRole("button", { name: /Minify/ }));
    expect(onMinify).toHaveBeenCalledTimes(1);
  });

  it("calls onValidate when Validate is clicked", () => {
    const onValidate = vi.fn();
    render(<ActionToolbar {...defaultProps} onValidate={onValidate} />);
    fireEvent.click(screen.getByRole("button", { name: /Validate/ }));
    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it("calls onRepair when Repair is clicked and repairErrorCount > 0", () => {
    const onRepair = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        onRepair={onRepair}
        repairErrorCount={2}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Repair/ }));
    expect(onRepair).toHaveBeenCalledTimes(1);
  });
});

// ── 3. Primary action disabled states ──────────────────────────────────────────

describe("ActionToolbar — primary action disabled states", () => {
  it("Format is disabled when hasInput is false", () => {
    render(<ActionToolbar {...defaultProps} hasInput={false} />);
    expect(screen.getByRole("button", { name: /Format/ })).toBeDisabled();
  });

  it("Format is disabled when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("button", { name: /Format/ })).toBeDisabled();
  });

  it("Format is enabled when hasInput is true and not processing", () => {
    render(<ActionToolbar {...defaultProps} hasInput processing={false} />);
    expect(screen.getByRole("button", { name: /Format/ })).not.toBeDisabled();
  });

  it("Minify is enabled even when hasInput is false", () => {
    render(<ActionToolbar {...defaultProps} hasInput={false} />);
    expect(screen.getByRole("button", { name: /Minify/ })).not.toBeDisabled();
  });

  it("Minify is disabled when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("button", { name: /Minify/ })).toBeDisabled();
  });

  it("Validate is enabled even when hasInput is false", () => {
    render(<ActionToolbar {...defaultProps} hasInput={false} />);
    expect(screen.getByRole("button", { name: /Validate/ })).not.toBeDisabled();
  });

  it("Validate is disabled when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("button", { name: /Validate/ })).toBeDisabled();
  });

  it("Repair is disabled when repairErrorCount is 0 (default)", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /Repair/ })).toBeDisabled();
  });

  it("Repair is disabled when repairErrorCount is negative", () => {
    render(<ActionToolbar {...defaultProps} repairErrorCount={-1} />);
    expect(screen.getByRole("button", { name: /Repair/ })).toBeDisabled();
  });

  it("Repair is enabled when repairErrorCount > 0 and not processing", () => {
    render(<ActionToolbar {...defaultProps} repairErrorCount={1} />);
    expect(screen.getByRole("button", { name: /Repair/ })).not.toBeDisabled();
  });

  it("Repair is disabled when processing is true even if repairErrorCount > 0", () => {
    render(<ActionToolbar {...defaultProps} processing repairErrorCount={3} />);
    expect(screen.getByRole("button", { name: /Repair/ })).toBeDisabled();
  });
});

// ── 4. Active segment visual state (local component state) ──────────────────────

describe("ActionToolbar — active segment state", () => {
  it("no segment is active before any click", () => {
    const { container } = render(<ActionToolbar {...defaultProps} />);
    expect(container.querySelector(".segmented__item--active")).toBeNull();
  });

  it("marks Format as active after clicking Format", () => {
    render(<ActionToolbar {...defaultProps} />);
    const formatBtn = screen.getByRole("button", { name: /Format/ });
    fireEvent.click(formatBtn);
    expect(formatBtn).toHaveClass("segmented__item--active");
  });

  it("marks Minify as active after clicking Minify", () => {
    render(<ActionToolbar {...defaultProps} />);
    const minifyBtn = screen.getByRole("button", { name: /Minify/ });
    fireEvent.click(minifyBtn);
    expect(minifyBtn).toHaveClass("segmented__item--active");
  });

  it("moves the active state from Format to Validate on subsequent click", () => {
    render(<ActionToolbar {...defaultProps} repairErrorCount={1} />);
    const formatBtn = screen.getByRole("button", { name: /Format/ });
    const validateBtn = screen.getByRole("button", { name: /Validate/ });

    fireEvent.click(formatBtn);
    expect(formatBtn).toHaveClass("segmented__item--active");

    fireEvent.click(validateBtn);
    expect(validateBtn).toHaveClass("segmented__item--active");
    expect(formatBtn).not.toHaveClass("segmented__item--active");
  });

  it("marks Repair as active after clicking Repair (when enabled)", () => {
    render(<ActionToolbar {...defaultProps} repairErrorCount={1} />);
    const repairBtn = screen.getByRole("button", { name: /Repair/ });
    fireEvent.click(repairBtn);
    expect(repairBtn).toHaveClass("segmented__item--active");
  });
});

// ── 5. Indent radiogroup ───────────────────────────────────────────────────────

describe("ActionToolbar — indent radiogroup", () => {
  it("renders a radiogroup labeled 'Indent size'", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(
      screen.getByRole("radiogroup", { name: "Indent size" }),
    ).toBeInTheDocument();
  });

  it("renders three radio options: 2, 4, Tab", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Tab" })).toBeInTheDocument();
  });

  it("marks the radio matching the current indent prop as checked", () => {
    render(<ActionToolbar {...defaultProps} indent={4} />);
    expect(screen.getByRole("radio", { name: "2" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "4" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Tab" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("marks the Tab radio checked when indent is '\\t'", () => {
    render(<ActionToolbar {...defaultProps} indent={"\t"} />);
    expect(screen.getByRole("radio", { name: "Tab" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onIndentChange with 2 when the '2' radio is clicked", () => {
    const onIndentChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        indent={4}
        onIndentChange={onIndentChange}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "2" }));
    expect(onIndentChange).toHaveBeenCalledWith(2);
  });

  it("calls onIndentChange with 4 when the '4' radio is clicked", () => {
    const onIndentChange = vi.fn();
    render(<ActionToolbar {...defaultProps} onIndentChange={onIndentChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    expect(onIndentChange).toHaveBeenCalledWith(4);
  });

  it("calls onIndentChange with '\\t' when the 'Tab' radio is clicked", () => {
    const onIndentChange = vi.fn();
    render(<ActionToolbar {...defaultProps} onIndentChange={onIndentChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "Tab" }));
    expect(onIndentChange).toHaveBeenCalledWith("\t");
  });

  it("disables all indent radios when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });
});

// ── 6. Auto-format switch ──────────────────────────────────────────────────────

describe("ActionToolbar — auto-format switch", () => {
  it("renders a role=switch labeled 'Auto-format'", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(
      screen.getByRole("switch", { name: "Auto-format" }),
    ).toBeInTheDocument();
  });

  it("reflects aria-checked=true when autoFormat is true", () => {
    render(<ActionToolbar {...defaultProps} autoFormat />);
    expect(screen.getByRole("switch", { name: "Auto-format" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("reflects aria-checked=false when autoFormat is false", () => {
    render(<ActionToolbar {...defaultProps} autoFormat={false} />);
    expect(screen.getByRole("switch", { name: "Auto-format" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onAutoFormatChange with the toggled value on click", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        autoFormat={false}
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Auto-format" }));
    expect(onAutoFormatChange).toHaveBeenCalledWith(true);
  });

  it("calls onAutoFormatChange(false) when currently on and clicked", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        autoFormat
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Auto-format" }));
    expect(onAutoFormatChange).toHaveBeenCalledWith(false);
  });

  it("toggles via Enter key press", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        autoFormat={false}
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("switch", { name: "Auto-format" }), {
      key: "Enter",
    });
    expect(onAutoFormatChange).toHaveBeenCalledWith(true);
  });

  it("toggles via Space key press", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        autoFormat={false}
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("switch", { name: "Auto-format" }), {
      key: " ",
    });
    expect(onAutoFormatChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle on unrelated key presses", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        autoFormat={false}
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.keyDown(screen.getByRole("switch", { name: "Auto-format" }), {
      key: "a",
    });
    expect(onAutoFormatChange).not.toHaveBeenCalled();
  });

  it("is not clickable (no callback fired) when processing is true", () => {
    const onAutoFormatChange = vi.fn();
    render(
      <ActionToolbar
        {...defaultProps}
        processing
        onAutoFormatChange={onAutoFormatChange}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Auto-format" }));
    expect(onAutoFormatChange).not.toHaveBeenCalled();
  });

  it("has tabIndex -1 when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("switch", { name: "Auto-format" })).toHaveAttribute(
      "tabIndex",
      "-1",
    );
  });

  it("has tabIndex 0 when not processing", () => {
    render(<ActionToolbar {...defaultProps} processing={false} />);
    expect(screen.getByRole("switch", { name: "Auto-format" })).toHaveAttribute(
      "tabIndex",
      "0",
    );
  });
});

// ── 7. Copy / Download utility buttons ─────────────────────────────────────────

describe("ActionToolbar — Copy and Download buttons", () => {
  it("calls onCopy when Copy is clicked", () => {
    const onCopy = vi.fn();
    render(<ActionToolbar {...defaultProps} onCopy={onCopy} />);
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("calls onDownload when Download is clicked", () => {
    const onDownload = vi.fn();
    render(<ActionToolbar {...defaultProps} onDownload={onDownload} />);
    fireEvent.click(screen.getByRole("button", { name: /Download/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("defaults the Copy button's accessible name to 'Copy'", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });

  it("reflects a custom copyLabel prop, e.g. 'Copied!'", () => {
    render(<ActionToolbar {...defaultProps} copyLabel="Copied!" />);
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy" }),
    ).not.toBeInTheDocument();
  });

  it("disables Copy and Download when hasInput is false", () => {
    render(<ActionToolbar {...defaultProps} hasInput={false} />);
    expect(screen.getByRole("button", { name: /Copy/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download/ })).toBeDisabled();
  });

  it("disables Copy and Download when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("button", { name: /Copy/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Download/ })).toBeDisabled();
  });

  it("enables Copy and Download when hasInput is true and not processing", () => {
    render(<ActionToolbar {...defaultProps} hasInput processing={false} />);
    expect(screen.getByRole("button", { name: /Copy/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Download/ })).not.toBeDisabled();
  });
});

// ── 8. Clear button ────────────────────────────────────────────────────────────

describe("ActionToolbar — Clear button", () => {
  it("has an accessible name / aria-label of 'Clear editor'", () => {
    render(<ActionToolbar {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: "Clear editor" }),
    ).toBeInTheDocument();
  });

  it("calls onClear on a single click (no confirmation step)", () => {
    const onClear = vi.fn();
    render(<ActionToolbar {...defaultProps} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear editor" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("calls onClear again on a second click (each click is independent)", () => {
    const onClear = vi.fn();
    render(<ActionToolbar {...defaultProps} onClear={onClear} />);
    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    fireEvent.click(clearBtn);
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it("is enabled even when hasInput is false", () => {
    render(<ActionToolbar {...defaultProps} hasInput={false} />);
    expect(
      screen.getByRole("button", { name: "Clear editor" }),
    ).not.toBeDisabled();
  });

  it("is disabled when processing is true", () => {
    render(<ActionToolbar {...defaultProps} processing />);
    expect(screen.getByRole("button", { name: "Clear editor" })).toBeDisabled();
  });
});

// ── 9. Icon rendering ──────────────────────────────────────────────────────────

describe("ActionToolbar — icon rendering", () => {
  it("renders all expected icons", () => {
    render(<ActionToolbar {...defaultProps} repairErrorCount={1} />);
    expect(screen.getByTestId("icon-bolt")).toBeInTheDocument();
    expect(screen.getByTestId("icon-minimize")).toBeInTheDocument();
    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
    expect(screen.getByTestId("icon-wand")).toBeInTheDocument();
    expect(screen.getByTestId("icon-copy")).toBeInTheDocument();
    expect(screen.getByTestId("icon-download")).toBeInTheDocument();
    expect(screen.getByTestId("icon-x")).toBeInTheDocument();
  });
});
