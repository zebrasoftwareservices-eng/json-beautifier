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
    expect(screen.getByText("Invalid JSON")).toBeInTheDocument();
  });

  it("shows 'Line N, Column C' location when error has line and column", () => {
    const error: CodeEditorError = {
      message: "Unexpected token",
      line: 3,
      column: 7,
    };
    renderRightPane({ error });
    expect(screen.getByText("Line 3, Column 7")).toBeInTheDocument();
  });

  it("shows 'Line N' location when error has line but no column", () => {
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

describe("RightPane — ErrorBanner action buttons", () => {
  it("calls onAutoFix when 'Fix automatically' is clicked", async () => {
    const onAutoFix = vi.fn();
    const error: CodeEditorError = { message: "Unexpected token", line: 3 };
    renderRightPane({ error, onAutoFix });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: /fix automatically/i }),
    );
    expect(onAutoFix).toHaveBeenCalledTimes(1);
  });

  it("disables 'Fix automatically' when processing is true", () => {
    const error: CodeEditorError = { message: "Unexpected token", line: 3 };
    renderRightPane({ error, processing: true });
    expect(
      screen.getByRole("button", { name: /fix automatically/i }),
    ).toBeDisabled();
  });

  it("does not disable 'Fix automatically' when processing is false or omitted", () => {
    const error: CodeEditorError = { message: "Unexpected token", line: 3 };
    renderRightPane({ error, processing: false });
    expect(
      screen.getByRole("button", { name: /fix automatically/i }),
    ).not.toBeDisabled();
  });

  it("calls onJumpToError when 'Jump to error' is clicked and error.line is set", async () => {
    const onJumpToError = vi.fn();
    const error: CodeEditorError = { message: "Unexpected token", line: 3 };
    renderRightPane({ error, onJumpToError });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /jump to error/i }));
    expect(onJumpToError).toHaveBeenCalledTimes(1);
  });

  it("disables 'Jump to error' and does not call onJumpToError when error.line is undefined", async () => {
    const onJumpToError = vi.fn();
    const error: CodeEditorError = { message: "Unexpected token" };
    renderRightPane({ error, onJumpToError });
    const jumpBtn = screen.getByRole("button", { name: /jump to error/i });
    expect(jumpBtn).toBeDisabled();

    const user = userEvent.setup();
    await user.click(jumpBtn);
    expect(onJumpToError).not.toHaveBeenCalled();
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

  it("renders all expected tabs: Tree, Code, Error, Repair, Table, Diff, Schema", () => {
    renderRightPane({ activeTab: "tree" });
    const tabNames = [
      "Tree",
      "Code",
      "Error",
      "Repair",
      "Table",
      "Diff",
      "Schema",
    ];
    for (const name of tabNames) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("adds the 'tab-btn--error' class to the Error tab button when activeTab is 'error'", () => {
    renderRightPane({ activeTab: "error" });
    const errorTab = screen.getByRole("tab", { name: "Error" });
    expect(errorTab.className).toContain("tab-btn--error");
  });

  it("does not add the 'tab-btn--error' class to the Error tab button when a different tab is active", () => {
    renderRightPane({ activeTab: "tree" });
    const errorTab = screen.getByRole("tab", { name: "Error" });
    expect(errorTab.className).not.toContain("tab-btn--error");
  });
});

describe("RightPane — RepairPanel", () => {
  it("shows 'Click Repair' hint when repairResult is null", () => {
    renderRightPane({ activeTab: "repair", repairResult: null });
    expect(
      screen.getByText(/Click Repair when JSON is invalid/i),
    ).toBeInTheDocument();
  });

  it("shows 'Click Repair' hint when repairResult is undefined", () => {
    renderRightPane({ activeTab: "repair", repairResult: undefined });
    expect(
      screen.getByText(/Click Repair when JSON is invalid/i),
    ).toBeInTheDocument();
  });

  it("shows 'Could not auto-repair' heading when repairResult.ok is false", () => {
    renderRightPane({
      activeTab: "repair",
      repairResult: { ok: false, message: "Structure is too broken." },
    });
    expect(screen.getByText("Could not auto-repair")).toBeInTheDocument();
  });

  it("shows the failure message when repairResult.ok is false", () => {
    renderRightPane({
      activeTab: "repair",
      repairResult: { ok: false, message: "Structure is too broken." },
    });
    expect(screen.getByText("Structure is too broken.")).toBeInTheDocument();
  });

  it("shows manual hints list when repair fails", () => {
    renderRightPane({
      activeTab: "repair",
      repairResult: { ok: false, message: "Still invalid." },
    });
    expect(
      screen.getByText(/Check for unclosed strings or brackets/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Remove custom extensions/i)).toBeInTheDocument();
    expect(screen.getByText(/Paste into a linter/i)).toBeInTheDocument();
  });

  it("shows 'Repaired preview' heading when repairResult.ok is true", () => {
    renderRightPane({
      activeTab: "repair",
      repairResult: {
        ok: true,
        result: '{"a":1}',
        fixes: ["Removed 1 trailing comma"],
      },
    });
    expect(screen.getByText("Repaired preview")).toBeInTheDocument();
  });

  it("renders each fix in the fixes list", () => {
    renderRightPane({
      activeTab: "repair",
      repairResult: {
        ok: true,
        result: '{"a":1}',
        fixes: [
          "Removed 1 trailing comma",
          "Removed JavaScript-style comments",
        ],
      },
    });
    expect(screen.getByText(/Removed 1 trailing comma/)).toBeInTheDocument();
    expect(
      screen.getByText(/Removed JavaScript-style comments/),
    ).toBeInTheDocument();
  });

  it("calls onAcceptRepair with repaired text when 'Accept repair' button is clicked", async () => {
    const onAcceptRepair = vi.fn();
    const repairedText = '{"a":1}';
    renderRightPane({
      activeTab: "repair",
      repairResult: {
        ok: true,
        result: repairedText,
        fixes: ["Removed 1 trailing comma"],
      },
      onAcceptRepair,
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Accept repair" }));
    expect(onAcceptRepair).toHaveBeenCalledWith(repairedText);
    expect(onAcceptRepair).toHaveBeenCalledTimes(1);
  });
});

describe("RightPane — isEmpty", () => {
  it("shows the output skeleton text when isEmpty is true", () => {
    renderRightPane({ isEmpty: true, activeTab: "error" });
    expect(screen.getByText("Formatted JSON appears here")).toBeInTheDocument();
  });

  it("does not render the normal tab panel content (tree-view) when isEmpty is true", () => {
    renderRightPane({ isEmpty: true, activeTab: "tree", output: '{"a":1}' });
    expect(screen.queryByTestId("tree-view")).not.toBeInTheDocument();
  });

  it("does not render the error panel content when isEmpty is true", () => {
    renderRightPane({ isEmpty: true, activeTab: "error", error: null });
    expect(
      screen.queryByText("No errors — JSON is valid"),
    ).not.toBeInTheDocument();
  });

  it("does not show the skeleton text when isEmpty is false", () => {
    renderRightPane({ isEmpty: false, activeTab: "error" });
    expect(
      screen.queryByText("Formatted JSON appears here"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("No errors — JSON is valid")).toBeInTheDocument();
  });

  it("does not show the skeleton text when isEmpty is omitted (default behavior)", () => {
    renderRightPane({ activeTab: "error" });
    expect(
      screen.queryByText("Formatted JSON appears here"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("No errors — JSON is valid")).toBeInTheDocument();
  });

  it("still renders all 7 tab buttons in the tab bar when isEmpty is true", () => {
    renderRightPane({ isEmpty: true, activeTab: "tree" });
    const tabNames = [
      "Tree",
      "Code",
      "Error",
      "Repair",
      "Table",
      "Diff",
      "Schema",
    ];
    for (const name of tabNames) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
  });

  it("allows switching tabs via onTabChange even while isEmpty is true", async () => {
    const onTabChange = vi.fn();
    render(
      <RightPane
        output=""
        activeTab="error"
        onTabChange={onTabChange}
        isEmpty
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "Code" }));
    expect(onTabChange).toHaveBeenCalledWith("code");
  });
});
