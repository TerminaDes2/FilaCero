"use client";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-white/20 bg-white/70 dark:bg-white/5 backdrop-blur hover:shadow-md transition"
    >
      {theme === "light" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5 text-amber-500"><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M8.05 8.05 6.636 6.636m0 10.728 1.414-1.414M17.95 8.05l1.414-1.414"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-5 h-5 text-blue-300"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z"/></svg>
      )}
    </button>
  );
}
