import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("@tabler/icons-react", () => ({
  IconMoon: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-moon" {...props} />
  ),
  IconSun: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="icon-sun" {...props} />
  ),
}));

const mockToggle = vi.fn();

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => [currentTheme, mockToggle],
}));

let currentTheme: "light" | "dark" = "light";

// Import after mocks are set up
import { ThemeToggle } from "./ThemeToggle";

beforeEach(() => {
  mockToggle.mockClear();
  currentTheme = "light";
});

describe("ThemeToggle", () => {
  it("renders a button with aria-label Toggle theme", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("shows IconMoon when theme is light", () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    expect(screen.getByTestId("icon-moon")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-sun")).not.toBeInTheDocument();
  });

  it("shows IconSun when theme is dark", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByTestId("icon-sun")).toBeInTheDocument();
    expect(screen.queryByTestId("icon-moon")).not.toBeInTheDocument();
  });

  it("calls toggle function when clicked", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it("has title Switch to dark mode when theme is light", () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("title", "Switch to dark mode");
  });

  it("has title Switch to light mode when theme is dark", () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("title", "Switch to light mode");
  });

  it('has aria-pressed="false" when theme is light', () => {
    currentTheme = "light";
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it('has aria-pressed="true" when theme is dark', () => {
    currentTheme = "dark";
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("flips aria-pressed after toggling the underlying theme state", () => {
    currentTheme = "light";
    const { rerender } = render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("aria-pressed", "false");

    currentTheme = "dark";
    rerender(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
