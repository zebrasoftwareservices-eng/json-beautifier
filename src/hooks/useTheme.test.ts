import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";
import { ThemeProvider } from "../theme/ThemeProvider";

const STORAGE_KEY = "brace:theme";

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
  localStorage.removeItem(STORAGE_KEY);
  document.documentElement.removeAttribute("data-theme");
  setMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useTheme", () => {
  it("returns light when no localStorage entry and matchMedia returns false", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("light");
  });

  it("returns dark when matchMedia returns true", () => {
    setMatchMedia(true);
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("dark");
  });

  it("returns stored light from localStorage, ignoring matchMedia", () => {
    setMatchMedia(true);
    localStorage.setItem(STORAGE_KEY, "light");
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("light");
  });

  it("returns stored dark from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("dark");
  });

  it("ignores invalid stored values and falls back to matchMedia", () => {
    localStorage.setItem(STORAGE_KEY, "system");
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("light");
  });

  it("sets data-theme attribute on html element on init", () => {
    renderHook(() => useTheme(), { wrapper: ThemeProvider });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggle switches dark to light", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("dark");
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe("light");
  });

  it("toggle switches light to dark", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    expect(result.current[0]).toBe("light");
    act(() => {
      result.current[1]();
    });
    expect(result.current[0]).toBe("dark");
  });

  it("persists new theme to localStorage after toggle", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    act(() => {
      result.current[1]();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("updates data-theme attribute on html element after toggle", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    act(() => {
      result.current[1]();
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
