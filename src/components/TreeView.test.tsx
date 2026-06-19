import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TreeView } from "./TreeView";

// ── Clipboard mock ────────────────────────────────────────────────────────────

beforeEach(() => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
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
  it("shows children after expanding a collapsed object node", () => {
    render(<TreeView json={NESTED_OBJECT} />);

    // "person" key is a child of root (root expanded by default).
    // The "person" node itself is collapsed → its children (name, city) hidden.
    // Find the Expand button for the "person" row.
    const expandBtns = screen.getAllByLabelText("Expand");
    // Click the first Expand button (person node)
    fireEvent.click(expandBtns[0]);

    expect(screen.getByText(/city/)).toBeInTheDocument();
  });
});

// ── 6. Toggle: collapse hides children ───────────────────────────────────────

describe("toggle collapse", () => {
  it("hides children after collapsing root", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);

    // Root is expanded; Collapse button should be on the root row
    const collapseBtn = screen.getByLabelText("Collapse");
    fireEvent.click(collapseBtn);

    // After collapsing root, first-level keys should disappear
    expect(screen.queryByText(/name/)).not.toBeInTheDocument();
    expect(screen.queryByText(/age/)).not.toBeInTheDocument();
  });
});

// ── 7. Expand all ─────────────────────────────────────────────────────────────

describe("expand all", () => {
  it("makes all nested nodes visible after clicking Expand all", () => {
    render(<TreeView json={NESTED_OBJECT} />);

    // "city" is inside the nested "person" object — not visible yet
    expect(screen.queryByText(/city/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Expand all"));

    expect(screen.getByText(/city/)).toBeInTheDocument();
  });
});

// ── 8. Collapse all ───────────────────────────────────────────────────────────

describe("collapse all", () => {
  it("hides nested grandchildren after clicking Collapse all", () => {
    // Start with NESTED_OBJECT: root → { person: { name, city }, score }
    // First expand all so grandchildren are visible
    render(<TreeView json={NESTED_OBJECT} />);
    fireEvent.click(screen.getByTitle("Expand all"));

    // "city" is a grandchild — should be visible now
    expect(screen.getByText(/city/)).toBeInTheDocument();

    // Collapse all: only root stays expanded → direct children of root visible,
    // but grandchildren (inside "person") are hidden
    fireEvent.click(screen.getByTitle("Collapse all"));

    expect(screen.queryByText(/city/)).not.toBeInTheDocument();
  });

  it("keeps root's direct children visible after Collapse all", () => {
    render(<TreeView json={NESTED_OBJECT} />);
    fireEvent.click(screen.getByTitle("Expand all"));
    fireEvent.click(screen.getByTitle("Collapse all"));

    // Root is still expanded → "person" and "score" should be present
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
    // Only the "age" row should be visible (root object is not a primitive so
    // it gets filtered out; "name" and "active" don't match "age")
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
    await user.type(searchInput, "a"); // matches "name", "age", "active", "Alice", "30" — "a" in "age","active","name","Alice"

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
    // Use a JSON where multiple values share a common substring
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

  it("updates to the hovered row's JSONPath", () => {
    render(<TreeView json={SIMPLE_OBJECT} />);

    // Hover over the first child row (one of name / age / active)
    const rows = document.querySelectorAll(".tree-row");
    // rows[1] is the first child (e.g. $.name)
    fireEvent.mouseEnter(rows[1]);

    const breadcrumb = document.querySelector(".tree-breadcrumb");
    // Path should be something like "$.name" — not the default "$"
    expect(breadcrumb?.textContent).not.toBe("$");
    expect(breadcrumb?.textContent).toMatch(/^\$\./);
  });
});

// ── 13. Clipboard: Copy value ─────────────────────────────────────────────────

describe("clipboard — copy value", () => {
  it("calls clipboard.writeText with the primitive value on Copy value click", async () => {
    render(<TreeView json={SIMPLE_OBJECT} />);

    // Hover over the "name" row to reveal action buttons
    const rows = document.querySelectorAll(".tree-row");
    fireEvent.mouseEnter(rows[1]);

    const copyValueBtn = screen.getByTitle("Copy value");
    fireEvent.click(copyValueBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Alice");
  });
});

// ── 14. Clipboard: Copy path ──────────────────────────────────────────────────

describe("clipboard — copy path", () => {
  it("calls clipboard.writeText with the JSONPath on Copy path click", async () => {
    render(<TreeView json={SIMPLE_OBJECT} />);

    const rows = document.querySelectorAll(".tree-row");
    fireEvent.mouseEnter(rows[1]);

    const copyPathBtn = screen.getByTitle("Copy JSONPath");
    fireEvent.click(copyPathBtn);

    // Should be something like "$.name"
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringMatching(/^\$\./),
    );
  });
});
