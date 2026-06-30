import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "json-beautifier:theme";

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
      return saved;
    }
  } catch {
    /* ignore — private browsing */
  }
  const theme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return [theme, toggle];
}
