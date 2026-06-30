import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { initAnalytics, trackEvent, track } from "./analytics";

function cleanupAnalytics() {
  delete window.dataLayer;
  delete window.gtag;
  document.head
    .querySelectorAll('script[src*="googletagmanager.com"]')
    .forEach((s) => s.remove());
}

beforeEach(() => {
  cleanupAnalytics();
});

afterEach(() => {
  vi.unstubAllEnvs();
  cleanupAnalytics();
});

describe("initAnalytics", () => {
  it("does nothing when VITE_GA_MEASUREMENT_ID is undefined", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", undefined as unknown as string);
    initAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
    expect(
      document.head.querySelectorAll('script[src*="googletagmanager.com"]')
        .length,
    ).toBe(0);
  });

  it("does nothing when ID is an empty string", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "");
    initAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("does nothing when ID does not match the GA4 pattern (bad-id)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "bad-id");
    initAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("does nothing when ID uses lowercase g (g-abc123)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "g-abc123");
    initAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("does nothing when ID has lowercase letters after G- (G-abc123)", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-abc123");
    initAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(window.gtag).toBeUndefined();
  });

  it("sets window.dataLayer and window.gtag when ID is valid", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-ABC123");
    initAnalytics();
    expect(Array.isArray(window.dataLayer)).toBe(true);
    expect(typeof window.gtag).toBe("function");
  });

  it("appends a script tag to document.head when ID is valid", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-ABC123");
    initAnalytics();
    const scripts = document.head.querySelectorAll(
      'script[src*="googletagmanager.com"]',
    );
    expect(scripts.length).toBe(1);
  });

  it("appended script src contains the encoded measurement ID", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-ABC123");
    initAnalytics();
    const script = document.head.querySelector(
      'script[src*="googletagmanager.com"]',
    ) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script!.src).toContain(encodeURIComponent("G-ABC123"));
  });

  it("appended script has async set to true", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-ABC123");
    initAnalytics();
    const script = document.head.querySelector(
      'script[src*="googletagmanager.com"]',
    ) as HTMLScriptElement | null;
    expect(script!.async).toBe(true);
  });

  it("calling window.gtag after init pushes to window.dataLayer", () => {
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-ABC123");
    initAnalytics();
    const before = window.dataLayer!.length;
    window.gtag!("event", "test_event", { key: "value" });
    expect(window.dataLayer!.length).toBeGreaterThan(before);
    const lastEntry = window.dataLayer![
      window.dataLayer!.length - 1
    ] as unknown[];
    expect(lastEntry[0]).toBe("event");
    expect(lastEntry[1]).toBe("test_event");
  });
});

describe("trackEvent", () => {
  it("calls window.gtag with 'event', the name, and params", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.fn<any>();
    window.gtag = spy as unknown as (...args: unknown[]) => void;
    trackEvent("my_event", { foo: "bar" });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("event", "my_event", { foo: "bar" });
  });

  it("calls window.gtag with an empty object when params is omitted", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.fn<any>();
    window.gtag = spy as unknown as (...args: unknown[]) => void;
    trackEvent("my_event");
    expect(spy).toHaveBeenCalledWith("event", "my_event", {});
  });

  it("is a no-op and does not throw when window.gtag is undefined", () => {
    delete window.gtag;
    expect(() => trackEvent("safe_event")).not.toThrow();
  });
});

describe("track helpers", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let spy: ReturnType<typeof vi.fn<any>>;

  beforeEach(() => {
    spy = vi.fn();
    window.gtag = spy as unknown as (...args: unknown[]) => void;
  });

  it("track.jsonFormatted calls trackEvent('json_formatted')", () => {
    track.jsonFormatted();
    expect(spy).toHaveBeenCalledWith("event", "json_formatted", {});
  });

  it("track.jsonValidated calls trackEvent('json_validated')", () => {
    track.jsonValidated();
    expect(spy).toHaveBeenCalledWith("event", "json_validated", {});
  });

  it("track.jsonRepaired calls trackEvent('json_repaired')", () => {
    track.jsonRepaired();
    expect(spy).toHaveBeenCalledWith("event", "json_repaired", {});
  });

  it("track.jsonMinified calls trackEvent('json_minified')", () => {
    track.jsonMinified();
    expect(spy).toHaveBeenCalledWith("event", "json_minified", {});
  });

  it("track.fileUploaded calls trackEvent('file_uploaded')", () => {
    track.fileUploaded();
    expect(spy).toHaveBeenCalledWith("event", "file_uploaded", {});
  });

  it("track.urlLoaded calls trackEvent('url_loaded')", () => {
    track.urlLoaded();
    expect(spy).toHaveBeenCalledWith("event", "url_loaded", {});
  });

  it("track.shareLinkCopied calls trackEvent('share_link_copied')", () => {
    track.shareLinkCopied();
    expect(spy).toHaveBeenCalledWith("event", "share_link_copied", {});
  });

  it("track.converterUsed('yaml') calls trackEvent with output_format: 'yaml'", () => {
    track.converterUsed("yaml");
    expect(spy).toHaveBeenCalledWith("event", "converter_used", {
      output_format: "yaml",
    });
  });

  it("track.converterUsed passes through arbitrary format strings", () => {
    track.converterUsed("csv");
    expect(spy).toHaveBeenCalledWith("event", "converter_used", {
      output_format: "csv",
    });
  });
});
