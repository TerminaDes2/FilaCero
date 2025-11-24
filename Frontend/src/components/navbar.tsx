"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { LayoutDashboard, User, LogOut, Settings } from "lucide-react";
import { useUserStore } from "../state/userStore";
import UserDropdown from "./UserDropdown";
import { useBusinessStore } from "../state/businessStore";
import { api } from "../lib/api";
import { BusinessPickerDialog, type Business } from "./business/BusinessPickerDialog";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "#hero" },
  { label: "Compra ya", href: "/shop" },
  { label: "Características", href: "#features" },
  { label: "Flujo", href: "#process" },
  { label: "Beneficios", href: "#benefits" },
  { label: "Precios", href: "#pricing" },
  { label: "Contacto", href: "#cta" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUserStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const [showBizPicker, setShowBizPicker] = useState(false);
  const [bizList, setBizList] = useState<Business[]>([]);
  const [canRenderPortal, setCanRenderPortal] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);

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
  const roleLabel = isAdmin ? "Admin" : "Usuario";

  const handleAdminPanel = async () => {
    if (!activeBusiness) {
      try {
        const list = await api.listMyBusinesses();
        setBizList((list || []) as Business[]);
      } catch {
        setBizList([]);
      }
      setShowBizPicker(true);
      return;
    }
    router.push("/pos");
  };

  const elevated = scrollY > 24;
  const hideOnScroll =
    scrollY > 240 && scrollDirection === "down" && !open && typeof window !== "undefined" && window.innerWidth < 768;

  const mobileMenu = canRenderPortal && open
    ? createPortal(
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-white/70 backdrop-blur" onClick={closeMenu} aria-hidden />
          <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/80 bg-white text-slate-900 shadow-xl shadow-brand-100/60">
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(circle at 4% 0%, rgba(233,74,111,0.16), transparent 55%), radial-gradient(circle at 96% 0%, rgba(76,193,173,0.14), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.96) 100%)"
                }}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brand-100/70">
                  <div className="flex items-center gap-3">
                    <Image src="/LogoFilaCero.svg" alt="FilaCero" width={32} height={32} className="drop-shadow-sm" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-brand-500/80">Menú</p>
                      <p className="text-base font-semibold text-slate-900">Explora FilaCero</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeMenu}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50"
                    aria-label="Cerrar menú"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="relative flex-1 overflow-y-auto px-5 pb-6 pt-4 space-y-3">
                  {navItems.map((item, index) => {
                    const content = (
                      <span className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-brand-100 bg-white text-[0.8rem] font-semibold text-brand-600 shadow-sm">
                          {(index + 1).toString().padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-left">
                          <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
                          <span className="block text-xs text-slate-500">
                            {item.href.startsWith("#") ? "Sección de landing" : "Ruta dedicada"}
                          </span>
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4 text-brand-500/80"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    );

                    const commonCls =
                      "block rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/70 px-4 py-3.5 shadow-sm transition hover:border-brand-200 hover:shadow-md";

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

                <div className="relative border-t border-brand-100/70 bg-brand-50/60 px-5 py-5 space-y-3">
                  {isAuthenticated && isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        closeMenu();
                        await handleAdminPanel();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand-500" />
                      Ir al panel POS
                    </button>
                  )}

                  {!isAuthenticated && (
                    <div className="grid grid-cols-1 gap-2">
                      <Link
                        href="/login"
                        className="w-full rounded-2xl border border-brand-200 px-4 py-3 text-sm font-semibold text-brand-600 text-center transition hover:border-brand-300 hover:bg-brand-50"
                        onClick={closeMenu}
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/register"
                        className="w-full rounded-2xl bg-brand-600 text-white px-4 py-3 text-sm font-semibold text-center shadow-lg shadow-[rgba(233,74,111,0.35)] transition hover:bg-brand-500"
                        onClick={closeMenu}
                      >
                        Crear cuenta gratis
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
          <div className="absolute inset-0 bg-white/70 backdrop-blur" onClick={closeUserSheet} aria-hidden />
          <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/80 bg-white text-slate-900 shadow-xl shadow-brand-100/60">
              <div
                className="absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "radial-gradient(circle at 6% 0%, rgba(233,74,111,0.15), transparent 55%), radial-gradient(circle at 94% 0%, rgba(76,193,173,0.14), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(245,248,255,0.96) 100%)"
                }}
              />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brand-100/70">
                  <div className="flex items-center gap-3">
                    <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-700">
                      {userInitials}
                      <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{user.nombre}</p>
                      {userEmail && <p className="text-xs text-slate-500 truncate">{userEmail}</p>}
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                        Sesión • {roleLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeUserSheet}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50"
                    aria-label="Cerrar panel de usuario"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="relative flex-1 overflow-y-auto px-5 py-6 space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-brand-500/70">Acciones</p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={async () => {
                        closeUserSheet();
                        await handleAdminPanel();
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-brand-500" />
                      <span>Ir al panel POS</span>
                    </button>
                  )}

                  <Link
                    href="/user"
                    onClick={closeUserSheet}
                    className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-brand-50"
                  >
                    <Settings className="h-4 w-4 text-brand-500" />
                    <span>Mi perfil</span>
                  </Link>

                  <Link
                    href="/shop"
                    onClick={closeUserSheet}
                    className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-semibold text-brand-600 shadow-sm transition hover:bg-brand-50"
                  >
                    <User className="h-4 w-4 text-brand-500" />
                    <span>Ver tienda demo</span>
                  </Link>
                </div>

                <div className="relative border-t border-brand-100/70 bg-brand-50/60 px-5 py-5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-500/15"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
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
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item, index) => {
              const navClasses =
                "group inline-flex items-center gap-2 rounded-full border border-brand-100/80 bg-white/80 px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300";
              const badge = (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl border border-brand-100 bg-white text-[0.75rem] font-semibold text-brand-600 shadow-sm">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              );
              const label = <span className="text-sm font-semibold text-brand-700">{item.label}</span>;

              if (item.href.startsWith("#")) {
                return (
                  <a key={item.href} href={item.href} className={navClasses}>
                    {badge}
                    {label}
                  </a>
                );
              }

              return (
                <Link key={item.href} href={item.href} className={navClasses}>
                  {badge}
                  {label}
                </Link>
              );
            })}

            {isAuthenticated && isAdmin && (
              <button
                type="button"
                onClick={handleAdminPanel}
                className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/70 hover:text-brand-800"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-500" />
                <span>Panel POS</span>
              </button>
            )}
          </div>

          {/* Right auth area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <UserDropdown />
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full border border-brand-100/80 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(233,74,111,0.3)] transition hover:bg-brand-500"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  setShowUserSheet(true);
                  setOpen(false);
                }}
                className={`relative inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  elevated
                    ? "border border-brand-200/70 bg-white/95 text-brand-600 shadow-sm hover:bg-white"
                    : "border border-white/70 bg-white/85 text-brand-600 shadow-sm hover:bg-white/95"
                }`}
              >
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 text-sm font-semibold">
                  {userInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" aria-hidden />
                </span>
                <span className="flex flex-col leading-tight text-left">
                  <span className="text-[10px] uppercase tracking-wide text-brand-500/80">Sesión activa</span>
                  <span className="text-xs font-semibold text-brand-700 max-w-[96px] truncate">{firstName || "Cuenta"}</span>
                </span>
              </button>
            ) : (
              <Link
                href="/login"
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  elevated
                    ? "border border-slate-200/80 bg-white/95 text-brand-600 shadow-sm hover:bg-white"
                    : "border border-white/70 bg-white/85 text-brand-600 shadow-sm hover:bg-white/95"
                }`}
              >
                Inicia sesión
              </Link>
            )}

            <button
              aria-label="Abrir menú"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-400)] ${
                elevated
                  ? "border-slate-200/80 bg-white/95 text-[var(--fc-brand-600)] shadow-sm hover:bg-white"
                  : "border-white/60 bg-white/80 text-[var(--fc-brand-600)] shadow-sm hover:bg-white/95"
              }`}
              onClick={() => setOpen((o) => !o)}
            >
              <span className="sr-only">Menú</span>
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
      {showBizPicker && (
        <BusinessPickerDialog
          open={showBizPicker}
          businesses={bizList}
          onChoose={(b) => {
            setActiveBusiness(b);
            setShowBizPicker(false);
            router.push("/pos");
          }}
          onCreateNew={() => {
            setShowBizPicker(false);
            router.push("/onboarding/negocio");
          }}
          onClose={() => setShowBizPicker(false)}
        />
      )}
    </>
  );
}
