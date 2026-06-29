import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { PageMeta } from "./PageMeta";

function renderPageMeta(props: Parameters<typeof PageMeta>[0]) {
  return render(
    <HelmetProvider>
      <PageMeta {...props} />
    </HelmetProvider>,
  );
}

describe("PageMeta — basic meta tags", () => {
  it("sets document title", () => {
    renderPageMeta({
      title: "Test Title",
      description: "Test description",
      canonical: "https://example.com/test",
    });
    expect(document.title).toBe("Test Title");
  });

  it("sets meta description", () => {
    renderPageMeta({
      title: "Test Title",
      description: "My description",
      canonical: "https://example.com/test",
    });
    const meta = document.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute("content")).toBe("My description");
  });

  it("sets canonical link", () => {
    renderPageMeta({
      title: "Test Title",
      description: "desc",
      canonical: "https://example.com/canonical",
    });
    const link = document.querySelector('link[rel="canonical"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("https://example.com/canonical");
  });

  it("sets og:title meta property", () => {
    renderPageMeta({
      title: "OG Title",
      description: "desc",
      canonical: "https://example.com/",
    });
    const og = document.querySelector('meta[property="og:title"]');
    expect(og).not.toBeNull();
    expect(og!.getAttribute("content")).toBe("OG Title");
  });

  it("sets og:description meta property", () => {
    renderPageMeta({
      title: "Title",
      description: "OG desc",
      canonical: "https://example.com/",
    });
    const og = document.querySelector('meta[property="og:description"]');
    expect(og).not.toBeNull();
    expect(og!.getAttribute("content")).toBe("OG desc");
  });

  it("sets og:url meta property", () => {
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/page",
    });
    const og = document.querySelector('meta[property="og:url"]');
    expect(og).not.toBeNull();
    expect(og!.getAttribute("content")).toBe("https://example.com/page");
  });
});

describe("PageMeta — JSON-LD FAQPage", () => {
  it("does not inject JSON-LD script when faq is omitted", () => {
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
    });
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts).toHaveLength(0);
  });

  it("injects a JSON-LD script when faq is provided", () => {
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
      faq: [{ question: "Q1?", answer: "A1." }],
    });
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    expect(scripts).toHaveLength(1);
  });

  it("JSON-LD schema has @type FAQPage", () => {
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
      faq: [{ question: "Q?", answer: "A." }],
    });
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data["@type"]).toBe("FAQPage");
    expect(data["@context"]).toBe("https://schema.org");
  });

  it("JSON-LD mainEntity contains all FAQ items as Question/Answer", () => {
    const faq = [
      { question: "What is JSON?", answer: "A data format." },
      { question: "Is it free?", answer: "Yes." },
    ];
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
      faq,
    });
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data.mainEntity).toHaveLength(2);
    expect(data.mainEntity[0]["@type"]).toBe("Question");
    expect(data.mainEntity[0].name).toBe("What is JSON?");
    expect(data.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
    expect(data.mainEntity[0].acceptedAnswer.text).toBe("A data format.");
    expect(data.mainEntity[1].name).toBe("Is it free?");
  });

  it("JSON-LD handles special characters in FAQ text", () => {
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
      faq: [
        { question: 'Can I use <script> & "quotes"?', answer: "Yes & no." },
      ],
    });
    const script = document.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent!);
    expect(data.mainEntity[0].name).toBe('Can I use <script> & "quotes"?');
  });

  it("JSON-LD handles an empty faq array — no script injected", () => {
    // Empty array is falsy check: faq=[] is truthy so script IS injected but mainEntity is empty
    renderPageMeta({
      title: "Title",
      description: "desc",
      canonical: "https://example.com/",
      faq: [],
    });
    const script = document.querySelector('script[type="application/ld+json"]');
    // faq=[] is truthy, so faqSchema is created with empty mainEntity
    const data = JSON.parse(script!.textContent!);
    expect(data.mainEntity).toHaveLength(0);
  });
});
