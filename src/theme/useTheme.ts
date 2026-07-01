import { use } from "react";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

export function useTheme(): ThemeContextValue {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export type { Theme, Accent } from "./ThemeContext";
