import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";
import { processJson } from "./worker/jsonLogic";
import { repairJson } from "./worker/jsonRepair";
import { SAMPLE_JSON } from "./components/ActionBar";
import type { RepairResult } from "./components/RightPane";

// Mock useJsonWorker to use the pure processJson/repairJson functions directly,
// avoiding Worker instantiation which is not available in jsdom.
vi.mock("./worker/useJsonWorker", () => ({
  useJsonWorker: () => ({
    process: (
      type: "beautify" | "minify" | "validate" | "repair",
      input: string,
      indent = 2,
    ) => {
      if (type === "repair") {
        return Promise.resolve(repairJson(input));
      }
      return Promise.resolve(processJson(type, input, indent));
    },
  }),
}));

// Mock CodeEditor so tests don't need a real CodeMirror DOM environment.
// Renders a plain textarea that mirrors value/onChange, identified by data-testid.
// Also renders a hidden button that tests can click to fire the onPaste callback.
vi.mock("./components/CodeEditor", () => ({
  CodeEditor: ({
    value,
    onChange,
    onPaste,
    readOnly,
    placeholder,
  }: {
    value: string;
    onChange?: (v: string) => void;
    onPaste?: (v: string) => void;
    readOnly?: boolean;
    placeholder?: string;
  }) => (
    <>
      <textarea
        data-testid={readOnly ? "output-editor" : "input-editor"}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
      {!readOnly && (
        <button
          data-testid="trigger-paste"
          style={{ display: "none" }}
          onClick={() => onPaste && onPaste(value)}
        >
          trigger-paste
        </button>
      )}
    </>
  ),
}));

// Mock SplitPane — just render left then right children.
vi.mock("./components/SplitPane", () => ({
  SplitPane: ({
    left,
    right,
  }: {
    left: React.ReactNode;
    right: React.ReactNode;
  }) => (
    <div>
      {left}
      {right}
    </div>
  ),
}));

