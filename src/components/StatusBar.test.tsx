import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { StatusBar } from "./StatusBar";

afterEach(() => {
  cleanup();
});

const baseProps = {
  state: "idle" as const,
  errorCount: 0,
  lineCount: 3,
  sizeLabel: "42 B" as string | null,
  cursorLine: 1,
  cursorColumn: 1,
  indentLabel: "2 spaces",
  onOpenPalette: vi.fn(),
};

// ── 1. State label text ───────────────────────────────────────────────────────

describe("StatusBar — state label", () => {
  it('renders "Valid JSON" when state is valid', () => {
    render(<StatusBar {...baseProps} state="valid" />);
    expect(screen.getByText("Valid JSON")).toBeInTheDocument();
  });

  it('renders "Ready" when state is idle', () => {
    render(<StatusBar {...baseProps} state="idle" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("renders singular error copy when errorCount is 1", () => {
    render(<StatusBar {...baseProps} state="invalid" errorCount={1} />);
    expect(screen.getByText("Invalid JSON · 1 error")).toBeInTheDocument();
  });

  it("renders plural error copy when errorCount is 0", () => {
    render(<StatusBar {...baseProps} state="invalid" errorCount={0} />);
    expect(screen.getByText("Invalid JSON · 0 errors")).toBeInTheDocument();
  });

  it("renders plural error copy when errorCount is greater than 1", () => {
    render(<StatusBar {...baseProps} state="invalid" errorCount={5} />);
    expect(screen.getByText("Invalid JSON · 5 errors")).toBeInTheDocument();
  });
});

// ── 2. Status dot ─────────────────────────────────────────────────────────────

describe("StatusBar — status dot", () => {
  it("applies status-bar__dot--valid when state is valid", () => {
    const { container } = render(<StatusBar {...baseProps} state="valid" />);
    const dot = container.querySelector(".status-bar__dot");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("status-bar__dot--valid");
  });

  it("applies status-bar__dot--invalid when state is invalid", () => {
    const { container } = render(
      <StatusBar {...baseProps} state="invalid" errorCount={2} />,
    );
    const dot = container.querySelector(".status-bar__dot");
    expect(dot).toHaveClass("status-bar__dot--invalid");
  });

  it("applies status-bar__dot--idle when state is idle", () => {
    const { container } = render(<StatusBar {...baseProps} state="idle" />);
    const dot = container.querySelector(".status-bar__dot");
    expect(dot).toHaveClass("status-bar__dot--idle");
  });
});

// ── 3. Size / line-count stats ────────────────────────────────────────────────

describe("StatusBar — size and line-count stats", () => {
  it("renders line count, sizeLabel, and UTF-8 when sizeLabel is provided", () => {
    render(
      <StatusBar {...baseProps} state="valid" lineCount={3} sizeLabel="42 B" />,
    );
    expect(screen.getByText("3 lines")).toBeInTheDocument();
    expect(screen.getByText("42 B")).toBeInTheDocument();
    expect(screen.getByText("UTF-8")).toBeInTheDocument();
  });

  it("renders singular 'line' when lineCount is 1", () => {
    render(
      <StatusBar {...baseProps} state="valid" lineCount={1} sizeLabel="1 B" />,
    );
    expect(screen.getByText("1 line")).toBeInTheDocument();
  });

  it("renders plural 'lines' when lineCount is 0", () => {
    render(
      <StatusBar {...baseProps} state="idle" lineCount={0} sizeLabel="0 B" />,
    );
    expect(screen.getByText("0 lines")).toBeInTheDocument();
  });

  it("does not render line count, sizeLabel, or UTF-8 when sizeLabel is null", () => {
    render(
      <StatusBar {...baseProps} state="idle" lineCount={3} sizeLabel={null} />,
    );
    expect(screen.queryByText(/lines?$/)).not.toBeInTheDocument();
    expect(screen.queryByText("UTF-8")).not.toBeInTheDocument();
  });
});

// ── 4. Cursor position ────────────────────────────────────────────────────────

describe("StatusBar — cursor position", () => {
  it("renders the cursor line and column", () => {
    render(<StatusBar {...baseProps} cursorLine={12} cursorColumn={34} />);
    expect(screen.getByText("Ln 12, Col 34")).toBeInTheDocument();
  });

  it("updates the rendered cursor position when props change", () => {
    const { rerender } = render(
      <StatusBar {...baseProps} cursorLine={1} cursorColumn={1} />,
    );
    expect(screen.getByText("Ln 1, Col 1")).toBeInTheDocument();
    rerender(<StatusBar {...baseProps} cursorLine={7} cursorColumn={2} />);
    expect(screen.getByText("Ln 7, Col 2")).toBeInTheDocument();
  });
});

// ── 5. Indent label ───────────────────────────────────────────────────────────

describe("StatusBar — indent label", () => {
  it("renders the indentLabel text", () => {
    render(<StatusBar {...baseProps} indentLabel="4 spaces" />);
    expect(screen.getByText("4 spaces")).toBeInTheDocument();
  });

  it("renders a different indentLabel text (tabs)", () => {
    render(<StatusBar {...baseProps} indentLabel="Tabs" />);
    expect(screen.getByText("Tabs")).toBeInTheDocument();
  });
});

// ── 6. Command palette button ─────────────────────────────────────────────────

describe("StatusBar — command palette button", () => {
  it("renders a button with commands text", () => {
    render(<StatusBar {...baseProps} />);
    const button = screen.getByRole("button", { name: /commands/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onOpenPalette when the commands button is clicked", async () => {
    const onOpenPalette = vi.fn();
    const user = userEvent.setup();
    render(<StatusBar {...baseProps} onOpenPalette={onOpenPalette} />);
    await user.click(screen.getByRole("button", { name: /commands/i }));
    expect(onOpenPalette).toHaveBeenCalledOnce();
  });

  it("does not call onOpenPalette on render without a click", () => {
    const onOpenPalette = vi.fn();
    render(<StatusBar {...baseProps} onOpenPalette={onOpenPalette} />);
    expect(onOpenPalette).not.toHaveBeenCalled();
  });
});

// ── 7. Privacy copy ───────────────────────────────────────────────────────────

describe("StatusBar — privacy copy", () => {
  it('always renders "Processed locally" regardless of state', () => {
    const { rerender } = render(<StatusBar {...baseProps} state="valid" />);
    expect(screen.getByText("Processed locally")).toBeInTheDocument();

    rerender(<StatusBar {...baseProps} state="invalid" errorCount={1} />);
    expect(screen.getByText("Processed locally")).toBeInTheDocument();

    rerender(<StatusBar {...baseProps} state="idle" />);
    expect(screen.getByText("Processed locally")).toBeInTheDocument();
  });
});

// ── 8. Status role on the validity dot ──────────────────────────────────────────

describe("StatusBar — status role on the validity dot", () => {
  it('exposes exactly one "status" role element, on the dot, with accessible name "Valid JSON" when state is valid', () => {
    const { container } = render(<StatusBar {...baseProps} state="valid" />);
    const statusEls = screen.getAllByRole("status");
    expect(statusEls).toHaveLength(1);
    expect(statusEls[0]).toHaveClass("status-bar__dot");
    expect(statusEls[0]).toHaveAccessibleName("Valid JSON");
    // Visible text span is hidden from the accessibility tree.
    const textSpan = container.querySelector(
      ".status-bar__left > span[aria-hidden='true']",
    );
    expect(textSpan).toHaveTextContent("Valid JSON");
  });

  it('exposes exactly one "status" role element with accessible name "Ready" when state is idle', () => {
    render(<StatusBar {...baseProps} state="idle" />);
    const statusEls = screen.getAllByRole("status");
    expect(statusEls).toHaveLength(1);
    expect(statusEls[0]).toHaveAccessibleName("Ready");
  });

  it('exposes exactly one "status" role element with accessible name "Invalid JSON · 2 errors" when state is invalid', () => {
    render(<StatusBar {...baseProps} state="invalid" errorCount={2} />);
    const statusEls = screen.getAllByRole("status");
    expect(statusEls).toHaveLength(1);
    expect(statusEls[0]).toHaveAccessibleName("Invalid JSON · 2 errors");
  });

  it("does not expose a status role on the visible text span (role moved to the dot)", () => {
    render(<StatusBar {...baseProps} state="valid" />);
    const statusEls = screen.getAllByRole("status");
    expect(statusEls[0].tagName).toBe("SPAN");
    expect(statusEls[0]).toHaveClass("status-bar__dot");
    expect(statusEls[0]).not.toHaveTextContent("Valid JSON");
  });
});
