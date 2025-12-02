"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { useUserStore } from "../state/userStore";
import UserDropdown from "./UserDropdown";
import { useBusinessStore } from "../state/businessStore";
import { api, activeBusiness as activeBusinessStorage } from "../lib/api";
import { BusinessPickerDialog, type Business } from "./business/BusinessPickerDialog";
import ThemeToggle from "./ThemeToggle";
import { useLanguageStore } from "../state/languageStore";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelector from "./LanguageSelector";

interface NavItem {
  key: string;
  href: string;
}

const navItems: NavItem[] = [
  { key: "navbar.home", href: "#hero" },
  { key: "navbar.shop", href: "/shop" },
  { key: "navbar.features", href: "#features" },
  { key: "navbar.process", href: "#process" },
  { key: "navbar.benefits", href: "#benefits" },
  { key: "navbar.pricing", href: "#pricing" },
  { key: "navbar.contact", href: "#cta" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const { setActiveBusiness, clearBusiness } = useBusinessStore();
  const [showBizPicker, setShowBizPicker] = useState(false);
  const [bizList, setBizList] = useState<Business[]>([]);
  const [canRenderPortal, setCanRenderPortal] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const navMaskGradient = "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)";
  const { locale } = useLanguageStore();
  const { t } = useTranslation();
  const landingSectionLabel = locale?.startsWith("en") ? "Landing section" : "Sección de landing";
  const dedicatedRouteLabel = locale?.startsWith("en") ? "Dedicated route" : "Ruta dedicada";

  useEffect(() => {
    setCanRenderPortal(true);
    return () => setCanRenderPortal(false);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);
  const closeUserSheet = useCallback(() => setShowUserSheet(false), []);

  useEffect(() => {
    let lastKnownY = typeof window !== "undefined" ? window.scrollY : 0;
    let rafId: number | null = null;

    const updateScrollState = () => {
      rafId = null;
      if (typeof window === "undefined") return;
      const currentY = window.scrollY;
      setScrollY(currentY);
      const delta = currentY - lastKnownY;
      if (Math.abs(delta) > 4) {
        setScrollDirection(delta > 0 ? "down" : "up");
        lastKnownY = currentY;
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScrollState);
      }
    };

    updateScrollState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (open) closeMenu();
        if (showUserSheet) closeUserSheet();
      }
    };

    if (open || showUserSheet) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKey);
    } else {
      document.body.style.overflow = previousOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousOverflow || "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, showUserSheet, closeMenu, closeUserSheet]);

  const handleLogout = () => {
    logout();
    closeMenu();
    closeUserSheet();
  };

  const isAdmin = Number(user?.id_rol) === 2;
  const firstName = user?.nombre?.split(" ")[0] ?? "";
  const userInitials = user?.nombre
    ? user.nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase() ?? "")
        .join("") || "FC"
    : "FC";
  const userEmail = user?.correo_electronico ?? "";
  const roleLabel = isAdmin ? "Admin" : (locale?.startsWith("en") ? "User" : "Usuario");

  const handleAdminPanel = async () => {
    const redirectToOnboarding = () => router.push("/onboarding/negocio");

    try {
      const list = await api.listMyBusinesses();
      const businesses: Business[] = Array.isArray(list)
        ? (list as any[])
            .map((biz) => ({
              id_negocio: String(biz.id_negocio ?? biz.id ?? biz.idNegocio ?? ""),
              nombre: biz.nombre ?? "Negocio",
              direccion: biz.direccion ?? null,
              telefono: biz.telefono ?? null,
              correo: biz.correo ?? null,
              logo_url: biz.logo_url ?? null,
              hero_image_url: biz.hero_image_url ?? null
            }))
            .filter((biz) => Boolean(biz.id_negocio))
        : [];

      if (businesses.length === 0) {
        redirectToOnboarding();
        return;
      }

      try {
        activeBusinessStorage.clear();
      } catch {}
      clearBusiness();
      setBizList(businesses);
      setShowBizPicker(true);
      closeMenu();
      closeUserSheet();
    } catch {
      redirectToOnboarding();
    }
  };

  const elevated = scrollY > 24;
  const hideOnScroll =
    scrollY > 240 && scrollDirection === "down" && !open && typeof window !== "undefined" && window.innerWidth < 768;

  const mobileMenu = canRenderPortal && open
    ? createPortal(
        <div className="md:hidden fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-[rgba(255,255,255,0.78)] backdrop-blur dark:bg-[rgba(2,6,23,0.82)]"
            onClick={closeMenu}
            aria-hidden
          />
          <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/80 bg-[var(--fc-surface-elevated)] text-[var(--fc-text-primary)] shadow-xl shadow-brand-100/60 dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.9)] dark:text-[var(--fc-text-primary)] dark:shadow-slate-950/60">
              <div className="pointer-events-none absolute inset-0 mix-blend-normal" aria-hidden>
                <div className="absolute inset-0 opacity-85 [background-image:radial-gradient(circle_at_4%_0%,rgba(233,74,111,0.18),transparent_55%)] dark:opacity-65 dark:[background-image:radial-gradient(circle_at_4%_0%,rgba(233,74,111,0.24),transparent_55%)]" />
                <div className="absolute inset-0 opacity-75 [background-image:radial-gradient(circle_at_96%_0%,rgba(76,193,173,0.15),transparent_55%)] dark:opacity-60 dark:[background-image:radial-gradient(circle_at_96%_0%,rgba(56,226,223,0.20),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--fc-surface-base)]/92 via-[var(--fc-surface-elevated)]/88 to-[var(--fc-surface-base)]/94 dark:from-[color:rgba(2,6,23,0.96)] dark:via-[color:rgba(15,23,42,0.82)] dark:to-[color:rgba(2,6,23,0.94)]" />
              </div>
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brand-100/70 text-[var(--fc-text-primary)] dark:border-brand-500/25">
                  <div className="flex items-center gap-3">
                    <Image src="/LogoFilaCero.svg" alt="FilaCero" width={32} height={32} className="drop-shadow-sm" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-brand-500/80 dark:text-brand-200/80">{locale?.startsWith("en") ? "Menu" : "Menú"}</p>
                      <p className="text-base font-semibold text-[var(--fc-text-primary)]">{locale?.startsWith("en") ? "Explore FilaCero" : "Explora FilaCero"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-200 dark:hover:bg-[color:rgba(15,23,42,0.9)]"
                    aria-label={locale?.startsWith("en") ? "Close menu" : "Cerrar menú"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="relative flex-1 overflow-y-auto px-5 pb-6 pt-4 space-y-3 text-[var(--fc-text-primary)]">
                  {navItems.map((item, index) => {
                    const content = (
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-brand-100 bg-white text-[0.8rem] font-semibold text-brand-600 shadow-sm dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-left">
                          <span className="block text-sm font-semibold text-[var(--fc-text-primary)]">{t(item.key)}</span>
                          <span className="block text-xs text-[var(--fc-text-secondary)] dark:text-slate-300">
                            {item.href.startsWith("#") ? landingSectionLabel : dedicatedRouteLabel}
                          </span>
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4 text-brand-500/80 dark:text-brand-200"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    );

                    const commonCls =
                      "block rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/70 px-4 py-3.5 shadow-sm transition hover:border-brand-300 hover:shadow-md text-[var(--fc-text-primary)] dark:border-brand-400/30 dark:from-[color:rgba(15,23,42,0.94)] dark:via-[color:rgba(15,23,42,0.82)] dark:to-[color:rgba(233,74,111,0.18)] dark:hover:border-brand-400/45 dark:hover:shadow-brand-950/40";

                    return item.href.startsWith("#") ? (
                      <a key={item.href} href={item.href} onClick={closeMenu} className={commonCls}>
                        {content}
                      </a>
                    ) : (
                      <Link key={item.href} href={item.href} onClick={closeMenu} className={commonCls}>
                        {content}
                      </Link>
                    );
                  })}
                </nav>

                <div className="relative border-t border-brand-100/70 bg-brand-50/60 px-5 py-5 space-y-3 dark:border-brand-400/35 dark:bg-[color:rgba(15,23,42,0.88)]">
                  <LanguageSelector variant="panel" />

                  {isAuthenticated && isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        closeMenu();
                        await handleAdminPanel();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 dark:border-brand-400/35 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100 dark:hover:bg-[color:rgba(15,23,42,0.88)]"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-500" />
                      {locale?.startsWith("en") ? "Go to POS" : "Ir al panel POS"}
                    </button>
                  )}

                  {!isAuthenticated && (
                    <div className="grid grid-cols-1 gap-2">
                      <Link
                        href="/auth/login"
                        className="w-full rounded-2xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 text-center transition hover:border-brand-300 hover:bg-brand-50 dark:border-brand-400/35 dark:text-brand-100 dark:hover:border-brand-300 dark:hover:bg-[color:rgba(15,23,42,0.85)]"
                        onClick={closeMenu}
                      >
                        {t("navbar.login")}
                      </Link>
                      <Link
                        href="/auth/register"
                        className="w-full rounded-2xl bg-brand-600 text-white px-4 py-3 text-sm font-semibold text-center shadow-lg shadow-[rgba(233,74,111,0.35)] transition hover:bg-brand-500"
                        onClick={closeMenu}
                      >
                        {locale?.startsWith("en") ? "Create account" : "Crear cuenta gratis"}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  const userSheet = canRenderPortal && showUserSheet && user
    ? createPortal(
        <div className="md:hidden fixed inset-0 z-[75]">
          <div
            className="absolute inset-0 bg-[rgba(255,255,255,0.78)] backdrop-blur dark:bg-[rgba(2,6,23,0.82)]"
            onClick={closeUserSheet}
            aria-hidden
          />
          <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/80 bg-[var(--fc-surface-elevated)] text-[var(--fc-text-primary)] shadow-xl shadow-brand-100/60 dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.9)] dark:text-[var(--fc-text-primary)] dark:shadow-slate-950/60">
              <div className="pointer-events-none absolute inset-0 mix-blend-normal" aria-hidden>
                <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_6%_0%,rgba(233,74,111,0.18),transparent_55%)] dark:opacity-60 dark:[background-image:radial-gradient(circle_at_6%_0%,rgba(233,74,111,0.26),transparent_55%)]" />
                <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_94%_0%,rgba(76,193,173,0.16),transparent_55%)] dark:opacity-55 dark:[background-image:radial-gradient(circle_at_94%_0%,rgba(56,226,223,0.2),transparent_55%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--fc-surface-base)]/94 via-[var(--fc-surface-elevated)]/88 to-[var(--fc-surface-base)]/94 dark:from-[color:rgba(2,6,23,0.96)] dark:via-[color:rgba(15,23,42,0.82)] dark:to-[color:rgba(2,6,23,0.94)]" />
              </div>
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brand-100/70 text-[var(--fc-text-primary)] dark:border-brand-500/25">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-700 dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100">
                      {userInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--fc-text-primary)] truncate">{user.nombre}</p>
                      {userEmail && <p className="text-xs text-[var(--fc-text-secondary)] truncate dark:text-slate-300">{userEmail}</p>}
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100">
                        {locale?.startsWith("en") ? "Session" : "Sesión"} • {roleLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeUserSheet}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100 dark:hover:bg-[color:rgba(15,23,42,0.9)]"
                    aria-label={locale?.startsWith("en") ? "Close user panel" : "Cerrar panel de usuario"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative flex-1 overflow-y-auto px-5 py-6 space-y-4 text-[var(--fc-text-primary)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-500/70 dark:text-brand-200/70">{locale?.startsWith("en") ? "Actions" : "Acciones"}</p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        closeUserSheet();
                        await handleAdminPanel();
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50 dark:border-brand-400/40 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-brand-100 dark:hover:bg-[color:rgba(15,23,42,0.88)]"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand-500" />
                      <span>{locale?.startsWith("en") ? "Go to POS" : "Ir al panel POS"}</span>
                    </button>
                  )}

                  <Link
                    href="/user"
                    onClick={closeUserSheet}
                    className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-[var(--fc-text-primary)] shadow-sm transition hover:bg-brand-50 dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-text-primary)] dark:hover:bg-[color:rgba(15,23,42,0.9)]"
                  >
                    <Settings className="h-4 w-4 text-brand-500" />
                    <span>{locale?.startsWith("en") ? "My profile" : "Mi perfil"}</span>
                  </Link>

                  <div className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-[var(--fc-text-primary)] shadow-sm dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:text-[var(--fc-text-primary)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">{locale?.startsWith("en") ? "Theme" : "Tema"}</p>
                        <p className="mt-1 text-xs font-medium text-[var(--fc-text-secondary)] dark:text-white/70">
                          {locale?.startsWith("en") ? "Toggle between light and dark." : "Alterna entre claro y oscuro."}
                        </p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>

                  <LanguageSelector variant="panel" />
                </div>

                <div className="relative border-t border-brand-100/70 bg-brand-50/60 px-5 py-5 dark:border-brand-400/35 dark:bg-[color:rgba(15,23,42,0.88)]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-500/15 dark:border-red-500/35 dark:bg-[color:rgba(127,29,29,0.62)] dark:text-red-100 dark:hover:bg-[color:rgba(127,29,29,0.72)]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{locale?.startsWith("en") ? "Sign out" : "Cerrar sesión"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out ${
          hideOnScroll ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        role="banner"
      >
        <div
          className={`absolute inset-0 -z-10 transition-all duration-300 ${
            elevated
              ? "backdrop-blur-xl bg-white/90 dark:bg-slate-950/70 border-b border-white/70 dark:border-white/10 shadow-lg shadow-brand-100/40"
              : "bg-gradient-to-b from-white/75 via-white/40 to-transparent dark:from-slate-950/70 dark:via-slate-950/35"
          }`}
          aria-hidden
        />
        <nav className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="hidden sm:inline text-[2rem] font-extrabold select-none">
              <span style={{ color: "var(--fc-brand-600)" }}>Fila</span>
              <span style={{ color: "var(--fc-teal-500)" }}>Cero</span>
            </span>
          </Link>

          {/* Middle nav (desktop) */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <div
              className="flex w-full max-w-4xl flex-nowrap items-center gap-1.5 overflow-x-auto rounded-full border border-white/60 bg-white/30 px-2 py-1 text-sm shadow-sm backdrop-blur-sm transition [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden dark:border-white/10 dark:bg-slate-950/25"
              style={{ maskImage: navMaskGradient, WebkitMaskImage: navMaskGradient }}
            >
              {navItems.map((item) => {
                const navClasses =
                  "group relative inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-brand-600 transition-colors duration-200 hover:bg-white/90 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-slate-900/70";

                const content = (
                  <>
                    <span
                      className="inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-200 transition-colors duration-300 group-hover:bg-[var(--fc-teal-500)]"
                      aria-hidden
                    />
                    <span className="relative font-semibold">
                      {t(item.key)}
                      <span
                        className="absolute -bottom-1 left-0 right-0 h-[2px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[var(--fc-brand-500)] to-[var(--fc-teal-500)] transition-transform duration-300 group-hover:scale-x-100"
                        aria-hidden
                      />
                    </span>
                  </>
                );

                if (item.href.startsWith("#")) {
                  return (
                    <a key={item.href} href={item.href} className={navClasses}>
                      {content}
                    </a>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} className={navClasses}>
                    {content}
                  </Link>
                );
              })}

              {isAuthenticated && isAdmin && (
                <button
                  type="button"
                  onClick={handleAdminPanel}
                  className="group relative inline-flex flex-shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-brand-600 transition-colors duration-200 hover:bg-white/90 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 dark:hover:bg-slate-900/70"
                >
                  <LayoutDashboard className="h-4 w-4 text-brand-500" />
                  <span className="relative font-semibold">
                    {locale?.startsWith("en") ? "POS panel" : "Panel POS"}
                    <span
                      className="absolute -bottom-1 left-0 right-0 h-[2px] origin-left scale-x-0 rounded-full bg-gradient-to-r from-[var(--fc-brand-500)] to-[var(--fc-teal-500)] transition-transform duration-300 group-hover:scale-x-100"
                      aria-hidden
                    />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right auth area */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector variant="compact" />
            {!isAuthenticated && <ThemeToggle variant="icon" />}
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full border border-brand-100/80 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t("navbar.login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(233,74,111,0.3)] transition hover:bg-brand-500"
                >
                  {locale?.startsWith("en") ? "Create account" : "Crear cuenta"}
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector variant="compact" />
            {!isAuthenticated && <ThemeToggle variant="icon" />}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setShowUserSheet(true);
                  setOpen(false);
                }}
                className={`relative inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  elevated
                    ? "border border-brand-200/70 bg-white/95 text-brand-600 shadow-sm hover:bg-white dark:border-white/12 dark:bg-slate-950/80 dark:text-brand-200 dark:hover:!bg-slate-900 dark:hover:border-brand-400/40"
                    : "border border-white/70 bg-white/85 text-brand-600 shadow-sm hover:bg-white/95 dark:border-white/15 dark:bg-slate-950/70 dark:text-brand-200 dark:hover:!bg-slate-900 dark:hover:border-brand-400/40"
                }`}
              >
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-sm font-semibold dark:bg-brand-500/20 dark:text-brand-100">
                  {userInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" aria-hidden />
                </span>
                <span className="flex flex-col leading-tight text-left">
                  <span className="text-[10px] uppercase tracking-wide text-brand-500/80">{locale?.startsWith("en") ? "Active session" : "Sesión activa"}</span>
                  <span className="text-xs font-semibold text-brand-700 max-w-[96px] truncate">{firstName || (locale?.startsWith("en") ? "Account" : "Cuenta")}</span>
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  elevated
                    ? "border border-slate-200/80 bg-white/95 text-brand-600 shadow-sm hover:bg-white dark:border-white/10 dark:bg-slate-950/75 dark:text-brand-200 dark:hover:bg-slate-900"
                    : "border border-white/70 bg-white/85 text-brand-600 shadow-sm hover:bg-white/95 dark:border-white/15 dark:bg-slate-950/65 dark:text-brand-200 dark:hover:bg-slate-900"
                }`}
              >
                {t("navbar.login")}
              </Link>
            )}

            <button
              aria-label={open ? (locale?.startsWith("en") ? "Close menu" : "Cerrar menú") : (locale?.startsWith("en") ? "Open menu" : "Abrir menú")}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-400)] ${
                elevated
                  ? "border-slate-200/80 bg-white/95 text-[var(--fc-brand-600)] shadow-sm hover:bg-white dark:border-white/12 dark:bg-slate-950/80 dark:text-brand-200 dark:hover:!bg-slate-900 dark:hover:border-brand-400/40"
                  : "border-white/60 bg-white/80 text-[var(--fc-brand-600)] shadow-sm hover:bg-white/95 dark:border-white/15 dark:bg-slate-950/70 dark:text-brand-200 dark:hover:!bg-slate-900 dark:hover:border-brand-400/35"
              }`}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="sr-only">{locale?.startsWith("en") ? "Toggle menu" : "Alternar menú"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>
      {mobileMenu}
      {userSheet}

      {/* Business picker dialog */}
      {canRenderPortal && showBizPicker && createPortal(
        <BusinessPickerDialog
          open={showBizPicker}
          businesses={bizList}
          onChoose={(b) => {
            activeBusinessStorage.set(String(b.id_negocio));
            setActiveBusiness(b);
            setShowBizPicker(false);
            router.push("/pos");
          }}
          onCreateNew={() => {
            setShowBizPicker(false);
            router.push("/onboarding/negocio");
          }}
          onClose={() => setShowBizPicker(false)}
        />,
        document.body
      )}
    </>
  );
}