// Mock RightPane — always render a single output textarea so the reference
// stays stable across activeTab changes, plus expose a Code tab button and
// repair-related UI for testing.
vi.mock("./components/RightPane", () => ({
  RightPane: ({
    output,
    activeTab,
    onTabChange,
    repairResult,
    onAcceptRepair,
  }: {
    output: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
    repairResult?: RepairResult | null;
    onAcceptRepair?: (text: string) => void;
  }) => (
    <div>
      <button onClick={() => onTabChange("code")}>Code</button>
      <span data-testid="active-tab">{activeTab}</span>
      <textarea
        data-testid="output-editor"
        readOnly
        value={output}
        onChange={() => {}}
      />
      {repairResult === null || repairResult === undefined ? (
        <span data-testid="repair-empty">
          Click Repair when JSON is invalid
        </span>
      ) : repairResult.ok ? (
        <div data-testid="repair-success">
          <ul data-testid="repair-fixes">
            {repairResult.fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <button onClick={() => onAcceptRepair?.(repairResult.result)}>
            Accept repair
          </button>
        </div>
      ) : (
        <div data-testid="repair-fail">
          <span>Could not auto-repair</span>
          <span data-testid="repair-message">{repairResult.message}</span>
        </div>
      )}
    </div>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

// Helper: render App and return commonly used handles.
function setup() {
  const user = userEvent.setup();
  render(<App />, { wrapper });
  const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
  const outputArea = screen.getByTestId("output-editor") as HTMLTextAreaElement;
  const formatBtn = screen.getByRole("button", { name: "Format" });
  const minifyBtn = screen.getByRole("button", { name: "Minify" });
  return { user, inputArea, outputArea, formatBtn, minifyBtn };
}

// Helper to fire a change event on a textarea without userEvent key parsing.
function setInput(textarea: HTMLTextAreaElement, value: string) {
  fireEvent.change(textarea, { target: { value } });
}

const validJson = '{"name":"Alice","age":30}';

describe("Format (beautify)", () => {
  it("formats valid JSON with 2-space indent by default", async () => {
    const { user, inputArea, outputArea, formatBtn } = setup();

    setInput(inputArea, validJson);
    await user.click(formatBtn);

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 2),
    );
  });

  it("formats valid JSON with 4-space indent when selected", async () => {
    const { user, inputArea, outputArea, formatBtn } = setup();

    await user.click(screen.getByRole("radio", { name: "4" }));
    setInput(inputArea, validJson);
    await user.click(formatBtn);

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 4),
    );
  });

  it("shows an error banner for invalid JSON", async () => {
    const { user, inputArea, formatBtn } = setup();

    setInput(inputArea, "not valid json");
    await user.click(formatBtn);

    const banner = document.querySelector(".error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toBeTruthy();
  });

  it("clears output when input becomes invalid after a previous valid run", async () => {
    const { user, inputArea, outputArea, formatBtn } = setup();

    setInput(inputArea, validJson);
    await user.click(formatBtn);
    expect(outputArea.value).not.toBe("");

    setInput(inputArea, "{bad}");
    await user.click(formatBtn);

    expect(outputArea.value).toBe("");
  });
});

describe("Minify", () => {
  it("compacts valid JSON to a single line", async () => {
    const { user, inputArea, outputArea, minifyBtn } = setup();

    const prettyJson = '{\n  "name": "Alice",\n  "age": 30\n}';
    setInput(inputArea, prettyJson);
    await user.click(minifyBtn);

    expect(outputArea.value).toBe('{"name":"Alice","age":30}');
  });

  it("shows an error banner for invalid JSON", async () => {
    const { user, inputArea, minifyBtn } = setup();

    setInput(inputArea, "not valid json");
    await user.click(minifyBtn);

    const banner = document.querySelector(".error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toBeTruthy();
  });
});

describe("Sample button", () => {
  it("loads sample JSON into the input editor", async () => {
    const { user, inputArea } = setup();

    const sampleBtn = screen.getByRole("button", { name: "Try sample JSON" });
    await user.click(sampleBtn);

    expect(inputArea.value).toBe(SAMPLE_JSON);
  });
});

describe("Clear button", () => {
  it("clears input and output after a format run", async () => {
    const { user, inputArea, outputArea, formatBtn } = setup();

    setInput(inputArea, validJson);
    await user.click(formatBtn);
    expect(outputArea.value).not.toBe("");

    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    await act(async () => {
      await user.click(clearBtn); // arm
      await user.click(clearBtn); // confirm
    });

    expect(inputArea.value).toBe("");
    expect(outputArea.value).toBe("");
  });

  it("also clears any error banner", async () => {
    const { user, inputArea, formatBtn } = setup();

    setInput(inputArea, "bad json");
    await user.click(formatBtn);
    expect(document.querySelector(".error-banner")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    await user.click(clearBtn); // arm
    await user.click(clearBtn); // confirm

    expect(document.querySelector(".error-banner")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// JSO-9: Auto-format on paste, keyboard shortcut Cmd/Ctrl+Shift+F
// ---------------------------------------------------------------------------

describe("Auto-format on paste", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-formats pasted JSON after 300 ms debounce when autoFormat is on", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;
    const triggerPaste = screen.getByTestId("trigger-paste");

    // Set valid JSON into the input so the mock's `value` prop is updated
    fireEvent.change(inputArea, { target: { value: validJson } });

    // Fire the paste callback via the hidden trigger button
    fireEvent.click(triggerPaste);

    // Output should still be empty before the debounce fires
    expect(outputArea.value).toBe("");

    // Advance past the 300 ms debounce and flush promises
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 2),
    );
  });

  it("does NOT auto-format when autoFormat is toggled off", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;
    const triggerPaste = screen.getByTestId("trigger-paste");

    // Disable the auto-format toggle using fireEvent (avoids userEvent+fakeTimers deadlock)
    const autoToggle = screen.getByRole("switch", { name: /auto-format/i });
    fireEvent.click(autoToggle);
    expect(autoToggle.getAttribute("aria-checked")).toBe("false");

    fireEvent.change(inputArea, { target: { value: validJson } });
    fireEvent.click(triggerPaste);

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Output must remain empty — paste should not have triggered a format
    expect(outputArea.value).toBe("");
  });

  it("does not format before the 300 ms debounce window elapses", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;
    const triggerPaste = screen.getByTestId("trigger-paste");

    fireEvent.change(inputArea, { target: { value: validJson } });
    fireEvent.click(triggerPaste);

    // Advance only 299 ms — debounce should NOT have fired yet
    await act(async () => {
      vi.advanceTimersByTime(299);
    });

    expect(outputArea.value).toBe("");
  });
});

describe("Keyboard shortcut Cmd/Ctrl+Shift+F → Format", () => {
  it("formats the current input when Ctrl+Shift+F is pressed", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;

    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, key: "F" });
    });

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 2),
    );
  });

  it("formats the current input when Meta+Shift+F (Cmd on Mac) is pressed", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;

    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { metaKey: true, shiftKey: true, key: "F" });
    });

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 2),
    );
  });

  it("does NOT trigger format when Shift+F is pressed without Ctrl/Meta", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;

    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { shiftKey: true, key: "F" });
    });

    expect(outputArea.value).toBe("");
  });
});

