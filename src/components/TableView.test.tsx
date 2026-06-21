import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TableView } from "./TableView";

// ---------------------------------------------------------------------------
// Helper: build a JSON string of N objects with the given keys/values factory
// ---------------------------------------------------------------------------
function makeArrayJson(
  count: number,
  factory: (i: number) => Record<string, unknown> = (i) => ({
    id: i,
    name: `item${i}`,
  }),
): string {
  return JSON.stringify(Array.from({ length: count }, (_, i) => factory(i)));
}

// ---------------------------------------------------------------------------
// 1 & 2. Empty / whitespace / non-array states
// ---------------------------------------------------------------------------
describe("TableView — empty and invalid states", () => {
  it("shows placeholder when json prop is empty string", () => {
    render(<TableView json="" />);
    expect(
      screen.getByText("Format JSON to see the table view"),
    ).toBeInTheDocument();
  });

  it("shows placeholder when json prop is whitespace-only", () => {
    render(<TableView json="   " />);
    expect(
      screen.getByText("Format JSON to see the table view"),
    ).toBeInTheDocument();
  });

  // 2. Non-array JSON
  it("shows degradation message when JSON is an object (not an array)", () => {
    render(<TableView json='{"a":1}' />);
    expect(
      screen.getByText(/Table view requires an array/),
    ).toBeInTheDocument();
  });

  it("shows degradation message when JSON is a string primitive", () => {
    render(<TableView json='"hello"' />);
    expect(
      screen.getByText(/Table view requires an array/),
    ).toBeInTheDocument();
  });

  it("shows degradation message when JSON is a number primitive", () => {
    render(<TableView json="42" />);
    expect(
      screen.getByText(/Table view requires an array/),
    ).toBeInTheDocument();
  });

  // 3. Array of primitives
  it("shows degradation message for an array of primitives", () => {
    render(<TableView json="[1, 2, 3]" />);
    expect(screen.getByText(/array of primitives/)).toBeInTheDocument();
  });

  it("shows degradation message for an array of strings", () => {
    render(<TableView json='["a","b","c"]' />);
    expect(screen.getByText(/array of primitives/)).toBeInTheDocument();
  });

  // 4. Empty array
  it("shows empty array message for []", () => {
    render(<TableView json="[]" />);
    expect(screen.getByText(/Empty array/)).toBeInTheDocument();
  });

  // Invalid / unparseable JSON
  it("shows valid-JSON-required message when JSON is malformed", () => {
    render(<TableView json="{not: valid}" />);
    expect(
      screen.getByText(/Table view requires valid JSON/),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5 & 6. Valid array of objects renders table with correct headers and cells
// ---------------------------------------------------------------------------
describe("TableView — table rendering", () => {
  const data = JSON.stringify([
    { name: "Alice", age: 30, city: "NYC" },
    { name: "Bob", age: 25, city: "LA" },
  ]);

  it("renders a <table> element for a valid array of objects", () => {
    render(<TableView json={data} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("renders column headers from union of all object keys", () => {
    render(<TableView json={data} />);
    expect(
      screen.getByRole("columnheader", { name: /^name$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^age$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^city$/i }),
    ).toBeInTheDocument();
  });

  it("renders correct cell values in the table body", () => {
    render(<TableView json={data} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("NYC")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("LA")).toBeInTheDocument();
  });

  it("renders columns from union of all keys across sparse objects", () => {
    const sparse = JSON.stringify([{ a: 1 }, { b: 2 }]);
    render(<TableView json={sparse} />);
    expect(
      screen.getByRole("columnheader", { name: /^a$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /^b$/i }),
    ).toBeInTheDocument();
  });

  it("renders empty string for null cell values", () => {
    const json = JSON.stringify([{ a: 1, b: null }, { a: 2 }]);
    render(<TableView json={json} />);
    const cells = screen.getAllByRole("cell");
    const values = cells.map((c) => c.textContent);
    expect(values).toContain("1");
    expect(values).toContain("2");
    // null and undefined → "" (empty string)
    expect(values.filter((v) => v === "").length).toBeGreaterThanOrEqual(2);
  });

  it("JSON-stringifies nested object values in cells", () => {
    const nested = JSON.stringify([{ meta: { x: 1 } }]);
    render(<TableView json={nested} />);
    expect(screen.getByText('{"x":1}')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7, 8 & 9. Sorting
// ---------------------------------------------------------------------------
describe("TableView — sorting", () => {
  const data = JSON.stringify([
    { name: "Charlie", score: 10 },
    { name: "Alice", score: 30 },
    { name: "Bob", score: 20 },
  ]);

  function getColumnValues(columnIndex: number): string[] {
    return screen
      .getAllByRole("row")
      .slice(1) // skip header row
      .map((row) => row.querySelectorAll("td")[columnIndex]?.textContent ?? "");
  }

  // 7. Clicking a column header sorts ascending
  it("clicking a column header sorts rows ascending by that column", () => {
    render(<TableView json={data} />);
    fireEvent.click(screen.getByRole("columnheader", { name: /^name/i }));
    expect(getColumnValues(0)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  // 8. Clicking same header again sorts descending
  it("clicking the same header again sorts descending", () => {
    render(<TableView json={data} />);
    const nameHeader = screen.getByRole("columnheader", { name: /^name/i });
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc
    expect(getColumnValues(0)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  // 9. Clicking a different header resets to ascending on that column
  it("clicking a different header resets sort to ascending on that column", () => {
    render(<TableView json={data} />);
    const nameHeader = screen.getByRole("columnheader", { name: /^name/i });
    const scoreHeader = screen.getByRole("columnheader", { name: /^score/i });

    fireEvent.click(nameHeader); // asc on name
    fireEvent.click(nameHeader); // desc on name
    fireEvent.click(scoreHeader); // asc on score (reset direction)

    expect(getColumnValues(1)).toEqual(["10", "20", "30"]);
  });
});

// ---------------------------------------------------------------------------
// 10. Pagination: > 50 rows shows controls; clicking → advances page
// ---------------------------------------------------------------------------
describe("TableView — pagination", () => {
  it("does NOT show pagination controls when rows ≤ 50", () => {
    const json = makeArrayJson(50);
    render(<TableView json={json} />);
    expect(screen.queryByLabelText("Next page")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Previous page")).not.toBeInTheDocument();
  });

  it("shows pagination controls when rows > 50", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
  });

  it("shows page info text (Page 1 / N) when paginated", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    expect(screen.getByText(/Page 1 \/ 2/)).toBeInTheDocument();
  });

  it("clicking → advances to page 2 and updates page info", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.getByText(/Page 2 \/ 2/)).toBeInTheDocument();
  });

  it("previous page button is disabled on page 1", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("next page button is disabled on last page", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("clicking ← returns to page 1", () => {
    const json = makeArrayJson(51);
    render(<TableView json={json} />);
    fireEvent.click(screen.getByLabelText("Next page"));
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(screen.getByText(/Page 1 \/ 2/)).toBeInTheDocument();
  });

  it("page 1 shows first 50 rows; page 2 shows remaining rows", () => {
    const json = makeArrayJson(55, (i) => ({ id: i }));
    render(<TableView json={json} />);

    // Page 1: rows 0–49
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByText("50")).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next page"));

    // Page 2: rows 50–54
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("TableView — edge cases", () => {
  it("handles large input (1 000 objects) without crashing", () => {
    const json = makeArrayJson(1000, (i) => ({ id: i, value: `v${i}` }));
    render(<TableView json={json} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText(/1000 rows/)).toBeInTheDocument();
  });

  it("renders special characters in cell values as plain text", () => {
    const json = JSON.stringify([{ text: '<script>alert("xss")</script>' }]);
    render(<TableView json={json} />);
    expect(
      screen.getByText('<script>alert("xss")</script>'),
    ).toBeInTheDocument();
  });

  it("handles unicode characters in keys and values", () => {
    const json = JSON.stringify([{ 名前: "太郎", emoji: "✓" }]);
    render(<TableView json={json} />);
    expect(screen.getByText("太郎")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("filters out non-object entries from a mixed array", () => {
    // hasObjects is true → renders table using only the object rows
    const json = JSON.stringify([{ a: 1 }, 42, { a: 2 }, null]);
    render(<TableView json={json} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
