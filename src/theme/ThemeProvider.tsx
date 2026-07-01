import { useState, useEffect, type ReactNode } from "react";
import { ThemeContext, type Theme, type Accent } from "./ThemeContext";

const STORAGE_KEY_THEME = "brace:theme";
const STORAGE_KEY_ACCENT = "brace:accent";

function resolveSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* private browsing */
  }
  return resolveSystemTheme();
}

function loadAccent(): Accent {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACCENT);
    if (saved === "violet" || saved === "blue") return saved;
  } catch {
    /* private browsing */
  }
  return "violet";
}

function applyTheme(theme: Theme, accent: Accent) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-accent", accent);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [accent, setAccentState] = useState<Accent>(loadAccent);

  useEffect(() => {
    applyTheme(theme, accent);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      /* private browsing */
    }
  }, [theme, accent]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACCENT, accent);
    } catch {
      /* private browsing */
    }
  }, [accent]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        if (!localStorage.getItem(STORAGE_KEY_THEME)) {
          setThemeState(resolveSystemTheme());
        }
      } catch {
        setThemeState(resolveSystemTheme());
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Apply on first render before paint
  applyTheme(theme, accent);

  return (
    <ThemeContext
      value={{
        theme,
        setTheme: setThemeState,
        accent,
        setAccent: setAccentState,
      }}
    >
      {children}
    </ThemeContext>
  );
}
