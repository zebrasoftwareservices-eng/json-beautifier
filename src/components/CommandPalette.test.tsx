import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CommandPalette, PaletteCommand } from "./CommandPalette";

// ── localStorage mock ─────────────────────────────────────────────────────────

beforeEach(() => {
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(
    (key) => store[key] ?? null,
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
    store[key] = value;
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
    delete store[key];
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const noop = () => {};

const COMMANDS: PaletteCommand[] = [
  { id: "beautify", label: "Beautify JSON", shortcut: "⌘⇧B", action: noop },
  { id: "minify", label: "Minify JSON", shortcut: "⌘⇧M", action: noop },
  { id: "repair", label: "Repair JSON", shortcut: "⌘⇧R", action: noop },
  {
    id: "disabled-cmd",
    label: "Disabled Command",
    shortcut: "⌘⇧X",
    action: noop,
    disabled: true,
  },
];

function renderPalette(open: boolean, onClose = vi.fn(), commands = COMMANDS) {
  return render(
    <CommandPalette open={open} onClose={onClose} commands={commands} />,
  );
}

// ── 1. Renders null when closed ───────────────────────────────────────────────

describe("CommandPalette — closed state", () => {
  it("renders nothing when open=false", () => {
    const { container } = renderPalette(false);
    expect(container.firstChild).toBeNull();
  });
});

// ── 2. Renders dialog when open ───────────────────────────────────────────────

describe("CommandPalette — open state", () => {
  it("renders the dialog when open=true", () => {
    renderPalette(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the search input", () => {
    renderPalette(true);
    expect(screen.getByLabelText("Search commands")).toBeInTheDocument();
  });
});

// ── 3. Renders command labels and shortcuts ───────────────────────────────────

describe("CommandPalette — command list", () => {
  it("renders all enabled command labels", () => {
    renderPalette(true);
    expect(screen.getByText("Beautify JSON")).toBeInTheDocument();
    expect(screen.getByText("Minify JSON")).toBeInTheDocument();
    expect(screen.getByText("Repair JSON")).toBeInTheDocument();
  });

  it("renders shortcut text for each enabled command", () => {
    renderPalette(true);
    expect(screen.getByText("⌘⇧B")).toBeInTheDocument();
    expect(screen.getByText("⌘⇧M")).toBeInTheDocument();
  });
});

// ── 4. Disabled commands are not shown ───────────────────────────────────────

describe("CommandPalette — disabled commands", () => {
  it("does not render disabled commands", () => {
    renderPalette(true);
    expect(screen.queryByText("Disabled Command")).not.toBeInTheDocument();
  });
});

// ── 5. Fuzzy search filters commands ─────────────────────────────────────────

describe("CommandPalette — fuzzy search", () => {
  it("typing 'min' shows only Minify JSON", async () => {
    const user = userEvent.setup();
    renderPalette(true);
    await user.type(screen.getByLabelText("Search commands"), "min");
    expect(screen.getByText("Minify JSON")).toBeInTheDocument();
    expect(screen.queryByText("Beautify JSON")).not.toBeInTheDocument();
    expect(screen.queryByText("Repair JSON")).not.toBeInTheDocument();
  });

  it("typing 'bea' shows only Beautify JSON", async () => {
    const user = userEvent.setup();
    renderPalette(true);
    await user.type(screen.getByLabelText("Search commands"), "bea");
    expect(screen.getByText("Beautify JSON")).toBeInTheDocument();
    expect(screen.queryByText("Minify JSON")).not.toBeInTheDocument();
  });
});

// ── 6. Empty search shows all enabled commands ────────────────────────────────

describe("CommandPalette — empty search", () => {
  it("shows all enabled commands when query is empty", () => {
    renderPalette(true);
    expect(screen.getByText("Beautify JSON")).toBeInTheDocument();
    expect(screen.getByText("Minify JSON")).toBeInTheDocument();
    expect(screen.getByText("Repair JSON")).toBeInTheDocument();
  });
});

// ── 7. No match message ───────────────────────────────────────────────────────

describe("CommandPalette — no match", () => {
  it("shows 'No commands match' when nothing matches the query", async () => {
    const user = userEvent.setup();
    renderPalette(true);
    await user.type(screen.getByLabelText("Search commands"), "zzzzz");
    expect(screen.getByText("No commands match")).toBeInTheDocument();
  });
});

// ── 8. Escape calls onClose ───────────────────────────────────────────────────

describe("CommandPalette — Escape key", () => {
  it("calls onClose when Escape is pressed inside the dialog panel", () => {
    const onClose = vi.fn();
    renderPalette(true, onClose);
    // The inner dialog div handles keydown
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    fireEvent.keyDown(dialogPanel, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── 9. Click overlay calls onClose ───────────────────────────────────────────

describe("CommandPalette — overlay click", () => {
  it("calls onClose when clicking the overlay backdrop", () => {
    const onClose = vi.fn();
    renderPalette(true, onClose);
    const overlay = screen.getByRole("dialog");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when clicking inside the dialog panel", () => {
    const onClose = vi.fn();
    renderPalette(true, onClose);
    fireEvent.click(screen.getByLabelText("Search commands"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── 10. Clicking a command calls its action and onClose ──────────────────────

describe("CommandPalette — command click", () => {
  it("calls the command action and onClose when a command is clicked", () => {
    const onClose = vi.fn();
    const action = vi.fn();
    const commands: PaletteCommand[] = [
      { id: "test-cmd", label: "Test Command", shortcut: "⌘T", action },
    ];
    render(
      <CommandPalette open={true} onClose={onClose} commands={commands} />,
    );
    fireEvent.click(screen.getByText("Test Command"));
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ── 11. Arrow key navigation changes active item ──────────────────────────────

describe("CommandPalette — keyboard navigation", () => {
  it("ArrowDown moves the active item to the second command", () => {
    renderPalette(true);
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(dialogPanel, { key: "ArrowDown" });

    const updatedItems = screen.getAllByRole("option");
    expect(updatedItems[1]).toHaveAttribute("aria-selected", "true");
    expect(updatedItems[0]).toHaveAttribute("aria-selected", "false");
  });

  it("ArrowUp does not go below index 0", () => {
    renderPalette(true);
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    fireEvent.keyDown(dialogPanel, { key: "ArrowUp" });
    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowDown does not exceed the last item", () => {
    const commands: PaletteCommand[] = [
      { id: "a", label: "Alpha", shortcut: "⌘A", action: noop },
      { id: "b", label: "Beta", shortcut: "⌘B", action: noop },
    ];
    render(<CommandPalette open={true} onClose={noop} commands={commands} />);
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    fireEvent.keyDown(dialogPanel, { key: "ArrowDown" });
    fireEvent.keyDown(dialogPanel, { key: "ArrowDown" });
    fireEvent.keyDown(dialogPanel, { key: "ArrowDown" });
    const items = screen.getAllByRole("option");
    expect(items[items.length - 1]).toHaveAttribute("aria-selected", "true");
  });
});

// ── 12. Enter executes the active item ───────────────────────────────────────

describe("CommandPalette — Enter key", () => {
  it("executes the active command when Enter is pressed", () => {
    const onClose = vi.fn();
    const action = vi.fn();
    const commands: PaletteCommand[] = [
      { id: "exec-cmd", label: "Exec Command", shortcut: "⌘E", action },
    ];
    render(
      <CommandPalette open={true} onClose={onClose} commands={commands} />,
    );
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    fireEvent.keyDown(dialogPanel, { key: "Enter" });
    expect(action).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("executes the second command when ArrowDown then Enter", () => {
    const onClose = vi.fn();
    const action1 = vi.fn();
    const action2 = vi.fn();
    const commands: PaletteCommand[] = [
      { id: "cmd1", label: "Command One", shortcut: "⌘1", action: action1 },
      { id: "cmd2", label: "Command Two", shortcut: "⌘2", action: action2 },
    ];
    render(
      <CommandPalette open={true} onClose={onClose} commands={commands} />,
    );
    const dialogPanel = screen
      .getByRole("dialog")
      .querySelector(".palette-dialog") as HTMLElement;
    fireEvent.keyDown(dialogPanel, { key: "ArrowDown" });
    fireEvent.keyDown(dialogPanel, { key: "Enter" });
    expect(action1).not.toHaveBeenCalled();
    expect(action2).toHaveBeenCalledTimes(1);
  });
});
