import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IdentityBar } from "./IdentityBar";

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ["dark", vi.fn()],
}));

beforeEach(() => {
  vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderBar(fileName: string | null = null, onOpenPalette = vi.fn()) {
  return {
    onOpenPalette,
    ...render(
      <IdentityBar fileName={fileName} onOpenPalette={onOpenPalette} />,
    ),
  };
}

// ── Brand mark ────────────────────────────────────────────────────────────────

describe("brand mark", () => {
  it("renders the {} brand mark", () => {
    renderBar();
    expect(screen.getByText("{}")).toBeInTheDocument();
  });

  it("renders the app name Brace", () => {
    renderBar();
    expect(screen.getByText("Brace")).toBeInTheDocument();
  });
});

// ── fileName display ──────────────────────────────────────────────────────────

describe("fileName display", () => {
  it('shows "untitled" when fileName is null', () => {
    renderBar(null);
    expect(screen.getByText("untitled")).toBeInTheDocument();
  });

  it("shows the provided file name", () => {
    renderBar("data.json");
    expect(screen.getByText("data.json")).toBeInTheDocument();
  });

  it("shows a 40-char filename without truncation", () => {
    const name = "a".repeat(40);
    renderBar(name);
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it("truncates filenames longer than 40 chars with … prefix", () => {
    const name = "a".repeat(41);
    renderBar(name);
    const expected = "…" + name.slice(-37);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("uses the last 37 chars after …", () => {
    const name = "prefix_" + "x".repeat(40);
    renderBar(name);
    const expected = "…" + name.slice(-37);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("sets title attribute to full file name", () => {
    const name = "b".repeat(50);
    renderBar(name);
    const el = screen.getByTitle(name);
    expect(el).toBeInTheDocument();
  });

  it('sets title to "untitled" when fileName is null', () => {
    renderBar(null);
    expect(screen.getByTitle("untitled")).toBeInTheDocument();
  });
});

// ── Search button ─────────────────────────────────────────────────────────────

describe("search button", () => {
  it('has aria-label "Open command palette"', () => {
    renderBar();
    expect(
      screen.getByRole("button", { name: "Open command palette" }),
    ).toBeInTheDocument();
  });

  it('shows "Search or run a command" label text', () => {
    renderBar();
    expect(screen.getByText("Search or run a command")).toBeInTheDocument();
  });

  it("calls onOpenPalette when clicked", async () => {
    const user = userEvent.setup();
    const { onOpenPalette } = renderBar();
    await user.click(
      screen.getByRole("button", { name: "Open command palette" }),
    );
    expect(onOpenPalette).toHaveBeenCalledOnce();
  });

  it("is keyboard focusable (not disabled, has no tabIndex=-1)", () => {
    renderBar();
    const btn = screen.getByRole("button", { name: "Open command palette" });
    expect(btn).not.toBeDisabled();
    expect(btn).not.toHaveAttribute("tabindex", "-1");
  });

  it("shows ⌘K or Ctrl+K kbd chip", () => {
    renderBar();
    const kbd = document.querySelector(".identity-bar__search .kbd");
    expect(kbd).not.toBeNull();
    expect(["⌘K", "Ctrl+K"]).toContain(kbd!.textContent);
  });
});

// ── ThemeToggle ───────────────────────────────────────────────────────────────

describe("ThemeToggle", () => {
  it("renders the theme toggle button", () => {
    renderBar();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("renders without crashing when fileName is empty string", () => {
    // Empty string is falsy — treated the same as null → "untitled"
    renderBar("");
    expect(screen.getByText("untitled")).toBeInTheDocument();
  });

  it("handles a filename that is exactly 41 chars", () => {
    const name = "c".repeat(41);
    renderBar(name);
    expect(screen.getByText("…" + name.slice(-37))).toBeInTheDocument();
  });

  it("handles special characters in filename", () => {
    const name = "你好世界_<>&\"'.json";
    renderBar(name);
    expect(screen.getByText(name)).toBeInTheDocument();
  });

  it("handles a very long filename (200 chars)", () => {
    const name = "z".repeat(200);
    renderBar(name);
    expect(screen.getByText("…" + name.slice(-37))).toBeInTheDocument();
  });

  it("does not call onOpenPalette on mount", () => {
    const { onOpenPalette } = renderBar();
    expect(onOpenPalette).not.toHaveBeenCalled();
  });
});
