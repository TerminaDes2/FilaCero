"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
interface ThemeCtx { theme: Theme; toggle: () => void; set: (t: Theme) => void; }
const ThemeContext = createContext<ThemeCtx | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("fc-theme");
  if (stored === "light" || stored === "dark") return stored;
  const mq = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return mq ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
    window.localStorage.setItem("fc-theme", theme);
  }, [theme]);

  const value: ThemeCtx = {
    theme,
    toggle: () => setTheme(t => (t === "light" ? "dark" : "light")),
    set: (t: Theme) => setTheme(t)
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
