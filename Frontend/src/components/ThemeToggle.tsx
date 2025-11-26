"use client";
import { useMemo } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeStore, type ThemeMode } from "../state/themeStore";

const order: ThemeMode[] = ["light", "dark", "system"];

function nextMode(current: ThemeMode): ThemeMode {
  const index = order.indexOf(current);
  if (index === -1) return "system";
  return order[(index + 1) % order.length];
}

interface ThemeToggleProps {
  variant?: "chip" | "icon";
}

export function ThemeToggle({ variant = "chip" }: ThemeToggleProps) {
  const mode = useThemeStore((state) => state.mode);
  const resolved = useThemeStore((state) => state.resolved);
  const setMode = useThemeStore((state) => state.setMode);

  const icon = useMemo(() => {
    if (mode === "system") {
      return resolved === "dark" ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />;
    }
    if (mode === "dark") return <Moon className="h-4 w-4" aria-hidden />;
    return <Sun className="h-4 w-4" aria-hidden />;
  }, [mode, resolved]);

  const label = useMemo(() => {
    switch (mode) {
      case "dark":
        return "Modo oscuro activo";
      case "light":
        return "Modo claro activo";
      default:
        return resolved === "dark" ? "Modo sistema (oscuro)" : "Modo sistema (claro)";
    }
  }, [mode, resolved]);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setMode(nextMode(mode))}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200"
        aria-label={label}
      >
        {mode === "system" ? <Monitor className="h-4 w-4" aria-hidden /> : icon}
      </button>
    );
  }

  const modeChip = useMemo(() => {
    switch (mode) {
      case "dark":
        return "Oscuro";
      case "light":
        return "Claro";
      default:
        return "Sistema";
    }
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode(mode))}
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-200"
      aria-label={label}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-900/5 text-slate-600 shadow-inner group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-white/5 dark:text-slate-200 dark:group-hover:bg-brand-500/20 dark:group-hover:text-brand-200">
        {mode === "system" ? <Monitor className="h-3.5 w-3.5" aria-hidden /> : icon}
      </span>
      <span className="tracking-wide uppercase">{modeChip}</span>
    </button>
  );
}

export default ThemeToggle;
