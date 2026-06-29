import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { DwellButton } from "./DwellButton";

// ── 1. Renders children as a button ──────────────────────────────────────────

describe("DwellButton — rendering", () => {
  it("renders the children inside a button element", () => {
    render(<DwellButton tooltip="My Tooltip">Click Me</DwellButton>);
    expect(
      screen.getByRole("button", { name: "Click Me" }),
    ).toBeInTheDocument();
  });

  it("renders inside a dwell-wrapper div", () => {
    const { container } = render(
      <DwellButton tooltip="My Tooltip">Save</DwellButton>,
    );
    expect(container.querySelector(".dwell-wrapper")).not.toBeNull();
  });
});

// ── 2. Passes className, disabled, onClick through to the button ──────────────

describe("DwellButton — prop forwarding", () => {
  it("passes className to the button", () => {
    render(
      <DwellButton tooltip="tip" className="my-btn">
        X
      </DwellButton>,
    );
    expect(screen.getByRole("button")).toHaveClass("my-btn");
  });

  it("passes disabled to the button", () => {
    render(
      <DwellButton tooltip="tip" disabled>
        X
      </DwellButton>,
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when the button is clicked", () => {
    const onClick = vi.fn();
    render(
      <DwellButton tooltip="tip" onClick={onClick}>
        X
      </DwellButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

// ── 3. No tooltip visible initially ──────────────────────────────────────────

describe("DwellButton — initial tooltip state", () => {
  it("does not show the tooltip on initial render", () => {
    render(<DwellButton tooltip="Hidden Tip">X</DwellButton>);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

// ── 4. Tooltip appears after 1500ms of mouseenter ────────────────────────────

describe("DwellButton — dwell timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tooltip is not visible before 1500ms", () => {
    const { container } = render(
      <DwellButton tooltip="Dwell Tip">X</DwellButton>,
    );
    fireEvent.mouseEnter(container.querySelector(".dwell-wrapper")!);
    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("tooltip appears after exactly 1500ms of hover", () => {
    const { container } = render(
      <DwellButton tooltip="Dwell Tip">X</DwellButton>,
    );
    fireEvent.mouseEnter(container.querySelector(".dwell-wrapper")!);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});

// ── 5. Tooltip contains tooltip text and shortcut kbd ─────────────────────────

describe("DwellButton — tooltip content", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tooltip shows the tooltip text", () => {
    const { container } = render(
      <DwellButton tooltip="Format JSON" shortcut="⌘⇧B">
        X
      </DwellButton>,
    );
    fireEvent.mouseEnter(container.querySelector(".dwell-wrapper")!);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("Format JSON")).toBeInTheDocument();
  });

  it("tooltip shows the shortcut kbd", () => {
    const { container } = render(
      <DwellButton tooltip="Format JSON" shortcut="⌘⇧B">
        X
      </DwellButton>,
    );
    fireEvent.mouseEnter(container.querySelector(".dwell-wrapper")!);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByText("⌘⇧B")).toBeInTheDocument();
  });
});

// ── 6. Tooltip disappears on mouseleave even before 1500ms ────────────────────

describe("DwellButton — mouseleave cancels timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("tooltip does not appear after mouseleave before 1500ms", () => {
    const { container } = render(
      <DwellButton tooltip="Cancelled Tip">X</DwellButton>,
    );
    const wrapper = container.querySelector(".dwell-wrapper")!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.mouseLeave(wrapper);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("hides tooltip on mouseleave even after it became visible", () => {
    const { container } = render(
      <DwellButton tooltip="Visible Tip">X</DwellButton>,
    );
    const wrapper = container.querySelector(".dwell-wrapper")!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

// ── 7. No shortcut kbd when shortcut is not provided ─────────────────────────

describe("DwellButton — tooltip without shortcut", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders only the label without a kbd element when no shortcut is given", () => {
    const { container } = render(
      <DwellButton tooltip="Only Label">X</DwellButton>,
    );
    const wrapper = container.querySelector(".dwell-wrapper")!;
    fireEvent.mouseEnter(wrapper);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("Only Label")).toBeInTheDocument();
    expect(container.querySelector(".dwell-tooltip__kbd")).toBeNull();
  });
});
