import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AppShell } from "./AppShell";

// jsdom does not implement offsetWidth — mock it so SplitPane internals work.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1000);
  vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // Clean up any leftover data-layout attribute between tests.
  delete document.documentElement.dataset.layout;
});

function renderAppShell(modals?: React.ReactNode) {
  return render(
    <AppShell
      identityBar={<span>Identity Bar</span>}
      toolbar={<span>Toolbar</span>}
      left={<div>Left Pane</div>}
      right={<div>Right Pane</div>}
      statusBar={<span>Status Bar</span>}
      modals={modals}
    />,
  );
}

// ── Slot rendering ────────────────────────────────────────────────────────────

describe("slot rendering", () => {
  it("renders identityBar content", () => {
    renderAppShell();
    expect(screen.getByText("Identity Bar")).toBeInTheDocument();
  });

  it("renders toolbar content", () => {
    renderAppShell();
    expect(screen.getByText("Toolbar")).toBeInTheDocument();
  });

  it("renders left pane content", () => {
    renderAppShell();
    expect(screen.getByText("Left Pane")).toBeInTheDocument();
  });

  it("renders right pane content", () => {
    renderAppShell();
    expect(screen.getByText("Right Pane")).toBeInTheDocument();
  });

  it("renders statusBar content", () => {
    renderAppShell();
    expect(screen.getByText("Status Bar")).toBeInTheDocument();
  });

  it("renders modals content when provided", () => {
    renderAppShell(<div>Modal Content</div>);
    expect(screen.getByText("Modal Content")).toBeInTheDocument();
  });

  it("does not crash when modals prop is omitted", () => {
    expect(() => renderAppShell()).not.toThrow();
  });
});

// ── Root element ──────────────────────────────────────────────────────────────

describe("root element", () => {
  it("renders a root div with class app-shell", () => {
    const { container } = renderAppShell();
    expect(container.firstChild).toHaveClass("app-shell");
  });
});

// ── data-layout lifecycle ─────────────────────────────────────────────────────

describe("data-layout attribute", () => {
  it('sets data-layout="app" on document.documentElement on mount', () => {
    renderAppShell();
    expect(document.documentElement.dataset.layout).toBe("app");
  });

  it("removes data-layout from document.documentElement on unmount", () => {
    const { unmount } = renderAppShell();
    expect(document.documentElement.dataset.layout).toBe("app");
    unmount();
    expect(document.documentElement.dataset.layout).toBeUndefined();
  });
});

// ── SplitPane integration ─────────────────────────────────────────────────────

describe("SplitPane integration", () => {
  it("renders both left and right pane content via SplitPane", () => {
    renderAppShell();
    expect(screen.getByText("Left Pane")).toBeInTheDocument();
    expect(screen.getByText("Right Pane")).toBeInTheDocument();
  });

  it("renders the split handle with role=separator", () => {
    renderAppShell();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("uses defaultPct=44 so handle starts at 44%", () => {
    renderAppShell();
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-valuenow",
      "44",
    );
  });

  it("uses storageKey brace-split-ratio to persist ratio", () => {
    renderAppShell();
    // Verify the correct storage key is read on mount (returns null → uses defaultPct).
    expect(Storage.prototype.getItem).toHaveBeenCalledWith("brace-split-ratio");
  });
});
