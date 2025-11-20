"use client";
import Link from "next/link";
import {
  Home,
  ShoppingBasket,
  ShoppingBag,
  CupSoda,
  Sparkles,
  Gift,
  Pill,
  PartyPopper,
  Search,
  UserRound,
} from "lucide-react";

type Item = { label: string; href: string; icon: React.FC<{ className?: string }> };

const items: Item[] = [
  { label: "Home", href: "/shop", icon: Home },
  { label: "Grocery", href: "/shop?cat=grocery", icon: ShoppingBasket },
  { label: "Retail", href: "/shop?cat=retail", icon: ShoppingBag },
  { label: "Convenience", href: "/shop?cat=convenience", icon: CupSoda },
  { label: "Beauty", href: "/shop?cat=beauty", icon: Sparkles },
  { label: "Gift Cards", href: "/shop?cat=gifts", icon: Gift },
  { label: "CBD/THC", href: "/shop?cat=cbd", icon: Pill },
  { label: "Party", href: "/shop?cat=party", icon: PartyPopper },
  { label: "Browse All", href: "/shop/browse", icon: Search },
];

export default function ShopSidebar() {
  return (
    <aside className="hidden lg:block w-64 shrink-0" aria-label="Navegación de la tienda">
      <div className="sticky top-16 p-4">
        <nav className="space-y-5" aria-label="Secciones de compra">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[15px] text-slate-800 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <it.icon className="w-6 h-6 text-slate-800" />
              <span className="font-medium">{it.label}</span>
            </Link>
          ))}
          <hr className="my-2 border-slate-200" />
          <Link
            href="/auth/login"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[15px] text-slate-800 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <UserRound className="w-6 h-6" />
            <span className="font-medium">Sign up or Login</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
