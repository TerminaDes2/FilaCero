"use client";
import { useEffect } from "react";
import { useThemeStore, type ResolvedTheme } from "../state/themeStore";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function resolveTheme(mode: "light" | "dark" | "system", prefersDark: boolean): ResolvedTheme {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

export function ThemeApplier() {
  const mode = useThemeStore((state) => state.mode);
  const setResolved = useThemeStore((state) => state.setResolved);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const media = window.matchMedia?.(MEDIA_QUERY);
    const prefersDark = media?.matches ?? false;

    const apply = (targetMode?: ResolvedTheme) => {
      const effective = targetMode ?? resolveTheme(mode, media?.matches ?? prefersDark);
      setResolved(effective);
      root.classList.toggle("dark", effective === "dark");
      root.style.setProperty("color-scheme", effective === "dark" ? "dark" : "light");
    };

    apply();

    if (!media) return;

    if (mode === "system") {
      const listener = (event: MediaQueryListEvent) => {
        apply(event.matches ? "dark" : "light");
      };
      media.addEventListener("change", listener);
      return () => {
        media.removeEventListener("change", listener);
      };
    }

    return undefined;
  }, [mode, setResolved]);

  return null;
}

export default ThemeApplier;