// ---------------------------------------------------------------------------
// JSO-12: Auto-validate debounce
// ---------------------------------------------------------------------------

describe("Auto-validate debounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows valid status in status bar after typing valid JSON and 300ms", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });

  it("shows line count and encoding stats in status bar for valid JSON", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/\d+ lines?/);
    expect(statusBar?.textContent).toMatch(/UTF-8/);
  });

  it("shows invalid status in status bar after typing invalid JSON and 300ms", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "not valid" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Invalid JSON/);
  });

  it("does NOT validate before the 300ms debounce window elapses", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(299);
    });

    const statusBar = document.querySelector(".status-bar");
    // Should still show "Ready" — validate hasn't fired yet
    expect(statusBar?.textContent).toMatch(/Ready/);
  });
});

// ---------------------------------------------------------------------------
// JSO-12: Keyboard shortcut Cmd/Ctrl+Shift+V → Validate
// ---------------------------------------------------------------------------

describe("Keyboard shortcut Cmd/Ctrl+Shift+V → Validate", () => {
  it("validates immediately with Ctrl+Shift+V (no debounce wait)", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, key: "V" });
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });

  it("validates immediately with Meta+Shift+V (Cmd on Mac)", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { metaKey: true, shiftKey: true, key: "V" });
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });

  it("does NOT validate when Shift+V is pressed without Ctrl/Meta", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { shiftKey: true, key: "V" });
    });

    const statusBar = document.querySelector(".status-bar");
    // Status should remain "Ready" — no validate triggered
    expect(statusBar?.textContent).toMatch(/Ready/);
  });
});

// ---------------------------------------------------------------------------
// JSO-12: Tab switching on validation
// ---------------------------------------------------------------------------

describe("Tab switching on validation result", () => {
  it("switches activeTab to 'error' when invalid JSON is validated via keyboard shortcut", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, "bad json");

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, key: "V" });
    });

    const activeTab = screen.getByTestId("active-tab");
    expect(activeTab.textContent).toBe("error");
  });

  it("does NOT switch to error tab when valid JSON is validated", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, validJson);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, key: "V" });
    });

    const activeTab = screen.getByTestId("active-tab");
    expect(activeTab.textContent).not.toBe("error");
  });
});

// ---------------------------------------------------------------------------
// JSO-12: handleClear and handleSample reset validation state
// ---------------------------------------------------------------------------

describe("handleClear resets validation state", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Ready in status bar after Clear, even if validation was shown", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);

    // Use fireEvent (synchronous) to avoid userEvent+advanceTimers deadlock.
    // Two separate acts so React re-renders between arm and confirm clicks.
    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    await act(async () => {
      fireEvent.click(clearBtn); // arm
    });
    await act(async () => {
      fireEvent.click(clearBtn); // confirm
    });

    expect(statusBar?.textContent).toMatch(/Ready/);
  });
});

describe("handleSample resets validation state", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Ready in status bar after Sample (Sample is only reachable with empty input, which is already idle)", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Ready/);

    const sampleBtn = screen.getByRole("button", { name: "Try sample JSON" });
    await act(async () => {
      fireEvent.click(sampleBtn);
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Sample JSON is valid — status transitions from idle to Valid.
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });
});

// ---------------------------------------------------------------------------
// JSO-13: Repair feature
// ---------------------------------------------------------------------------

describe("Repair button enabled/disabled state", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("Repair button is disabled when input is empty (idle state)", () => {
    render(<App />, { wrapper });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    expect(repairBtn).toBeDisabled();
  });

  it("Repair button is disabled when input is valid JSON (after debounce)", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: '{"a":1}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    expect(repairBtn).toBeDisabled();
  });

  it("Repair button is enabled when input is invalid JSON (after debounce)", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "not valid json" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    expect(repairBtn).not.toBeDisabled();
  });
});

