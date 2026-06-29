import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { JsonRepairPage } from "./JsonRepairPage";

vi.mock("../App", () => ({
  default: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="app-mock" data-tab={initialTab} />
  ),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <JsonRepairPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("JsonRepairPage — PageMeta", () => {
  it("sets the correct document title", () => {
    renderPage();
    expect(document.title).toBe(
      "Fix & Repair Invalid JSON Online — Free JSON Repair Tool",
    );
  });

  it("sets the correct meta description", () => {
    renderPage();
    const meta = document.querySelector('meta[name="description"]');
    expect(meta!.getAttribute("content")).toContain("fix invalid JSON");
  });

  it("sets the canonical URL to /json-repair", () => {
    renderPage();
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-repair",
    );
  });

  it("injects FAQPage JSON-LD schema", () => {
    renderPage();
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent!);
    expect(data["@type"]).toBe("FAQPage");
  });
});

describe("JsonRepairPage — App integration", () => {
  it("renders the App mock with initialTab='repair'", () => {
    renderPage();
    const app = screen.getByTestId("app-mock");
    expect(app).toHaveAttribute("data-tab", "repair");
  });
});

describe("JsonRepairPage — SEO content headings", () => {
  it("renders the 'Fix Invalid JSON Online' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Fix Invalid JSON Online" }),
    ).toBeInTheDocument();
  });

  it("renders the 'What is JSON repair?' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "What is JSON repair?" }),
    ).toBeInTheDocument();
  });

  it("renders the 'What this tool can fix' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "What this tool can fix" }),
    ).toBeInTheDocument();
  });

  it("renders the FAQ section heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
  });
});

describe("JsonRepairPage — FAQ items", () => {
  it("renders the repair types FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("What kinds of JSON can be auto-repaired?"),
    ).toBeInTheDocument();
  });

  it("renders the data change FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("Will the repair change my data?"),
    ).toBeInTheDocument();
  });

  it("renders the privacy FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("Is my JSON sent to a server?"),
    ).toBeInTheDocument();
  });
});

describe("JsonRepairPage — related tool links", () => {
  it("renders a link to /json-validator", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /validate json/i });
    expect(link).toHaveAttribute("href", "/json-validator");
  });

  it("renders a link to /json-minifier", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /minify json/i });
    expect(link).toHaveAttribute("href", "/json-minifier");
  });

  it("renders a link to /json-to-yaml", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /json to yaml/i });
    expect(link).toHaveAttribute("href", "/json-to-yaml");
  });

  it("renders a link to /editor", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /full json editor/i });
    expect(link).toHaveAttribute("href", "/editor");
  });
});

describe("JsonRepairPage — navigation breadcrumb", () => {
  it("renders a back link to '/'", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /← json beautifier/i });
    expect(back).toHaveAttribute("href", "/");
  });

  it("shows the page title 'JSON Repair' in the breadcrumb", () => {
    renderPage();
    expect(screen.getByText("JSON Repair")).toBeInTheDocument();
  });
});
