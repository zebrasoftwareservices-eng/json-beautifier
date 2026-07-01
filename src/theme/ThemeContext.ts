import { createContext } from "react";

export type Theme = "light" | "dark";
export type Accent = "violet" | "blue";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
