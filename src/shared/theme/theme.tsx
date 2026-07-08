import { createContext, useContext, useEffect, useCallback } from "react";

type Theme = "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark";
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "prgrss-theme";

function applyTheme() {
  const root = document.documentElement;
  root.classList.add("dark");

  // Оновлюємо theme-color мета-тег
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#050909");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const setTheme = useCallback((newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Застосовуємо темну тему незалежно від системних або старих збережених налаштувань.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, "dark");
    applyTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", setTheme, resolvedTheme: "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