describe("Repair button click behavior", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("clicking Repair with invalid JSON switches activeTab to 'repair'", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "not valid json" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("active-tab").textContent).toBe("repair");
  });

  it("clicking Repair with fixable JSON (trailing comma) shows fixes in right pane", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: '{"a":1,}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("repair-success")).toBeInTheDocument();
    expect(screen.getByTestId("repair-fixes").textContent).toMatch(
      /trailing comma/i,
    );
    expect(screen.getByTestId("active-tab").textContent).toBe("repair");
  });

  it("clicking Repair with irreparably broken JSON shows failure state", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "{{{{" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("repair-fail")).toBeInTheDocument();
    expect(screen.getByText("Could not auto-repair")).toBeInTheDocument();
  });

  it("clicking 'Accept repair' updates input editor and switches to 'tree' tab", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: '{"a":1,}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("repair-success")).toBeInTheDocument();
    const acceptBtn = screen.getByRole("button", { name: /accept repair/i });
    await act(async () => {
      fireEvent.click(acceptBtn);
    });
    expect(screen.getByTestId("active-tab").textContent).toBe("tree");
    // input should now be the repaired (valid) JSON
    expect(inputArea.value).not.toContain(",}");
  });

  it("Clear button resets repairResult (repair panel shows empty state)", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: '{"a":1,}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("repair-success")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    await act(async () => {
      fireEvent.click(clearBtn); // arm
    });
    await act(async () => {
      fireEvent.click(clearBtn); // confirm
    });
    expect(screen.getByTestId("repair-empty")).toBeInTheDocument();
  });

  it("editing input after a successful repair clears the repair result", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: '{"a":1,}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    const repairBtn = screen.getByRole("button", { name: /repair/i });
    await act(async () => {
      fireEvent.click(repairBtn);
    });
    expect(screen.getByTestId("repair-success")).toBeInTheDocument();

    // Now edit the input — stale repair should be cleared
    await act(async () => {
      fireEvent.change(inputArea, { target: { value: '{"b":2,}' } });
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByTestId("repair-empty")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// JSO-11: Load URL feature
// ---------------------------------------------------------------------------

describe("Keyboard shortcut Cmd/Ctrl+L → Load from URL", () => {
  it("opens the Load URL dialog when Ctrl+L is pressed", async () => {
    render(<App />, { wrapper });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "l" });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens the Load URL dialog when Meta+L (Cmd on Mac) is pressed", async () => {
    render(<App />, { wrapper });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { metaKey: true, key: "l" });
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does NOT open the Load URL dialog when 'l' is pressed without Ctrl/Meta", async () => {
    render(<App />, { wrapper });

    await act(async () => {
      fireEvent.keyDown(window, { key: "l" });
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("Load URL feature", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Load URL button is visible and enabled", () => {
    render(<App />, { wrapper });
    const btn = screen.getByRole("button", { name: /load from url/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("clicking Load URL button opens the dialog", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /load from url/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Cancel button closes the dialog", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submitting invalid scheme URL shows error banner without fetching", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, { target: { value: "file:///etc/passwd" } });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /not allowed|scheme/i,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("valid URL returning 200 + valid JSON loads text into input and closes dialog", async () => {
    const jsonText = '{"hello":"world"}';
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        body: mockBodyReader(jsonText),
      }),
    );

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/data.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await waitFor(() => expect(inputArea.value).toBe(jsonText));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("URL returning HTTP 404 shows HTTP 404 error banner", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => null },
        text: () => Promise.resolve("Not Found"),
      }),
    );

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/missing.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /HTTP 404/,
    );
  });

  it("fetch TypeError with navigator.onLine=false shows Network error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    vi.stubGlobal("navigator", { ...navigator, onLine: false });

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/data.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /network error/i,
    );
  });

  it("fetch TypeError with navigator.onLine=true shows CORS restriction message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    vi.stubGlobal("navigator", { ...navigator, onLine: true });

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/data.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /CORS/i,
    );
  });

  it("URL with content-length > 1MB shows too large error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: (h: string) => (h === "content-length" ? "1100000" : null),
        },
        text: () => Promise.resolve("{}"),
      }),
    );

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/huge.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /too large/i,
    );
  });

  it("URL returning 200 but non-JSON body shows non-JSON response error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        body: mockBodyReader("<html>not json</html>"),
      }),
    );

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/page.html" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /non-JSON response/i,
    );
  });

  it("URL without content-length but body > 1MB shows too large error", async () => {
    const oversized = "a".repeat(1_000_001);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => null },
        body: mockBodyReader(oversized),
      }),
    );

    const user = userEvent.setup();
    render(<App />, { wrapper });
    await user.click(screen.getByRole("button", { name: /load from url/i }));

    const urlInput = screen.getByRole("textbox", { name: "URL" });
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/chunked.json" },
    });
    await user.click(screen.getByRole("button", { name: "Load" }));

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /too large/i,
    );
  });
});

