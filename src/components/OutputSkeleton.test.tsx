import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OutputSkeleton } from "./OutputSkeleton";

describe("OutputSkeleton — content", () => {
  it("renders the 'Formatted JSON appears here' text", () => {
    render(<OutputSkeleton />);
    expect(screen.getByText("Formatted JSON appears here")).toBeInTheDocument();
  });

  it("applies the output-skeleton__text class to the text", () => {
    render(<OutputSkeleton />);
    const text = screen.getByText("Formatted JSON appears here");
    expect(text).toHaveClass("output-skeleton__text");
    expect(text.tagName).toBe("P");
  });
});

describe("OutputSkeleton — decorative bars", () => {
  it("renders a .output-skeleton__bars container marked aria-hidden", () => {
    render(<OutputSkeleton />);
    const bars = document.querySelector(".output-skeleton__bars");
    expect(bars).toBeInTheDocument();
    expect(bars).toHaveAttribute("aria-hidden", "true");
  });

  it("renders exactly 5 skeleton bar divs", () => {
    render(<OutputSkeleton />);
    const bars = document.querySelectorAll(
      ".output-skeleton__bars .output-skeleton__bar",
    );
    expect(bars).toHaveLength(5);
  });

  it("gives each bar a unique modifier class output-skeleton__bar--1 through --5", () => {
    render(<OutputSkeleton />);
    for (let i = 1; i <= 5; i++) {
      expect(
        document.querySelector(`.output-skeleton__bar--${i}`),
      ).toBeInTheDocument();
    }
  });
});

describe("OutputSkeleton — root structure", () => {
  it("renders a root .output-skeleton wrapper", () => {
    const { container } = render(<OutputSkeleton />);
    expect(container.querySelector(".output-skeleton")).toBeInTheDocument();
  });

  it("does not accept or require any props", () => {
    // Component takes no props; rendering with none should not throw.
    expect(() => render(<OutputSkeleton />)).not.toThrow();
  });
});
