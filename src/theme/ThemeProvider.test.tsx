import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-accent");
  setMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("ThemeProvider", () => {
  it("defaults to light when matchMedia returns false and no localStorage", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
  });

  it("defaults to dark when matchMedia returns true", () => {
    setMatchMedia(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
  });

  it("saved 'light' in localStorage overrides matchMedia=true", () => {
    localStorage.setItem("brace:theme", "light");
    setMatchMedia(true);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("light");
  });

  it("saved 'dark' in localStorage is respected", () => {
    localStorage.setItem("brace:theme", "dark");
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.theme).toBe("dark");
  });

  it("setTheme('dark') updates state, sets data-theme on <html>, and persists to localStorage", () => {
    setMatchMedia(false);
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme("dark");
    });
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("brace:theme")).toBe("dark");
  });

  it("setTheme('light') toggles back", () => {
    localStorage.setItem("brace:theme", "dark");
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setTheme("light");
    });
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("brace:theme")).toBe("light");
  });

  it("default accent is 'violet' and data-accent is set on <html>", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.accent).toBe("violet");
    expect(document.documentElement.getAttribute("data-accent")).toBe("violet");
  });

  it("setAccent('blue') updates state, sets data-accent on html, persists to localStorage", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => {
      result.current.setAccent("blue");
    });
    expect(result.current.accent).toBe("blue");
    expect(document.documentElement.getAttribute("data-accent")).toBe("blue");
    expect(localStorage.getItem("brace:accent")).toBe("blue");
  });

  it("data-accent is set on initial render", () => {
    renderHook(() => useTheme(), { wrapper });
    expect(document.documentElement.getAttribute("data-accent")).toBe("violet");
  });
});

describe("useTheme", () => {
  it("throws when used outside ThemeProvider", () => {
    // Suppress React error boundary output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used inside ThemeProvider",
    );
    consoleSpy.mockRestore();
  });
});
