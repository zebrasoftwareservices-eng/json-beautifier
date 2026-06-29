import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { JsonMinifierPage } from "./JsonMinifierPage";

vi.mock("../App", () => ({
  default: ({ initialTab }: { initialTab?: string }) => (
    <div data-testid="app-mock" data-tab={initialTab} />
  ),
}));

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <JsonMinifierPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("JsonMinifierPage — PageMeta", () => {
  it("sets the correct document title", () => {
    renderPage();
    expect(document.title).toBe(
      "Minify JSON Online — Free JSON Minifier & Compressor",
    );
  });

  it("sets the correct meta description", () => {
    renderPage();
    const meta = document.querySelector('meta[name="description"]');
    expect(meta!.getAttribute("content")).toContain("whitespace from JSON");
  });

  it("sets the canonical URL to /json-minifier", () => {
    renderPage();
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-minifier",
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

describe("JsonMinifierPage — App integration", () => {
  it("renders the App mock with initialTab='code'", () => {
    renderPage();
    const app = screen.getByTestId("app-mock");
    expect(app).toHaveAttribute("data-tab", "code");
  });
});

describe("JsonMinifierPage — SEO content headings", () => {
  it("renders the 'Minify JSON Online' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Minify JSON Online" }),
    ).toBeInTheDocument();
  });

  it("renders the 'What is JSON minification?' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "What is JSON minification?" }),
    ).toBeInTheDocument();
  });

  it("renders the 'When to minify JSON' h2", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "When to minify JSON" }),
    ).toBeInTheDocument();
  });

  it("renders the FAQ section heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
  });
});

describe("JsonMinifierPage — FAQ items", () => {
  it("renders the file size FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("How much does minification reduce file size?"),
    ).toBeInTheDocument();
  });

  it("renders the data change FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("Does minifying JSON change the data?"),
    ).toBeInTheDocument();
  });

  it("renders the privacy FAQ question", () => {
    renderPage();
    expect(
      screen.getByText("Is my JSON sent to a server?"),
    ).toBeInTheDocument();
  });
});

describe("JsonMinifierPage — related tool links", () => {
  it("renders a link to /json-validator", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /validate json/i });
    expect(link).toHaveAttribute("href", "/json-validator");
  });

  it("renders a link to /json-repair", () => {
    renderPage();
    const link = screen.getByRole("link", { name: /fix.*repair json/i });
    expect(link).toHaveAttribute("href", "/json-repair");
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

describe("JsonMinifierPage — navigation breadcrumb", () => {
  it("renders a back link to '/'", () => {
    renderPage();
    const back = screen.getByRole("link", { name: /← json beautifier/i });
    expect(back).toHaveAttribute("href", "/");
  });

  it("shows the page title 'JSON Minifier' in the breadcrumb", () => {
    renderPage();
    expect(screen.getByText("JSON Minifier")).toBeInTheDocument();
  });
});