// ---------------------------------------------------------------------------
// JSO-14: Download button
// ---------------------------------------------------------------------------

describe("Download button", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("Download button is visible and enabled when there is input", () => {
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    setInput(inputArea, validJson);
    const btn = screen.getByRole("button", { name: /download/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("Download button triggers a file download with filename output.json when no file is loaded", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper });

    const { inputArea, outputArea, formatBtn } = {
      inputArea: screen.getByTestId("input-editor") as HTMLTextAreaElement,
      outputArea: screen.getByTestId("output-editor") as HTMLTextAreaElement,
      formatBtn: screen.getByRole("button", { name: "Format" }),
    };

    setInput(inputArea, validJson);
    await user.click(formatBtn);
    // Wait for output to be populated by the async process mock
    await waitFor(() => expect(outputArea.value).not.toBe(""));

    // Mock URL APIs and capture the created anchor
    const mockUrl = "blob:http://localhost/mock-uuid";
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => mockUrl),
        revokeObjectURL: vi.fn(),
      }),
    );

    const clickSpy = vi.fn();
    const mockAnchor = {
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement;

    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return mockAnchor;
        return document.createElement(tag);
      });

    const downloadBtn = screen.getByRole("button", { name: /download/i });
    await user.click(downloadBtn);

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(mockAnchor.download).toBe("output.json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("Download button does nothing (no anchor created) when output is empty", async () => {
    render(<App />, { wrapper });

    const createElementSpy = vi.spyOn(document, "createElement");
    const downloadBtn = screen.getByRole("button", { name: /download/i });

    // output is empty — click should be a no-op
    fireEvent.click(downloadBtn);

    // createElement("a") should NOT have been called
    const aCalls = createElementSpy.mock.calls.filter(([tag]) => tag === "a");
    expect(aCalls).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// JSO-14: Status bar enhancements
// ---------------------------------------------------------------------------

describe("Status bar — file size label", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows file size in status bar when input has content (after debounce)", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    // ~100 B of content
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    // sizeLabel should contain a size unit: "B", "KB", or "MB"
    expect(statusBar?.textContent).toMatch(/\d+(\.\d+)? (B|KB|MB)/);
  });

  it("shows 'Processed locally' trust signal for valid JSON", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Processed locally/);
  });
});

// ---------------------------------------------------------------------------
// JSO-14: Memory warning banner
// ---------------------------------------------------------------------------

describe("Memory warning banner", () => {
  it("does NOT show memory-warning when input is small", () => {
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });
    expect(document.querySelector(".memory-warning")).not.toBeInTheDocument();
  });

  it("appears when input length exceeds 10 MB (10_000_000 chars)", () => {
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    // Use a string longer than 10_000_000 characters
    const hugeInput = "x".repeat(10_000_001);
    fireEvent.change(inputArea, { target: { value: hugeInput } });
    expect(document.querySelector(".memory-warning")).toBeInTheDocument();
  });

  it("memory-warning disappears after Clear", () => {
    render(<App />, { wrapper });
    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "x".repeat(10_000_001) } });
    expect(document.querySelector(".memory-warning")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    act(() => {
      fireEvent.click(clearBtn);
    }); // arm
    act(() => {
      fireEvent.click(clearBtn);
    }); // confirm

    expect(document.querySelector(".memory-warning")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// JSO-39: Error tab auto-switch on invalid JSON
// ---------------------------------------------------------------------------

describe("Error tab auto-switch on invalid JSON", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("automatically switches activeTab to 'error' once JSON becomes invalid, without clicking the Error tab or using a shortcut", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "not valid json" } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId("active-tab").textContent).toBe("error");
  });

  it("does not force the tab back to 'error' on a re-validate while JSON stays invalid, so it doesn't fight manual navigation", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: "not valid json" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("active-tab").textContent).toBe("error");

    // Manually navigate away from the error tab
    const codeBtn = screen.getByRole("button", { name: "Code" });
    await act(async () => {
      fireEvent.click(codeBtn);
    });
    expect(screen.getByTestId("active-tab").textContent).toBe("code");

    // Edit the input again — JSON remains invalid, re-validation fires again
    fireEvent.change(inputArea, { target: { value: "still not valid json" } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Should stay on 'code' — this is a transition-triggered effect, not a
    // "stay on error while invalid" effect.
    expect(screen.getByTestId("active-tab").textContent).toBe("code");
  });

  it("does not switch to the error tab when JSON becomes valid", async () => {
    vi.useFakeTimers();
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    fireEvent.change(inputArea, { target: { value: validJson } });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByTestId("active-tab").textContent).not.toBe("error");
  });
});

