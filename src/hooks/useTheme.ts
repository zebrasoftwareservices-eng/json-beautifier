import { useTheme as useThemeContext } from "../theme/useTheme";

type Theme = "light" | "dark";

export function useTheme(): [Theme, () => void] {
  const { theme, setTheme } = useThemeContext();
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return [theme, toggle];
}
