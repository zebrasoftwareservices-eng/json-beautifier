import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { JsonValidatorPage } from "./JsonValidatorPage";

vi.mock("../App", () => ({
  default: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="app-mock" data-tab={initialTab} />
  ),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <JsonValidatorPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("JsonValidatorPage — PageMeta", () => {
  it("sets the correct document title", () => {
    renderPage();
    expect(document.title).toBe("Validate JSON Online — Free JSON Validator");
  });

  it("sets the correct meta description", () => {
    renderPage();
    const meta = document.querySelector('meta[name="description"]');
    expect(meta!.getAttribute("content")).toContain("validate JSON");
  });

  it("sets the canonical URL to /json-validator", () => {
    renderPage();
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-validator",
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

describe("JsonValidatorPage — App integration", () => {
  it("renders the App mock with initialTab='error'", () => {
    renderPage();
    const app = screen.getByTestId("app-mock");
    expect(app).toBeInTheDocument();
    expect(app).toHaveAttribute("data-tab", "error");
  });
});

describe("JsonValidatorPage — SEO content headings", () => {
  it("renders the 'Validate JSON Online' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Validate JSON Online" }),
    ).toBeInTheDocument();
  });

  it("renders the 'What is JSON validation?' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "What is JSON validation?" }),
    ).toBeInTheDocument();
  });

  it("renders the 'Common validation errors' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Common validation errors" }),
    ).toBeInTheDocument();
  });

  it("renders the 'Frequently asked questions' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
  });

  it("renders the 'Related tools' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Related tools" }),
    ).toBeInTheDocument();
  });
});

describe("JsonValidatorPage — FAQ items", () => {
  it("renders the 'What makes JSON valid?' FAQ question", () => {
    renderPage();
    expect(screen.getByText("What makes JSON valid?")).toBeInTheDocument();
  });

  it("renders the privacy FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("Is my JSON sent to a server?"),
    ).toBeInTheDocument();
  });
});

describe("JsonValidatorPage — related tool links", () => {
  it("renders a link to /json-repair", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /fix.*repair json/i });
    expect(link).toHaveAttribute("href", "/json-repair");
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

  it("renders a link to /json-to-csv", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /json to csv/i });
    expect(link).toHaveAttribute("href", "/json-to-csv");
  });

  it("renders a link to /editor", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /full json editor/i });
    expect(link).toHaveAttribute("href", "/editor");
  });
});

describe("JsonValidatorPage — navigation breadcrumb", () => {
  it("renders a back link to '/'", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /← json beautifier/i });
    expect(back).toHaveAttribute("href", "/");
  });

  it("shows the page title 'JSON Validator' in the breadcrumb", () => {
    renderPage();
    expect(screen.getByText("JSON Validator")).toBeInTheDocument();
  });
});
