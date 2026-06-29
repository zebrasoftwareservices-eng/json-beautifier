import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ConverterPage } from "./ConverterPage";

vi.mock("../hooks/useConverter", () => ({
  useConverter: () => ({
    convert: vi
      .fn()
      .mockResolvedValue({ ok: true, result: "converted", ext: "yaml" }),
  }),
}));

function renderPage(format: "yaml" | "csv" | "xml") {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ConverterPage format={format} />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("ConverterPage — YAML format PageMeta", () => {
  it("sets the YAML title", () => {
    renderPage("yaml");
    expect(document.title).toBe(
      "Convert JSON to YAML Online — Free JSON to YAML Converter",
    );
  });

  it("sets the YAML canonical URL", () => {
    renderPage("yaml");
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-to-yaml",
    );
  });

  it("injects FAQPage JSON-LD for YAML", () => {
    renderPage("yaml");
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.textContent!);
    expect(data["@type"]).toBe("FAQPage");
  });

  it("YAML FAQ contains JSON vs YAML question", () => {
    renderPage("yaml");
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    const questions = data.mainEntity.map((e: { name: string }) => e.name);
    expect(questions).toContain(
      "What is the difference between JSON and YAML?",
    );
  });
});

describe("ConverterPage — CSV format PageMeta", () => {
  it("sets the CSV title", () => {
    renderPage("csv");
    expect(document.title).toBe(
      "Convert JSON to CSV Online — Free JSON to CSV Converter",
    );
  });

  it("sets the CSV canonical URL", () => {
    renderPage("csv");
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-to-csv",
    );
  });

  it("injects FAQPage JSON-LD for CSV", () => {
    renderPage("csv");
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data["@type"]).toBe("FAQPage");
  });

  it("CSV FAQ contains JSON structures question", () => {
    renderPage("csv");
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    const questions = data.mainEntity.map((e: { name: string }) => e.name);
    expect(questions).toContain(
      "What JSON structures can be converted to CSV?",
    );
  });
});

describe("ConverterPage — XML format PageMeta", () => {
  it("sets the XML title", () => {
    renderPage("xml");
    expect(document.title).toBe(
      "Convert JSON to XML Online — Free JSON to XML Converter",
    );
  });

  it("sets the XML canonical URL", () => {
    renderPage("xml");
    const link = document.querySelector('link[rel="canonical"]');
    expect(link!.getAttribute("href")).toBe(
      "https://jsonbeautifier.zss.dev/json-to-xml",
    );
  });
});

describe("ConverterPage — UI structure", () => {
  it("renders the JSON input textarea", () => {
    renderPage("yaml");
    expect(
      screen.getByRole("textbox", { name: "JSON input" }),
    ).toBeInTheDocument();
  });

  it("renders YAML output section label", () => {
    renderPage("yaml");
    expect(screen.getByLabelText("YAML output")).toBeInTheDocument();
  });

  it("renders CSV output section label", () => {
    renderPage("csv");
    expect(screen.getByLabelText("CSV output")).toBeInTheDocument();
  });

  it("renders format tabs: YAML, CSV, XML", () => {
    renderPage("yaml");
    expect(screen.getByRole("button", { name: "YAML" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "XML" })).toBeInTheDocument();
  });

  it("active format tab has aria-current='page'", () => {
    renderPage("csv");
    const csvBtn = screen.getByRole("button", { name: "CSV" });
    expect(csvBtn).toHaveAttribute("aria-current", "page");
  });

  it("inactive format tabs do not have aria-current", () => {
    renderPage("csv");
    const yamlBtn = screen.getByRole("button", { name: "YAML" });
    expect(yamlBtn).not.toHaveAttribute("aria-current");
  });

  it("Copy button is initially disabled when no output", () => {
    renderPage("yaml");
    const copyBtn = screen.getByRole("button", {
      name: /copy output to clipboard/i,
    });
    expect(copyBtn).toBeDisabled();
  });

  it("Download button is initially disabled when no output", () => {
    renderPage("yaml");
    const dlBtn = screen.getByRole("button", {
      name: /download as .yaml file/i,
    });
    expect(dlBtn).toBeDisabled();
  });

  it("renders privacy footer text", () => {
    renderPage("yaml");
    expect(
      screen.getByText("Processed locally · No data sent to servers"),
    ).toBeInTheDocument();
  });

  it("renders status text 'Ready' on initial load", () => {
    renderPage("yaml");
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});

describe("ConverterPage — header navigation", () => {
  it("renders a link back to '/' with 'JSON Beautifier' text", () => {
    renderPage("yaml");
    const link = screen.getByRole("link", { name: /json beautifier/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows 'JSON → YAML' in the header for yaml format", () => {
    renderPage("yaml");
    expect(screen.getByText("JSON → YAML")).toBeInTheDocument();
  });

  it("shows 'JSON → CSV' in the header for csv format", () => {
    renderPage("csv");
    expect(screen.getByText("JSON → CSV")).toBeInTheDocument();
  });

  it("shows 'JSON → XML' in the header for xml format", () => {
    renderPage("xml");
    expect(screen.getByText("JSON → XML")).toBeInTheDocument();
  });
});
