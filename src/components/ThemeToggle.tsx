import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const [theme, toggleTheme] = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <IconSun size={15} aria-hidden />
      ) : (
        <IconMoon size={15} aria-hidden />
      )}
    </button>
  );
}
