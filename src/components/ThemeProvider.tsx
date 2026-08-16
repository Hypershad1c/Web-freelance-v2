"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "domify-theme";

function getSystemTheme(): ResolvedTheme {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): ResolvedTheme {
  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
  return resolvedTheme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme: Theme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setThemeState(initialTheme);
    setResolvedTheme(applyTheme(initialTheme));

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (window.localStorage.getItem(STORAGE_KEY) === "system" || !window.localStorage.getItem(STORAGE_KEY)) {
        setResolvedTheme(applyTheme("system"));
      }
    };
    mediaQuery.addEventListener?.("change", handleSystemChange);
    return () => mediaQuery.removeEventListener?.("change", handleSystemChange);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme: (nextTheme) => {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    },
    toggleTheme: () => {
      const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
      setThemeState(nextTheme);
      setResolvedTheme(applyTheme(nextTheme));
    },
  }), [resolvedTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
