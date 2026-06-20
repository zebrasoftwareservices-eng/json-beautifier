import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import App from "./App";
import { processJson } from "./worker/jsonLogic";
import { SAMPLE_JSON } from "./components/ActionBar";

// Mock useJsonWorker to use the pure processJson function directly,
// avoiding Worker instantiation which is not available in jsdom.
vi.mock("./worker/useJsonWorker", () => ({
  useJsonWorker: () => ({
    process: (type: "beautify" | "minify", input: string, indent = 2) =>
      Promise.resolve(processJson(type, input, indent)),
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
// stays stable across activeTab changes, plus expose a Code tab button.
vi.mock("./components/RightPane", () => ({
  RightPane: ({
    output,
    onTabChange,
  }: {
    output: string;
    activeTab: string;
    onTabChange: (tab: string) => void;
  }) => (
    <div>
      <button onClick={() => onTabChange("code")}>Code</button>
      <textarea
        data-testid="output-editor"
        readOnly
        value={output}
        onChange={() => {}}
      />
    </div>
  ),
}));

// Helper: render App and return commonly used handles.
function setup() {
  const user = userEvent.setup();
  render(<App />);
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

    const indentSelect = screen.getByRole("combobox");
    await user.selectOptions(indentSelect, "4");
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

    const sampleBtn = screen.getByRole("button", { name: "Sample" });
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

    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await act(async () => {
      await user.click(clearBtn);
    });

    expect(inputArea.value).toBe("");
    expect(outputArea.value).toBe("");
  });

  it("also clears any error banner", async () => {
    const { user, inputArea, formatBtn } = setup();

    setInput(inputArea, "bad json");
    await user.click(formatBtn);
    expect(document.querySelector(".error-banner")).toBeInTheDocument();

    const clearBtn = screen.getByRole("button", { name: "Clear" });
    await user.click(clearBtn);

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
    render(<App />);

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
    render(<App />);

    const inputArea = screen.getByTestId("input-editor") as HTMLTextAreaElement;
    const outputArea = screen.getByTestId(
      "output-editor",
    ) as HTMLTextAreaElement;
    const triggerPaste = screen.getByTestId("trigger-paste");

    // Uncheck the "Auto" checkbox using fireEvent (avoids userEvent+fakeTimers deadlock)
    const autoCheckbox = screen.getByRole("checkbox");
    fireEvent.click(autoCheckbox);
    expect((autoCheckbox as HTMLInputElement).checked).toBe(false);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
    render(<App />);

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
