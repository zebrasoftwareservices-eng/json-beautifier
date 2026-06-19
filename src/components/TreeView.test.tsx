import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TreeView } from "./TreeView";

// ── Clipboard mock ────────────────────────────────────────────────────────────

let writeTextMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeTextMock = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    writable: true,
    configurable: true,
  });

  // jsdom has no ResizeObserver — provide a no-op stub so the component mounts
  // without throwing. The containerHeight state stays at its default 400 px,
  // which is more than enough to show the small fixtures used in these tests.
  (
    globalThis as typeof globalThis & { ResizeObserver: unknown }
  ).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SIMPLE_OBJECT = JSON.stringify({ name: "Alice", age: 30, active: true });
const SIMPLE_ARRAY = JSON.stringify([1, 2, 3]);
const NESTED_OBJECT = JSON.stringify({
  person: { name: "Bob", city: "NYC" },
  score: 99,
});

// ── 1. Empty json → placeholder ───────────────────────────────────────────────

describe("empty / whitespace json", () => {
  it("renders placeholder for empty string", () => {
    render(<TreeView json="" />);
    expect(
      screen.getByText("Format JSON to explore the tree"),
    ).toBeInTheDocument();
  });

  it("renders placeholder for whitespace-only string", () => {
    render(<TreeView json="   " />);
    expect(
      screen.getByText("Format JSON to explore the tree"),
    ).toBeInTheDocument();
  });
});

// ── 2. Invalid JSON → error text ──────────────────────────────────────────────

describe("invalid JSON", () => {
  it("renders error message for malformed JSON", () => {
    render(<TreeView json="{bad json}" />);
    expect(
      screen.getByText("Fix JSON errors to view tree"),
    ).toBeInTheDocument();
  });

  it("renders error message for truncated JSON", () => {
    render(<TreeView json='{"key":' />);
    expect(
      screen.getByText("Fix JSON errors to view tree"),
    ).toBeInTheDocument();
  });
});

// ── 3. Valid simple object → root + first-level keys ─────────────────────────

describe("valid simple object", () => {
  it("renders the root row", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);
    const rows = document.querySelectorAll(".tree-row");
    // root + 3 children (root is expanded by default)
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it("renders first-level keys when root is expanded", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);
    expect(screen.getByText(/name/)).toBeInTheDocument();
    expect(screen.getByText(/age/)).toBeInTheDocument();
    expect(screen.getByText(/active/)).toBeInTheDocument();
  });
});

// ── 4. Array JSON → renders array items ──────────────────────────────────────

describe("array JSON", () => {
  it("renders array items as child rows", () => {
    render(<TreeView json={SIMPLE_ARRAY} />);
    // Root is expanded; items 1, 2, 3 should be visible
    const rows = document.querySelectorAll(".tree-row");
    // 1 root + 3 items
    expect(rows.length).toBe(4);
  });
});

// ── 5. Toggle: expand a collapsed node shows its children ────────────────────

describe("toggle expand", () => {
  it("shows children after expanding a collapsed object node", async () => {
    const user = userEvent.setup();
    render(<TreeView json={NESTED_OBJECT} />);

    // "person" key is a child of root (root expanded by default).
    // The "person" node itself is collapsed → its children (name, city) hidden.
    const expandBtns = screen.getAllByLabelText("Expand");
    await user.click(expandBtns[0]);

    expect(screen.getByText(/city/)).toBeInTheDocument();
  });
});

// ── 6. Toggle: collapse hides children ───────────────────────────────────────

describe("toggle collapse", () => {
  it("hides children after collapsing root", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const collapseBtn = screen.getByLabelText("Collapse");
    await user.click(collapseBtn);

    expect(screen.queryByText(/name/)).not.toBeInTheDocument();
    expect(screen.queryByText(/age/)).not.toBeInTheDocument();
  });
});

// ── 7. Expand all ─────────────────────────────────────────────────────────────

describe("expand all", () => {
  it("makes all nested nodes visible after clicking Expand all", async () => {
    const user = userEvent.setup();
    render(<TreeView json={NESTED_OBJECT} />);

    expect(screen.queryByText(/city/)).not.toBeInTheDocument();

    await user.click(screen.getByTitle("Expand all"));

    expect(screen.getByText(/city/)).toBeInTheDocument();
  });
});

// ── 8. Collapse all ───────────────────────────────────────────────────────────

