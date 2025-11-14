"use client";
import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings as GearIcon } from 'lucide-react';
import { useKitchenBoard } from '../../state/kitchenBoardStore';
import { usePOSView } from '../../state/posViewStore';

interface NavItem {
	key: string;
	label: string;
	href: string;
	icon: React.ReactNode;
	accent?: string; // optional color accent token/class
}

const baseIconClass = 'w-5 h-5 stroke-current';

const items: NavItem[] = [
	{
		key: 'logo',
		label: 'Inicio',
		href: '/pos',
		accent: 'from-amber-50 to-amber-100',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
				<path strokeLinecap="round" strokeLinejoin="round" d="M4 4h7.5M4 9h9M4 14h5.5M4 19h9" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6v6h-6z" />
			</svg>
		)
	},
	{
		key: 'home',
		label: 'Inicio',
		href: '/pos',
		accent: 'from-amber-50 to-amber-100',
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
		key: 'kitchen',
		label: 'Cocina',
		href: '/pos',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12M8 7h8m-9 4h10m-9 4h8M6 21h12" />
				<path strokeLinecap="round" strokeLinejoin="round" d="M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
		label: 'Empleados',
		href: '/pos/staff',
		icon: (
			<svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className={baseIconClass}>
				<path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z" />
			</svg>
		)
	}
];

const settingsItem: NavItem = {
	key: 'settings',
	label: 'Configuración',
	href: '/pos/settings',
	icon: (
		<GearIcon className={baseIconClass} />
	)
};

export const PosSidebar: React.FC<{ collapsible?: boolean }> = ({ collapsible = true }) => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
	const { tickets } = useKitchenBoard();
	const pending = useMemo(() => tickets.filter(t => t.status !== 'served').length, [tickets]);
	const { view: posView, setView } = usePOSView();

  // Derived classes
  const widthClass = collapsed ? 'w-16' : 'w-56';

  return (
		<nav aria-label="Navegación principal POS" className={`h-full flex flex-col ${widthClass} relative rounded-r-2xl`} style={{background:'var(--pos-bg-sidebar)', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.25),0 4px 14px -4px rgba(149,37,55,0.35)'}}>
      {/* Header / Brand + Toggle */}
		<div className="flex items-center gap-2 px-3 pt-3 pb-2 relative z-10 border-b border-white/30/80">
		<div className="flex items-center gap-2">
			<div className="w-10 h-10 relative rounded-md overflow-hidden bg-white/90 shadow">
				<Image src="/LogoFilaCero.svg" alt="FilaCero" fill className="object-contain p-1" />
			</div>
			{!collapsed && (
						<span className="font-semibold tracking-tight text-[13px] leading-none whitespace-nowrap truncate" style={{ color: 'var(--pos-text-heading)' }}>
							Punto de Venta
						</span>
			)}
		</div>
        {collapsible && (
							<button
								onClick={()=> setCollapsed(c=> !c)}
								aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
								className="ml-auto group relative w-9 h-9 flex items-center justify-center rounded-lg bg-white/60 hover:bg-white/75 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
								style={{ color: 'var(--pos-text-heading)' }}
							>
								<span className="absolute inset-0 rounded-lg shadow-inner shadow-white/30 pointer-events-none" />
								<svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m10 6 6 6-6 6" /></svg>
							</button>
        )}
      </div>
			{/* Nav items */}
			<div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 relative z-10 custom-scrollbar">
				{items.filter(i=> i.key !== 'logo').map(item => {
					const isKitchen = item.key === 'kitchen';
					const active = isKitchen ? posView === 'kitchen' : (pathname === item.href || (item.key === 'home' && pathname === '/pos'));
					if (isKitchen) {
						return (
							<button
								key={item.key}
								onClick={() => {
									setView('kitchen');
									try {
										void useKitchenBoard.getState().hydrateFromAPI();
									} catch {}
								}}
								aria-current={active ? 'page' : undefined}
								className={`w-full text-left group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-semibold tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${active ? 'bg-[rgba(255,255,255,0.92)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.3)]'}`}
								type="button"
							>
								<span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: active ? 'var(--pos-accent-green)' : 'transparent' }} />
								<span className={`relative flex items-center justify-center w-9 h-9 rounded-lg ${active ? 'bg-white' : 'bg-white/60 group-hover:bg-white/75'} shadow-inner shadow-white/30`} style={{ color: 'var(--pos-text-heading)' }}>
									{item.icon}
								</span>
								{!collapsed && (
									<span className="truncate flex items-center gap-2">
										{item.label}
										{pending > 0 && (
											<span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--pos-accent-green)' }}>
												{pending}
											</span>
										)}
									</span>
								)}
							</button>
						);
					}
					return (
						<Link
							key={item.key}
							href={item.href}
							onClick={() => setView('sell')}
							aria-current={active ? 'page' : undefined}
							className={`w-full text-left group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-semibold tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${active ? 'bg-[rgba(255,255,255,0.92)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.3)]'}`}
						>
							<span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full" style={{ background: active ? 'var(--pos-accent-green)' : 'transparent' }} />
							<span className={`relative flex items-center justify-center w-9 h-9 rounded-lg ${active ? 'bg-white' : 'bg-white/60 group-hover:bg-white/75'} shadow-inner shadow-white/30`} style={{ color: 'var(--pos-text-heading)' }}>
								{item.icon}
							</span>
							{!collapsed && (
								<span className="truncate flex items-center gap-2">{item.label}</span>
							)}
						</Link>
					);
				})}
      </div>
	  {/* Footer action */}
	<div className="px-2 pb-3 pt-2 border-t border-white/30/80 relative z-10">
				<Link href={settingsItem.href} aria-label={settingsItem.label} className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors text-[rgba(255,255,255,0.95)] hover:bg-[rgba(255,255,255,0.3)] focus:outline-none focus-visible:ring-2 ring-white/60">
					<span className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/60 group-hover:bg-white/75 shadow-inner shadow-white/30" style={{ color: 'var(--pos-text-heading)' }}>{settingsItem.icon}</span>
          {!collapsed && <span className="truncate">{settingsItem.label}</span>}
        </Link>
      </div>
      <style jsx>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.35); border-radius: 3px; } @keyframes shine { 0% { transform: translateX(-60%); } 100% { transform: translateX(120%);} }`}</style>
    </nav>
  );
};

export default PosSidebar;