// ---------------------------------------------------------------------------
// JSO-39: Ctrl+R / Cmd+R → handleAutoFix ("Fix automatically")
// ---------------------------------------------------------------------------

describe("Keyboard shortcut Ctrl+R / Cmd+R → Fix automatically (handleAutoFix)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // handleAutoFix only runs once validationStatus is actually "invalid"
  // (guards against silently "fixing" already-valid JSON) — wait for the
  // 300ms debounced auto-validate before firing the shortcut.
  async function typeInvalidAndWait(inputArea: HTMLTextAreaElement) {
    vi.useFakeTimers();
    fireEvent.change(inputArea, { target: { value: '{"a":1,}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
  }

  it("repairs invalid JSON with a trailing comma, applies the repaired text to the input, and validates it as valid", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "r" });
    });

    expect(inputArea.value).not.toContain(",}");
    expect(JSON.parse(inputArea.value)).toEqual({ a: 1 });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });

  it("switches activeTab to 'tree' after a successful auto-fix", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    // Move off "tree" first so the assertion below proves the auto-fix
    // itself switched the tab, rather than it never having left "tree".
    fireEvent.click(screen.getByText("Code"));
    expect(screen.getByTestId("active-tab").textContent).toBe("code");

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "r" });
    });

    expect(screen.getByTestId("active-tab").textContent).toBe("tree");
  });

  it("also works with Meta+R (Cmd on Mac)", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    await act(async () => {
      fireEvent.keyDown(window, { metaKey: true, key: "r" });
    });

    expect(inputArea.value).not.toContain(",}");
    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
  });

  it("does NOT trigger when 'r' is pressed without Ctrl/Meta", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    await act(async () => {
      fireEvent.keyDown(window, { key: "r" });
    });

    expect(inputArea.value).toBe('{"a":1,}');
  });

  it("is distinct from Ctrl+Shift+R, which still opens the Repair preview tab instead of auto-fixing in place", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, shiftKey: true, key: "R" });
    });

    // Ctrl+Shift+R opens the repair-preview tab and leaves the input unchanged
    expect(screen.getByTestId("active-tab").textContent).toBe("repair");
    expect(inputArea.value).toBe('{"a":1,}');
  });

  it("does NOT flip valid JSON to an error state (guards against auto-fixing already-valid input)", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    vi.useFakeTimers();
    fireEvent.change(inputArea, { target: { value: '{"a":1}' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const statusBar = document.querySelector(".status-bar");
    expect(statusBar?.textContent).toMatch(/Valid JSON/);

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "r" });
    });

    expect(inputArea.value).toBe('{"a":1}');
    expect(statusBar?.textContent).toMatch(/Valid JSON/);
    expect(statusBar?.textContent).not.toMatch(/Invalid JSON/);
  });

  it("does not fire while the command palette is open (avoids silently mutating input behind a modal)", async () => {
    render(<App />, { wrapper });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await typeInvalidAndWait(inputArea);

    // Open the command palette (Ctrl+K)
    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "k" });
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { ctrlKey: true, key: "r" });
    });

    // Input must be untouched — the shortcut should not have reached handleAutoFix
    expect(inputArea.value).toBe('{"a":1,}');
  });
});

// ---------------------------------------------------------------------------
// JSO-14: Table View tab (via RightPane mock — tests activeTab switch)
// ---------------------------------------------------------------------------

describe("Table View tab", () => {
  it("clicking Code tab switches activeTab to 'code'", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper });

    const codeBtn = screen.getByRole("button", { name: "Code" });
    await user.click(codeBtn);
    expect(screen.getByTestId("active-tab").textContent).toBe("code");
  });
});

