"use client";
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCategoriesStore } from '../../pos/categoriesStore';

interface NavItem {
	key: string;
	label: string;
	href: string;
	icon: React.ReactNode;
	accent?: string; // optional color accent token/class
}

const baseIconClass = 'w-6 h-6 stroke-current';

const items: NavItem[] = [
	{
		key: 'logo',
		label: 'Inicio',
		href: '/pos',
		accent: 'from-amber-50 to-amber-100 dark:from-amber-300/20 dark:to-amber-300/5',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7.5M4 9h9M4 14h5.5M4 19h9" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6h-6z" />
			</svg>
		)
	},
	{
		key: 'home',
		label: 'Inicio',
		href: '/pos',
		accent: 'from-amber-50 to-amber-100 dark:from-amber-300/20 dark:to-amber-300/5',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 5l8 6.5M6.5 10v8.25c0 .69.56 1.25 1.25 1.25H16.5c.69 0 1.25-.56 1.25-1.25V10" />
			</svg>
		)
	},
	{
		key: 'history',
		label: 'Historial',
		href: '/pos/history',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 1 2.64 6.36" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
			</svg>
		)
	},
	{
		key: 'categories',
		label: 'Categorías',
		href: '/pos/categories',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 10h13M10 14h10M13 18h7" />
			</svg>
		)
	},
	{
		key: 'products',
		label: 'Productos',
		href: '/pos/products',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l3 6H3z" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
			</svg>
		)
	},
	{
		key: 'analytics',
		label: 'Métricas',
		href: '/pos/analytics',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16M6 16v-5M10 16V8M14 16v-3M18 16v-8" />
			</svg>
		)
	},
	{
		key: 'staff',
		label: 'Staff',
		href: '/pos/staff',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z" />
			</svg>
		)
	},
	{
		key: 'customers',
		label: 'Clientes',
		href: '/pos/customers',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
			</svg>
		)
	}
];

const settingsItem: NavItem = {
	key: 'settings',
	label: 'Configuración',
	href: '/pos/settings',
	icon: (
		<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
			<path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
			<path strokeLinecap="round" strokeLinejoin="round" d="M4.9 6.3a1 1 0 0 1 .4-1.4l1.2-.7a1 1 0 0 1 1.3.2l.5.5a1 1 0 0 0 1.1.3 1 1 0 0 1 1.2.6l.3.7a1 1 0 0 0 .9.6h1a1 1 0 0 0 .9-.6l.3-.7a1 1 0 0 1 1.2-.6 1 1 0 0 0 1.1-.3l.5-.5a1 1 0 0 1 1.3-.2l1.2.7a1 1 0 0 1 .4 1.4l-.4.6a1 1 0 0 0 0 1.1 1 1 0 0 1 0 1.2 1 1 0 0 0 0 1.1l.4.6a1 1 0 0 1-.4 1.4l-1.2.7a1 1 0 0 1-1.3-.2l-.5-.5a1 1 0 0 0-1.1-.3 1 1 0 0 1-1.2-.6l-.3-.7a1 1 0 0 0-.9-.6h-1a1 1 0 0 0-.9.6l-.3.7a1 1 0 0 1-1.2.6 1 1 0 0 0-1.1.3l-.5.5a1 1 0 0 1-1.3.2l-1.2-.7a1 1 0 0 1-.4-1.4l.4-.6a1 1 0 0 0 0-1.1 1 1 0 0 1 0-1.2 1 1 0 0 0 0-1.1l-.4-.6Z" />
		</svg>
	)
};

