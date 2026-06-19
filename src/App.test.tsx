import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import App from "./App";
import { processJson } from "./worker/jsonLogic";

// Mock useJsonWorker to use the pure processJson function directly,
// avoiding Worker instantiation which is not available in jsdom.
vi.mock("./worker/useJsonWorker", () => ({
  useJsonWorker: () => ({
    process: (type: "beautify" | "minify", input: string, indent = 2) =>
      Promise.resolve(processJson(type, input, indent)),
  }),
}));

function setup() {
  const user = userEvent.setup();
  render(<App />);
  const inputArea = screen.getByLabelText("Input") as HTMLTextAreaElement;
  const outputArea = screen.getByLabelText("Output") as HTMLTextAreaElement;
  const beautifyBtn = screen.getByRole("button", { name: "Beautify" });
  const minifyBtn = screen.getByRole("button", { name: "Minify" });
  return { user, inputArea, outputArea, beautifyBtn, minifyBtn };
}

// Helper to set textarea value without triggering userEvent's key parser
function setInput(textarea: HTMLTextAreaElement, value: string) {
  fireEvent.change(textarea, { target: { value } });
}

const validJson = '{"name":"Alice","age":30}';

describe("beautify", () => {
  it("formats valid JSON with 2-space indent by default", async () => {
    const { user, inputArea, outputArea, beautifyBtn } = setup();

    setInput(inputArea, validJson);
    await user.click(beautifyBtn);

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 2),
    );
  });

  it("formats valid JSON with 4-space indent when selected", async () => {
    const { user, inputArea, outputArea, beautifyBtn } = setup();

    const indentSelect = screen.getByRole("combobox");
    await user.selectOptions(indentSelect, "4");
    setInput(inputArea, validJson);
    await user.click(beautifyBtn);

    expect(outputArea.value).toBe(
      JSON.stringify({ name: "Alice", age: 30 }, null, 4),
    );
  });

  it("shows an error message for invalid JSON", async () => {
    const { user, inputArea, beautifyBtn } = setup();

    setInput(inputArea, "not valid json");
    await user.click(beautifyBtn);

    const error = document.querySelector(".error");
    expect(error).toBeInTheDocument();
    expect(error?.textContent).toBeTruthy();
  });

  it("clears output when input becomes invalid after a previous valid run", async () => {
    const { user, inputArea, outputArea, beautifyBtn } = setup();

    // First a valid run
    setInput(inputArea, validJson);
    await user.click(beautifyBtn);
    expect(outputArea.value).not.toBe("");

    // Now type invalid JSON
    setInput(inputArea, "{bad}");
    await user.click(beautifyBtn);

    expect(outputArea.value).toBe("");
  });
});

describe("minify", () => {
  it("compacts valid JSON to a single line", async () => {
    const { user, inputArea, outputArea, minifyBtn } = setup();

    const prettyJson = '{\n  "name": "Alice",\n  "age": 30\n}';
    setInput(inputArea, prettyJson);
    await user.click(minifyBtn);

    expect(outputArea.value).toBe('{"name":"Alice","age":30}');
  });

  it("shows an error message for invalid JSON", async () => {
    const { user, inputArea, minifyBtn } = setup();

    setInput(inputArea, "not valid json");
    await user.click(minifyBtn);

    const error = document.querySelector(".error");
    expect(error).toBeInTheDocument();
    expect(error?.textContent).toBeTruthy();
  });
});
