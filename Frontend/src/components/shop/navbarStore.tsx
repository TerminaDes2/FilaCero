"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "../../state/userStore";
import UserDropdown from "../UserDropdown";
import { useCart } from "./CartContext";
import ThemeToggle from "../ThemeToggle";
import LanguageSelector from "../LanguageSelector";
import { useTranslation } from "../../hooks/useTranslation";

interface NavbarStoreProps {
  onToggleCart?: (open: boolean) => void;
}

export default function NavbarStore({ onToggleCart }: NavbarStoreProps) {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, loading } = useUserStore();
  const { open, toggleOpen, items } = useCart();
  const router = useRouter();
  const params = useSearchParams();
  const searchParam = params.get("search") ?? "";
  const [query, setQuery] = useState(searchParam);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayInputRef = useRef<HTMLInputElement | null>(null);
  const [canRenderPortal, setCanRenderPortal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setQuery(searchParam);
  }, [searchParam]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setCanRenderPortal(true);
    return () => setCanRenderPortal(false);
  }, []);

  useEffect(() => {
    if (showSearchOverlay) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const timeout = setTimeout(() => overlayInputRef.current?.focus(), 50);
      return () => {
        clearTimeout(timeout);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showSearchOverlay]);

  useEffect(() => {
    if (!showSearchOverlay) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowSearchOverlay(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showSearchOverlay]);

  useEffect(() => {
    if (!showSearchOverlay) return;
    const handleScrollAttempt = (event: Event) => {
      event.preventDefault();
      setShowSearchOverlay(false);
    };
    window.addEventListener("wheel", handleScrollAttempt, { passive: false });
    window.addEventListener("touchmove", handleScrollAttempt, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleScrollAttempt);
      window.removeEventListener("touchmove", handleScrollAttempt);
    };
  }, [showSearchOverlay]);

  const applySearch = useCallback((value: string) => {
    const entries = Array.from(params.entries());
    const nextParams = new URLSearchParams(entries);
    const trimmed = value.trim();
    if (trimmed) {
      nextParams.set("search", trimmed);
    } else {
      nextParams.delete("search");
    }
    const queryString = nextParams.toString();
    router.push(queryString ? `?${queryString}` : "?", { scroll: false });
  }, [params, router]);

  const closeSearchOverlay = useCallback(() => {
    setShowSearchOverlay(false);
  }, []);

  const handleSearchSubmit = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setQuery(value);
    applySearch(value);
  }, [applySearch]);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      applySearch(value);
    }, 250);
  }, [applySearch]);

  const openCart = () => {
    toggleOpen(true);
    onToggleCart?.(true);
  };

  if (loading) return null;

  const showControls = isAuthenticated;

  const cartTitle = items.length === 0
    ? t("shop.nav.cart.emptyTitle")
    : t("shop.nav.cart.itemsTitle", { count: items.length });
  const cartSubtitle = items.length === 0
    ? t("shop.nav.cart.emptySubtitle")
    : t("shop.nav.cart.readyToPay");

  const floatingCartButton = showControls && !open && canRenderPortal
    ? createPortal(
        <button
          type="button"
          onClick={openCart}
          className="md:hidden fixed bottom-6 right-4 z-50 group"
          aria-label={t("shop.nav.cart.openAria")}
        >
          <div className="relative flex items-center gap-3 rounded-[26px] border border-white/60 bg-white/90 px-4 py-3 shadow-[0_18px_38px_-18px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-all duration-200 group-active:scale-95 dark:border-white/15 dark:bg-[color:rgba(6,10,28,0.88)] dark:shadow-[0_22px_60px_-36px_rgba(2,6,23,0.92)]">
            <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--fc-brand-600)] via-[var(--fc-brand-500)] to-[var(--fc-teal-500)] text-white shadow-[0_12px_20px_-10px_rgba(15,23,42,0.55)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </span>
            <span className="min-w-[110px] text-left">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-200">{t("shop.nav.cart.badge")}</span>
              <span className="block text-sm font-semibold text-[var(--fc-text-primary)] dark:text-white">{cartTitle}</span>
              <span className="block text-[11px] text-[var(--fc-text-secondary)] dark:text-slate-300">{cartSubtitle}</span>
            </span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full border border-white/70 bg-[var(--fc-brand-600)] px-2 text-[11px] font-bold text-white shadow-[0_8px_16px_-10px_rgba(15,23,42,0.6)] dark:border-white/20">
                {items.length}
              </span>
            )}
            <span className="absolute -bottom-5 inset-x-6 h-8 rounded-full bg-gradient-to-r from-[var(--fc-brand-500)]/30 via-[var(--fc-brand-400)]/10 to-[var(--fc-teal-400)]/20 blur-2xl opacity-70" aria-hidden />
          </div>
        </button>,
        document.body,
      )
    : null;

  const searchOverlayPortal = showControls && showSearchOverlay && canRenderPortal
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/65"
          role="dialog"
          aria-modal="true"
          onClick={closeSearchOverlay}
        >
          <div className="mt-28 w-full max-w-xl px-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-3xl border border-slate-200/60 bg-white shadow-[0_24px_55px_-26px_rgba(15,23,42,0.75)] dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.95)] dark:shadow-[0_30px_70px_-42px_rgba(2,6,23,0.95)]">
              <div className="flex items-center gap-3 px-5 py-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/90 text-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.7)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  ref={overlayInputRef}
                  value={query}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      closeSearchOverlay();
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchSubmit((e.target as HTMLInputElement).value);
                      closeSearchOverlay();
                    }
                  }}
                  placeholder="Buscar productos"
                  className="flex-1 bg-transparent text-[17px] font-semibold text-[var(--fc-text-primary)] placeholder:text-slate-400 focus:outline-none dark:placeholder:text-slate-500"
                  aria-label="Buscar en la tienda"
                />
                <button
                  onClick={closeSearchOverlay}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 text-slate-500 hover:bg-slate-100 dark:border-white/15 dark:text-slate-300 dark:hover:bg-[color:rgba(15,23,42,0.8)]"
                  aria-label="Cerrar buscador"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
    <header className={`fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 dark:border-white/12 ${scrolled
        ? "bg-white/95 shadow dark:bg-[color:rgba(4,8,24,0.94)] dark:shadow-[0_26px_60px_-48px_rgba(2,6,23,0.92)]"
        : "bg-white/80 dark:bg-[color:rgba(4,8,24,0.86)]"} backdrop-blur bg-[radial-gradient(1200px_160px_at_10%_-60px,rgba(233,74,111,0.08),transparent_60%),radial-gradient(900px_140px_at_90%_-70px,rgba(76,193,173,0.08),transparent_60%)] dark:bg-[radial-gradient(1200px_160px_at_10%_-60px,rgba(211,67,102,0.14),transparent_60%),radial-gradient(900px_140px_at_90%_-70px,rgba(20,184,166,0.16),transparent_60%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(2,6,23,0.88))]`}>
      <nav className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-4">
        {/* Left: Brand + Store tag */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/LogoFilaCero.svg"
              alt="FilaCero"
              width={28}
              height={28}
              priority
              className="w-7 h-7"
            />
            <span className="hidden sm:inline text-[1.25rem] leading-none font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--fc-text-secondary)] hover:text-[var(--fc-brand-600)] hover:border-[var(--fc-brand-200)] transition dark:border-white/12 dark:text-[var(--fc-text-secondary)] dark:hover:text-[var(--fc-brand-200)]"
          >
            {t("shop.nav.storeBadge")}
          </Link>
        </div>

        {/* Middle: Search (only for authenticated users) */}
        {showControls && (
          <div className="hidden md:block flex-1 min-w-0">
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("shop.nav.searchPlaceholder")}
                className="w-full h-10 pl-8 pr-8 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-300 outline-none text-sm text-[var(--fc-text-primary)] placeholder:text-slate-400 transition dark:bg-[color:rgba(15,23,42,0.92)] dark:text-[var(--fc-text-primary)] dark:border-white/12 dark:focus:border-[var(--fc-brand-300)] dark:placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => {
                    if (debounceRef.current) {
                      clearTimeout(debounceRef.current);
                    }
                    setQuery("");
                    applySearch("");
                  }}
                  aria-label={t("shop.nav.searchClearAria")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right: language + actions */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            <LanguageSelector variant="compact" />
            {!showControls && <ThemeToggle variant="icon" />}
          </div>
          {showControls && (
            <>
              <button aria-label="Notifications" className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-white/12 dark:text-[var(--fc-text-secondary)] dark:hover:bg-[color:rgba(15,23,42,0.8)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </button>
              <button onClick={openCart} className="relative hidden md:inline-flex items-center gap-2 pl-3 pr-3 h-10 rounded-full bg-[var(--fc-brand-600)] text-white hover:bg-[var(--fc-brand-500)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span className="text-sm font-semibold">{items.length}</span>
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[11px] font-bold text-[var(--fc-brand-600)] grid place-items-center shadow-sm">
                    {items.length}
                  </span>
                )}
              </button>
            </>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center">
                <UserDropdown />
              </div>
              <button
                type="button"
                onClick={() => setShowSearchOverlay(true)}
                className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 bg-white/80 backdrop-blur hover:border-[var(--fc-brand-200)] hover:text-[var(--fc-brand-600)] transition dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.8)] dark:text-[var(--fc-text-secondary)] dark:hover:border-[var(--fc-brand-300)] dark:hover:text-[var(--fc-brand-200)]"
                aria-label={t("shop.nav.searchMobileAria")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSelector variant="compact" />
              <ThemeToggle variant="icon" />
              <Link
                href="/auth/login"
                className="inline-flex h-10 items-center px-3 rounded-full text-sm font-medium text-[var(--fc-text-primary)] border border-slate-200 bg-white/85 backdrop-blur transition hover:border-[var(--fc-brand-200)] hover:text-[var(--fc-brand-600)] dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.8)] dark:text-[var(--fc-text-primary)] dark:hover:text-[var(--fc-brand-200)]"
              >
                {t("navbar.login")}
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex h-10 items-center px-3 rounded-full text-sm font-semibold text-white bg-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)] shadow-sm"
              >
                {t("navbar.signup")}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
    {floatingCartButton}
    {searchOverlayPortal}
    </>
  );
}