// ---------------------------------------------------------------------------
// JSO-11: mock a ReadableStream body from a plain string
// ---------------------------------------------------------------------------
function mockBodyReader(text: string) {
  const encoder = new TextEncoder();
  const chunk = encoder.encode(text);
  let done = false;
  return {
    getReader: () => ({
      read: () =>
        Promise.resolve(
          done
            ? ({ done: true, value: undefined } as const)
            : (() => {
                done = true;
                return { done: false, value: chunk };
              })(),
        ),
      cancel: () => Promise.resolve(),
    }),
  };
}

// ---------------------------------------------------------------------------
// JSO-10: FileReader mock helper
// ---------------------------------------------------------------------------
function mockFileReader(text: string, error = false) {
  const mockReader = {
    readAsText: vi.fn(() => {
      setTimeout(() => {
        if (error) {
          mockReader.onerror?.();
        } else {
          mockReader.result = text;
          mockReader.onload?.();
        }
      }, 0);
    }),
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onprogress: null as ((e: ProgressEvent) => void) | null,
    result: null as string | null,
  };
  // Vitest 4.x requires the stubbed global constructor to be a real function/class
  function MockFileReader() {
    return mockReader;
  }
  vi.stubGlobal("FileReader", MockFileReader);
  return mockReader;
}

function makeFile(
  name: string,
  content: string,
  type = "application/json",
): File {
  return new File([content], name, { type });
}

// ---------------------------------------------------------------------------
// Upload button / file picker
// ---------------------------------------------------------------------------
describe("Upload button / file picker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hidden file input exists with correct accept attribute", () => {
    render(<App />, { wrapper });
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput.accept).toBe(".json,.txt,.jsonl");
    expect(fileInput).not.toBeVisible();
  });

  it("clicking Upload in the empty state opens the file picker (JSO-34 regression)", async () => {
    const user = userEvent.setup();
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    const uploadBtn = screen.getByRole("button", { name: "Upload file" });
    await user.click(uploadBtn);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("selecting a .json file loads content into input and shows file name in header", async () => {
    mockFileReader('{"hello":"world"}');
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile("data.json", '{"hello":"world"}');

    fireEvent.change(fileInput, { target: { files: [file] } });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await waitFor(() =>
      expect(screen.getByText("data.json")).toBeInTheDocument(),
    );
    expect(inputArea.value).toBe('{"hello":"world"}');
  });

  it("selecting a .txt file is accepted without error", async () => {
    mockFileReader("plain text content");
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile("notes.txt", "plain text content", "text/plain");

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("notes.txt")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")).not.toBeInTheDocument();
  });

  it("selecting a .jsonl file is accepted without error", async () => {
    mockFileReader('{"a":1}\n{"b":2}');
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile(
      "lines.jsonl",
      '{"a":1}\n{"b":2}',
      "application/jsonl",
    );

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("lines.jsonl")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")).not.toBeInTheDocument();
  });

  it("selecting an unsupported extension shows error, does not change input", async () => {
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile(
      "evil.exe",
      "binary content",
      "application/octet-stream",
    );

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    const banner = document.querySelector(".error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toMatch(/unsupported file type/i);

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    expect(inputArea.value).toBe("");
  });

  it("file exceeding 25 MB shows 'exceeds 25 MB limit' error", async () => {
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    // Create a File whose .size property reports > 25 MB by overriding size
    const bigFile = Object.defineProperty(makeFile("huge.json", "x"), "size", {
      value: 25_000_001,
      configurable: true,
    }) as File;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [bigFile] } });
    });

    const banner = document.querySelector(".error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toMatch(/exceeds 25 MB limit/i);
  });

  it("FileReader error shows failure banner", async () => {
    mockFileReader("", true /* error */);
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile("broken.json", "");

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(document.querySelector(".error-banner")).toBeInTheDocument(),
    );
    expect(document.querySelector(".error-banner")?.textContent).toMatch(
      /failed to read/i,
    );
  });
});