export const PosSidebar: React.FC<{ collapsible?: boolean }> = ({ collapsible = true }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
	const { categories, selected, setSelected } = useCategoriesStore();
	const showCategories = useMemo(()=> categories.length > 0, [categories.length]);

  // Derived classes
  const widthClass = collapsed ? 'w-16' : 'w-56';

  return (
		<nav aria-label="Navegación principal POS" className={`h-full flex flex-col ${widthClass} relative rounded-r-2xl`} style={{background:'var(--pos-bg-sidebar)', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.25),0 4px 14px -4px rgba(149,37,55,0.35)'}}>
      {/* Header / Brand + Toggle */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 relative z-10 border-b border-white/30 dark:border-white/5">
		<div className="flex items-center gap-2">
			<div className="w-10 h-10 relative rounded-md overflow-hidden bg-white/90 shadow">
				<Image src="/LogoFilaCero.svg" alt="FilaCero" fill className="object-contain p-1" />
			</div>
			{!collapsed && (
				<span
					className="font-semibold tracking-tight text-[13px] leading-none whitespace-nowrap truncate"
					style={{ color: '#4f1920' }}
				>
					Punto de Venta
				</span>
			)}
		</div>
        {collapsible && (
					<button
						onClick={()=> setCollapsed(c=> !c)}
						aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
						className="ml-auto group relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/45 hover:bg-white/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
						style={{color:'#6d2530'}}
					>
						<span className="absolute inset-0 rounded-lg shadow-inner shadow-white/30 pointer-events-none" />
						<svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m10 6 6 6-6 6" /></svg>
					</button>
        )}
      </div>
      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 relative z-10 custom-scrollbar">
				{items.filter(i=> i.key !== 'logo').map(item => {
          const active = pathname === item.href || (item.key === 'home' && pathname === '/pos');
          return (
						<Link key={item.key} href={item.href} aria-current={active ? 'page' : undefined} className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${active ? 'bg-[rgba(255,255,255,0.85)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(255,255,255,0.92)] hover:bg-[rgba(255,255,255,0.28)]'}`}>
							<span className={`relative flex items-center justify-center w-8 h-8 rounded-md ${active ? 'bg-white/90' : 'bg-white/50 group-hover:bg-white/65'} shadow-inner shadow-white/30`}>
                {item.icon}
								<span className={`absolute -left-1 top-1 w-1 h-1 rounded-full transition-opacity ${active ? 'opacity-100 bg-[var(--pos-accent-green)]' : 'opacity-0 group-hover:opacity-60 bg-[var(--pos-accent-green)]'}`} />
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

				{showCategories && (
					<div className="pt-3 mt-3 border-t border-white/30 dark:border-white/5">
						{!collapsed && <div className="px-2.5 pb-1 text-[11px] uppercase tracking-wide font-semibold text-[rgba(255,255,255,0.75)]">Categorías</div>}
						<div className="space-y-1">
							<button
								onClick={()=> setSelected('all')}
								className={`group w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${selected==='all' ? 'bg-[rgba(255,255,255,0.85)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(255,255,255,0.92)] hover:bg-[rgba(255,255,255,0.28)]'}`}
							>
								<span className={`relative flex items-center justify-center w-8 h-8 rounded-md ${selected==='all' ? 'bg-white/90' : 'bg-white/50 group-hover:bg-white/65'} shadow-inner shadow-white/30`}>
									<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
								</span>
								{!collapsed && <span className="truncate">Todas</span>}
							</button>
							{categories.map(c => (
								<button key={c.id} onClick={()=> setSelected(c.name)} className={`group w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${selected===c.name ? 'bg-[rgba(255,255,255,0.85)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(255,255,255,0.92)] hover:bg-[rgba(255,255,255,0.28)]'}`}>
									<span className={`relative flex items-center justify-center w-8 h-8 rounded-md ${selected===c.name ? 'bg-white/90' : 'bg-white/50 group-hover:bg-white/65'} shadow-inner shadow-white/30`}>
										<span className={`absolute -left-1 top-1 w-1 h-1 rounded-full ${selected===c.name ? 'opacity-100' : 'opacity-60'}`} style={{ background: 'var(--pos-accent-green)' }} />
										<span className="text-[11px] font-semibold">{c.icon || '·'}</span>
									</span>
									{!collapsed && <span className="truncate">{c.name}</span>}
								</button>
							))}
						</div>
					</div>
				)}
      </div>
      {/* Footer action */}
      <div className="px-2 pb-3 pt-2 border-t border-white/30 dark:border-white/5 relative z-10">
				<Link href={settingsItem.href} aria-label={settingsItem.label} className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.28)] focus:outline-none focus-visible:ring-2 ring-white/60">
					<span className="w-8 h-8 rounded-md flex items-center justify-center bg-white/55 group-hover:bg-white/70 shadow-inner shadow-white/30">{settingsItem.icon}</span>
          {!collapsed && <span className="truncate">{settingsItem.label}</span>}
        </Link>
      </div>
      <style jsx>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 3px; } @keyframes shine { 0% { transform: translateX(-60%); } 100% { transform: translateX(120%);} }`}</style>
    </nav>
  );
};

export default PosSidebar;