describe("collapse all", () => {
  it("hides nested grandchildren after clicking Collapse all", async () => {
    const user = userEvent.setup();
    render(<TreeView json={NESTED_OBJECT} />);
    await user.click(screen.getByTitle("Expand all"));

    expect(screen.getByText(/city/)).toBeInTheDocument();

    await user.click(screen.getByTitle("Collapse all"));

    expect(screen.queryByText(/city/)).not.toBeInTheDocument();
  });

  it("keeps root's direct children visible after Collapse all", async () => {
    const user = userEvent.setup();
    render(<TreeView json={NESTED_OBJECT} />);
    await user.click(screen.getByTitle("Expand all"));
    await user.click(screen.getByTitle("Collapse all"));

    expect(screen.getByText(/person/)).toBeInTheDocument();
    expect(screen.getByText(/score/)).toBeInTheDocument();
  });
});

// ── 9. Search filters by key match ───────────────────────────────────────────

describe("search — key match", () => {
  it("shows only rows whose key matches the search term", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const searchInput = screen.getByRole("searchbox", { name: /search tree/i });
    await user.type(searchInput, "age");

    const rows = document.querySelectorAll(".tree-row");
    expect(rows.length).toBe(1);
    expect(screen.getByText(/age/)).toBeInTheDocument();
  });
});

// ── 10. Search filters by value match ────────────────────────────────────────

describe("search — value match", () => {
  it("shows rows whose primitive value matches the search term", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const searchInput = screen.getByRole("searchbox", { name: /search tree/i });
    await user.type(searchInput, "Alice");

    const rows = document.querySelectorAll(".tree-row");
    expect(rows.length).toBe(1);
  });
});

// ── 11. Search shows match count ──────────────────────────────────────────────

describe("search — match count", () => {
  it("displays X matches text when a search is active", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const searchInput = screen.getByRole("searchbox", { name: /search tree/i });
    await user.type(searchInput, "a");

    expect(screen.getByText(/\d+ match(es)?/)).toBeInTheDocument();
  });

  it("shows '1 match' (singular) when exactly one row matches", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const searchInput = screen.getByRole("searchbox", { name: /search tree/i });
    await user.type(searchInput, "Alice");

    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  it("shows plural 'matches' when more than one row matches", async () => {
    const user = userEvent.setup();
    const json = JSON.stringify({ foo: "bar", baz: "bar" });
    render(<TreeView json={json} />);

    const searchInput = screen.getByRole("searchbox", { name: /search tree/i });
    await user.type(searchInput, "bar");

    expect(screen.getByText("2 matches")).toBeInTheDocument();
  });
});

// ── 12. Breadcrumb updates on row hover ──────────────────────────────────────

describe("breadcrumb", () => {
  it("defaults to '$'", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);
    const breadcrumb = document.querySelector(".tree-breadcrumb");
    expect(breadcrumb).toHaveTextContent("$");
  });

  it("updates to the hovered row's JSONPath", async () => {
    const user = userEvent.setup();
    render(<TreeView json={SIMPLE_OBJECT} />);

    const rows = document.querySelectorAll(".tree-row");
    await user.hover(rows[1] as HTMLElement);

    const breadcrumb = document.querySelector(".tree-breadcrumb");
    expect(breadcrumb?.textContent).not.toBe("$");
    expect(breadcrumb?.textContent).toMatch(/^\$\./);
  });
});

// ── 13. Clipboard: Copy value ─────────────────────────────────────────────────

describe("clipboard — copy value", () => {
  it("calls clipboard.writeText with the primitive value on Copy value click", () => {
    // fireEvent is used here instead of userEvent: userEvent.setup() replaces
    // navigator.clipboard internally even with writeToClipboard:false, which
    // breaks our writeTextMock. These tests verify handler wiring, not UX fidelity.
    render(<TreeView json={SIMPLE_OBJECT} />);

    const rows = document.querySelectorAll(".tree-row");
    fireEvent.mouseEnter(rows[1]);

    fireEvent.click(screen.getByTitle("Copy value"));

    expect(writeTextMock).toHaveBeenCalledWith("Alice");
  });
});

// ── 14. Clipboard: Copy path ──────────────────────────────────────────────────

describe("clipboard — copy path", () => {
  it("calls clipboard.writeText with the JSONPath on Copy path click", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);

    const rows = document.querySelectorAll(".tree-row");
    fireEvent.mouseEnter(rows[1]);

    fireEvent.click(screen.getByTitle("Copy JSONPath"));

    expect(writeTextMock).toHaveBeenCalledWith(expect.stringMatching(/^\$\./));
  });
});
