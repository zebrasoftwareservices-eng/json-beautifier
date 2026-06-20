import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RightPane } from "./RightPane";
import type { CodeEditorError } from "./CodeEditor";

// Mock CodeEditor — render a plain textarea
vi.mock("./CodeEditor", () => ({
  CodeEditor: ({
    value,
    placeholder,
  }: {
    value: string;
    placeholder?: string;
  }) => <textarea readOnly value={value} placeholder={placeholder} />,
}));

// Mock TreeView
vi.mock("./TreeView", () => ({
  TreeView: ({ json }: { json: string }) => (
    <div data-testid="tree-view">{json}</div>
  ),
}));

function renderRightPane(
  props: Partial<React.ComponentProps<typeof RightPane>> = {},
) {
  const defaults = {
    output: "",
    activeTab: "error" as const,
    onTabChange: vi.fn(),
  };
  return render(<RightPane {...defaults} {...props} />);
}

describe("RightPane — ErrorPanel", () => {
  it("shows 'No errors — JSON is valid' when no error prop is provided", () => {
    renderRightPane({ error: null });
    expect(screen.getByText("No errors — JSON is valid")).toBeInTheDocument();
  });

  it("shows 'No errors — JSON is valid' when error is undefined", () => {
    renderRightPane({ error: undefined });
    expect(screen.getByText("No errors — JSON is valid")).toBeInTheDocument();
  });

  it("shows error message when error has no line number", () => {
    const error: CodeEditorError = { message: "Unexpected token" };
    renderRightPane({ error });
    expect(screen.getByText("Unexpected token")).toBeInTheDocument();
    expect(screen.getByText("Parse error")).toBeInTheDocument();
  });

  it("shows 'Line N, col C' heading when error has line and column", () => {
    const error: CodeEditorError = {
      message: "Unexpected token",
      line: 3,
      column: 7,
    };
    renderRightPane({ error });
    expect(screen.getByText("Line 3, col 7")).toBeInTheDocument();
  });

  it("shows 'Line N' heading when error has line but no column", () => {
    const error: CodeEditorError = { message: "Unexpected token", line: 5 };
    renderRightPane({ error });
    expect(screen.getByText("Line 5")).toBeInTheDocument();
  });

  it("shows snippet with → marker on the error line when input and line are provided", () => {
    const input = "line1\nline2\nline3\nline4\nline5";
    const error: CodeEditorError = { message: "Oops", line: 3, column: 1 };
    renderRightPane({ error, input });
    const snippet = document.querySelector(".error-panel__snippet");
    expect(snippet).toBeInTheDocument();
    expect(snippet?.textContent).toContain("→");
    expect(snippet?.textContent).toContain("3:");
  });

  it("does not show snippet when error has no line", () => {
    const input = "line1\nline2\nline3";
    const error: CodeEditorError = { message: "Oops" };
    renderRightPane({ error, input });
    expect(
      document.querySelector(".error-panel__snippet"),
    ).not.toBeInTheDocument();
  });

  it("does not show snippet when input is not provided", () => {
    const error: CodeEditorError = { message: "Oops", line: 2, column: 1 };
    renderRightPane({ error });
    expect(
      document.querySelector(".error-panel__snippet"),
    ).not.toBeInTheDocument();
  });
});

describe("RightPane — tab list", () => {
  it("renders an 'Error' tab button", () => {
    renderRightPane();
    const errorTab = screen.getByRole("tab", { name: "Error" });
    expect(errorTab).toBeInTheDocument();
  });

  it("calls onTabChange with 'error' when Error tab is clicked", async () => {
    const onTabChange = vi.fn();
    render(<RightPane output="" activeTab="tree" onTabChange={onTabChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Error" }));
    expect(onTabChange).toHaveBeenCalledWith("error");
  });

  it("renders all expected tabs: Tree, Code, Error, Table, Diff, Schema", () => {
    renderRightPane({ activeTab: "tree" });
    const tabNames = ["Tree", "Code", "Error", "Table", "Diff", "Schema"];
    for (const name of tabNames) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });
});
