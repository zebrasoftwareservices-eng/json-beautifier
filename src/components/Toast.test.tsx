import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  it("renders the message text when message is a non-null string", () => {
    render(<Toast message="Copied to clipboard" />);
    expect(screen.getByText("Copied to clipboard")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders nothing when message is null", () => {
    const { container } = render(<Toast message={null} />);
    expect(container.firstChild).toBeNull();
    expect(container.querySelector(".toast")).not.toBeInTheDocument();
  });
});