// ---------------------------------------------------------------------------
// Drag-and-drop
// ---------------------------------------------------------------------------
describe("Drag-and-drop", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function getDropZone() {
    return document.querySelector(".drop-zone") as HTMLElement;
  }

  it("dropping a .json file loads content and shows file name", async () => {
    mockFileReader('{"dropped":true}');
    render(<App />, { wrapper });

    const dropZone = getDropZone();
    const file = makeFile("dropped.json", '{"dropped":true}');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    await waitFor(() =>
      expect(screen.getByText("dropped.json")).toBeInTheDocument(),
    );
    expect(inputArea.value).toBe('{"dropped":true}');
  });

  it("dropping an unsupported file type shows error, does not change input", async () => {
    render(<App />, { wrapper });

    const dropZone = getDropZone();
    const file = makeFile("virus.exe", "binary", "application/octet-stream");

    await act(async () => {
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
    });

    const banner = document.querySelector(".error-banner");
    expect(banner).toBeInTheDocument();
    expect(banner?.textContent).toMatch(/unsupported file type/i);

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    expect(inputArea.value).toBe("");
  });

  it("dragOver adds drop-zone--active class to the wrapper div", () => {
    render(<App />, { wrapper });
    const dropZone = getDropZone();

    fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: "" } });

    expect(dropZone.classList.contains("drop-zone--active")).toBe(true);
  });

  it("dragLeave to outside removes drop-zone--active class", () => {
    render(<App />, { wrapper });
    const dropZone = getDropZone();

    fireEvent.dragOver(dropZone, { dataTransfer: { dropEffect: "" } });
    expect(dropZone.classList.contains("drop-zone--active")).toBe(true);

    // relatedTarget null simulates leaving to outside the document
    fireEvent.dragLeave(dropZone, { relatedTarget: null });

    expect(dropZone.classList.contains("drop-zone--active")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// File size + progress
// ---------------------------------------------------------------------------
describe("File size and progress indicator", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("file ≤ 5 MB shows no progress bar", async () => {
    mockFileReader('{"small":true}');
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    // default File size is tiny — well under 5 MB
    const file = makeFile("small.json", '{"small":true}');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    );
  });

  it("file > 5 MB shows progress bar while reading then removes it after load", async () => {
    let capturedOnProgress: ((e: ProgressEvent) => void) | null = null;
    let capturedOnLoad: (() => void) | null = null;

    const mockReader = {
      readAsText: vi.fn(() => {
        // Don't auto-resolve — let the test drive progress events manually
        // capture happens after readAsText call since callbacks are assigned before
        capturedOnProgress = mockReader.onprogress;
        capturedOnLoad = mockReader.onload;
      }),
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      onprogress: null as ((e: ProgressEvent) => void) | null,
      result: '{"large":true}' as string | null,
    };
    function MockFileReader() {
      return mockReader;
    }
    vi.stubGlobal("FileReader", MockFileReader);

    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Create a file whose size > 5 MB
    const largeFile = Object.defineProperty(
      makeFile("large.json", "x"),
      "size",
      { value: 6_000_000, configurable: true },
    ) as File;

    act(() => {
      fireEvent.change(fileInput, { target: { files: [largeFile] } });
    });

    // After triggering the change, the FileReader mock sets up callbacks.
    // We need to capture them: re-read from mock.
    capturedOnProgress = mockReader.onprogress;
    capturedOnLoad = mockReader.onload;

    // Emit a progress event — progress bar should appear
    await act(async () => {
      capturedOnProgress?.({
        lengthComputable: true,
        loaded: 3_000_000,
        total: 6_000_000,
      } as ProgressEvent);
    });

    expect(document.querySelector('[role="progressbar"]')).toBeInTheDocument();

    // Resolve the read — progress bar should disappear
    await act(async () => {
      capturedOnLoad?.();
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(
      document.querySelector('[role="progressbar"]'),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// File name in header
// ---------------------------------------------------------------------------
describe("File name in header", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows file name in header after successful upload", async () => {
    mockFileReader('{"x":1}');
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile("mydata.json", '{"x":1}');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(
        document.querySelector(".identity-bar__filename")?.textContent,
      ).toBe("mydata.json"),
    );
  });

  it("removes file name from header after Clear", async () => {
    mockFileReader('{"x":1}');
    const user = userEvent.setup();
    render(<App />, { wrapper });

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = makeFile("temp.json", '{"x":1}');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(
        document.querySelector(".identity-bar__filename"),
      ).toBeInTheDocument(),
    );

    const clearBtn = screen.getByRole("button", { name: "Clear editor" });
    await user.click(clearBtn); // arm
    await user.click(clearBtn); // confirm

    await waitFor(() =>
      expect(
        document.querySelector(".identity-bar__filename")?.textContent,
      ).toBe("untitled"),
    );
  });
});
