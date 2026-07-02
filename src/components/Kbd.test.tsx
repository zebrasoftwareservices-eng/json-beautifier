import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders its children inside a <kbd> element", () => {
    render(<Kbd>⌘K</Kbd>);
    const el = screen.getByText("⌘K");
    expect(el.tagName).toBe("KBD");
  });

  it("renders with class 'kbd'", () => {
    render(<Kbd>Ctrl+S</Kbd>);
    const el = screen.getByText("Ctrl+S");
    expect(el).toHaveClass("kbd");
  });
});
