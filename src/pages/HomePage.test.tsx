import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";

// Helper: render HomePage inside a MemoryRouter so <Link> resolves correctly.
function renderHomePage(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HomePage />
    </MemoryRouter>,
  );
}

// ── 1. Hero headline ──────────────────────────────────────────────────────────

describe("hero headline", () => {
  it("renders an h1 containing the privacy phrase", () => {
    renderHomePage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("entirely in your browser");
  });

  it("h1 contains the full headline text", () => {
    renderHomePage();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Format, validate, and explore JSON");
  });
});

// ── 2. Subheadline ────────────────────────────────────────────────────────────

describe("subheadline", () => {
  it("renders the 'No data sent to servers' subheadline paragraph", () => {
    renderHomePage();
    expect(
      screen.getByText("No data sent to servers. No login. No ads."),
    ).toBeInTheDocument();
  });
});

// ── 3. Trust badges ───────────────────────────────────────────────────────────

describe("trust badges", () => {
  it("renders the privacy badge", () => {
    renderHomePage();
    expect(
      screen.getByText(
        "Processed locally — your JSON never leaves your device",
      ),
    ).toBeInTheDocument();
  });

  it("renders the speed badge", () => {
    renderHomePage();
    expect(
      screen.getByText("Instant — no round trips, no server delays"),
    ).toBeInTheDocument();
  });

  it("renders the free-forever badge", () => {
    renderHomePage();
    expect(
      screen.getByText("Free forever — no account required"),
    ).toBeInTheDocument();
  });

  it("renders exactly three trust badge elements", () => {
    renderHomePage();
    // Each badge lives inside .home-trust__badge
    const badges = document.querySelectorAll(".home-trust__badge");
    expect(badges).toHaveLength(3);
  });
});

// ── 4. CTA link ───────────────────────────────────────────────────────────────

describe("CTA link", () => {
  it("renders an 'Open the Editor →' link", () => {
    renderHomePage();
    const cta = screen.getByRole("link", { name: /open the editor/i });
    expect(cta).toBeInTheDocument();
  });

  it("CTA link points to /editor", () => {
    renderHomePage();
    const cta = screen.getByRole("link", { name: /open the editor/i });
    expect(cta).toHaveAttribute("href", "/editor");
  });
});

// ── 5. Stats bar ──────────────────────────────────────────────────────────────

describe("stats bar", () => {
  it("shows the 2M+ JSONs formatted stat", () => {
    renderHomePage();
    expect(screen.getByText("2M+")).toBeInTheDocument();
  });

  it("shows the 180K+ errors caught stat", () => {
    renderHomePage();
    expect(screen.getByText("180K+")).toBeInTheDocument();
  });

  it("shows the 40K+ files uploaded stat", () => {
    renderHomePage();
    expect(screen.getByText("40K+")).toBeInTheDocument();
  });

  it("renders the stats bar with the accessible label", () => {
    renderHomePage();
    expect(screen.getByLabelText("Usage statistics")).toBeInTheDocument();
  });
});

// ── 6. Feature cards ──────────────────────────────────────────────────────────

describe("feature cards", () => {
  it("renders the '10+ Operations' card title", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: "10+ Operations" }),
    ).toBeInTheDocument();
  });

  it("renders the 'Any Size' card title", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: "Any Size" }),
    ).toBeInTheDocument();
  });

  it("renders the 'Share Instantly' card title", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", { name: "Share Instantly" }),
    ).toBeInTheDocument();
  });

  it("renders exactly three feature cards", () => {
    renderHomePage();
    const cards = document.querySelectorAll(".home-feature-card");
    expect(cards).toHaveLength(3);
  });

  it("renders the feature section heading", () => {
    renderHomePage();
    expect(
      screen.getByRole("heading", {
        name: "Everything you need to work with JSON",
      }),
    ).toBeInTheDocument();
  });
});

// ── 7. Document title ─────────────────────────────────────────────────────────

// NOTE: document.title is set in index.html, not inside the HomePage component,
// so it cannot be verified via component-level unit tests. This is intentionally
// omitted; cover it with an E2E/browser test (e.g. Playwright) instead.

// ── 8. Semantic structure ─────────────────────────────────────────────────────

describe("semantic structure", () => {
  it("wraps page content in a <main> element", () => {
    renderHomePage();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the hero area as a <section> element", () => {
    const { container } = renderHomePage();
    const heroEl = container.querySelector(".home-hero");
    expect(heroEl).not.toBeNull();
    expect(heroEl!.tagName).toBe("SECTION");
  });
});
