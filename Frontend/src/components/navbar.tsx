"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

interface NavItem {
	label: string;
	href: string;
}

const navItems: NavItem[] = [
	{ label: "Inicio", href: "#hero" },
	{ label: "Características", href: "#features" },
	{ label: "Flujo", href: "#process" },
	{ label: "Beneficios", href: "#benefits" },
	{ label: "Precios", href: "#pricing" },
	{ label: "Testimonios", href: "#testimonials" },
	{ label: "Contacto", href: "#cta" },
];

export default function Navbar() {
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => {
			setScrolled(window.scrollY > 8);
		};
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
			<header
				className={`fixed top-0 left-0 right-0 z-40 transition ${scrolled ? "backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 shadow" : "bg-transparent"}`}
				role="banner"
			>
				<nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main">
				<Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
					<Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
					<span className="hidden sm:inline text-[2rem] font-extrabold select-none">
						<span style={{ color: '#D55D7B' }}>Fila</span><span style={{ color: '#4CC1AD' }}>Cero</span>
					</span>
				</Link>
				<div className="hidden md:flex gap-8">
					{navItems.map(item => (
						<a
							key={item.href}
							href={item.href}
								className="relative text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:outline-none rounded after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand-600 dark:after:bg-brand-400 after:transition-all hover:after:w-full"
						>
							{item.label}
						</a>
					))}
				</div>
							<div className="hidden md:flex items-center gap-3">
								<Link
									href="/auth/login"
									className="text-sm font-medium px-4 py-2 rounded-full border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
								>
									Iniciar sesión
								</Link>
								<Link
									href="/auth/register"
									className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-500 transition shadow-glow"
								>
									Crear cuenta
								</Link>
						</div>
				<button
					aria-label="Abrir menú"
						className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded border border-gray-300 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur"
					onClick={() => setOpen(o => !o)}
				>
					<span className="sr-only">Menú</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="w-6 h-6"
					>
						{open ? (
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						) : (
							<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
						)}
					</svg>
				</button>
			</nav>
					{open && (
						<div className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-4 pb-6 pt-2 space-y-2">
					{navItems.map(item => (
						<a
							key={item.href}
							href={item.href}
							onClick={() => setOpen(false)}
									className="block text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400"
						>
							{item.label}
						</a>
					))}
					<div className="pt-2 flex gap-3">
						<Link
							href="/auth/login"
							className="flex-1 text-sm font-medium px-4 py-2 rounded-full border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 text-center hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
							onClick={() => setOpen(false)}
						>
							Iniciar sesión
						</Link>
						<Link
							href="/auth/register"
							className="flex-1 text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-500 transition shadow"
							onClick={() => setOpen(false)}
						>
							Crear cuenta
						</Link>
					</div>
										{/* Toggle de tema removido */}
				</div>
			)}
		</header>
	);
}
