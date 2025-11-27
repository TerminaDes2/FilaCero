"use client";

import React, {
	ChangeEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { useUserStore } from '../../../src/state/userStore';
import { useConfirm } from '../../../src/components/system/ConfirmProvider';
import {
	useSettingsStore,
	SettingsSnapshot,
	DeviceEntry,
	TaxRate,
	ShortcutEntry,
	BusinessExtra,
	Density,
	POSView,
	LocaleCode,
	CurrencyCode,
	ReceiptPaperWidth,
} from '../../../src/state/settingsStore';
import { useBusinessStore } from '../../../src/state/businessStore';
import { api } from '../../../src/lib/api';

type SectionKey =
	| 'business'
	| 'appearance'
	| 'pos'
	| 'receipts'
	| 'devices'
	| 'payments'
	| 'taxes'
	| 'staff'
	| 'notifications'
	| 'shortcuts'
	| 'data'
	| 'locale'
	| 'account'
	| 'about';

interface SectionDef {
	key: SectionKey;
	label: string;
	desc?: string;
	icon: React.ReactNode;
}

const icon = (d: string) => (
	<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
		<path strokeLinecap="round" strokeLinejoin="round" d={d} />
	</svg>
);

const sections: SectionDef[] = [
	{ key: 'business', label: 'Negocio', desc: 'Identidad y datos fiscales', icon: icon('M4 7h16M4 12h16M4 17h10') },
	{ key: 'appearance', label: 'Apariencia', desc: 'Tema y densidad', icon: icon('M4 6h16v12H4z') },
	{ key: 'pos', label: 'Preferencias POS', desc: 'Gestión diaria', icon: icon('M6 3h12l3 6H3z M3 9h18v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z') },
	{ key: 'receipts', label: 'Tickets/Facturas', desc: 'Formato de impresión', icon: icon('M7 8h10M7 12h10M7 16h7') },
	{ key: 'devices', label: 'Dispositivos', desc: 'Impresoras y terminales', icon: icon('M4 7h16v10H4z M8 17v2h8v-2') },
	{ key: 'payments', label: 'Pagos', desc: 'Cobros y propinas', icon: icon('M3 7h18v10H3z M7 7v10') },
	{ key: 'taxes', label: 'Impuestos', desc: 'Tasas disponibles', icon: icon('M7 17h10M7 12h10M7 7h10') },
	{ key: 'staff', label: 'Staff y roles', desc: 'Invitaciones y permisos', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z') },
	{ key: 'notifications', label: 'Notificaciones', desc: 'Alertas y resúmenes', icon: icon('M12 19a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Zm6-5V11a6 6 0 1 0-12 0v3l-2 2h16Z') },
	{ key: 'shortcuts', label: 'Atajos', desc: 'Accesos de teclado', icon: icon('M7 7h10v10H7z M9 9h6v6H9z') },
	{ key: 'data', label: 'Datos y copia', desc: 'Exportar e importar ajustes', icon: icon('M4 17h16M12 3v10m0 0 3-3m-3 3-3-3') },
	{ key: 'locale', label: 'Idioma y región', desc: 'Moneda y formato', icon: icon('M12 3a9 9 0 1 0 9 9h-9V3z') },
	{ key: 'account', label: 'Cuenta y seguridad', desc: 'Perfil y sesiones', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z') },
	{ key: 'about', label: 'Acerca de', desc: 'Versionado y legal', icon: icon('M12 7v6M12 17h.01') },
];

type SectionHandlers = {
	save?: () => Promise<void> | void;
	discard?: () => Promise<void> | void;
};

type RegisterSection = (handlers: SectionHandlers) => () => void;

interface SectionProps {
	register: RegisterSection;
	getSnapshot: () => SettingsSnapshot;
}

interface AccountSectionProps extends SectionProps {
	onLogout: () => void;
	userId: string | number | null;
	userEmail: string | null;
	userName: string | null;
}

interface BusinessRecord {
	id_negocio: string;
	nombre: string;
	direccion?: string | null;
	telefono?: string | null;
	correo?: string | null;
	logo_url?: string | null;
	hero_image_url?: string | null;
}

interface EmployeeRecord {
	id_empleado: string;
	negocio_id: string;
	usuario_id: string;
	estado: string;
	fecha_alta: string;
	usuario: {
		id_usuario: string;
		nombre: string;
		correo_electronico: string;
		numero_telefono?: string | null;
		avatar_url?: string | null;
		fecha_registro?: string | null;
	};
}

interface BusinessFormState {
	nombre: string;
	correo: string;
	telefono: string;
	direccion: string;
	logo: string;
	hero_image_url: string;
	slogan: string;
	fiscalId: string;
	legalName: string;
	fiscalAddress: string;
	website: string;
	horarioWeek: string;
	horarioSat: string;
	horarioSun: string;
	heroImage: string;
}

const BUSINESS_EXTRA_FIELD_NAMES = new Set<keyof BusinessExtra>([
	'slogan',
	'fiscalId',
	'legalName',
	'fiscalAddress',
	'website',
	'horarioWeek',
	'horarioSat',
	'horarioSun',
	'heroImage',
]);

const makeBusinessFormState = (
	business: BusinessRecord | null | undefined,
	extra: BusinessExtra,
): BusinessFormState => ({
	nombre: business?.nombre ?? '',
	correo: business?.correo ?? '',
	telefono: business?.telefono ?? '',
	direccion: business?.direccion ?? '',
	logo: business?.logo_url ?? '',
	hero_image_url: business?.hero_image_url ?? '',
	slogan: extra?.slogan ?? '',
	fiscalId: extra?.fiscalId ?? '',
	legalName: extra?.legalName ?? '',
	fiscalAddress: extra?.fiscalAddress ?? '',
	website: extra?.website ?? '',
	horarioWeek: extra?.horarioWeek ?? '',
	horarioSat: extra?.horarioSat ?? '',
	horarioSun: extra?.horarioSun ?? '',
	heroImage: extra?.heroImage ?? '',
});

const BUSINESS_FORM_KEYS: Array<keyof BusinessFormState> = [
	'nombre',
	'correo',
	'telefono',
	'direccion',
	'logo',
	'hero_image_url',
	'slogan',
	'fiscalId',
	'legalName',
	'fiscalAddress',
	'website',
	'horarioWeek',
	'horarioSat',
	'horarioSun',
	'heroImage',
];

const isSameBusinessFormState = (a: BusinessFormState, b: BusinessFormState) =>
	BUSINESS_FORM_KEYS.every((key) => a[key] === b[key]);

const DEFAULT_SHORTCUTS: ShortcutEntry[] = [
	{ id: 'search', label: 'Abrir búsqueda', combo: '⌘K', readOnly: true },
	{ id: 'new-sale', label: 'Nueva venta', combo: 'N', readOnly: true },
	{ id: 'add-cart', label: 'Agregar al carrito', combo: 'A', readOnly: false },
];

export default function POSSettingsPage() {
	const router = useRouter();
	const { logout, user } = useUserStore();
	const confirm = useConfirm();
	const [active, setActive] = useState<SectionKey>('business');
	const [filter, setFilter] = useState('');

	const snapshotRef = useRef<SettingsSnapshot>(useSettingsStore.getState().snapshot());
	const saveHandlers = useRef(new Map<SectionKey, () => Promise<void> | void>());
	const discardHandlers = useRef(new Map<SectionKey, () => Promise<void> | void>());

	const registerSection = useCallback(
		(key: SectionKey, handlers: SectionHandlers) => {
			if (handlers.save) saveHandlers.current.set(key, handlers.save);
			else saveHandlers.current.delete(key);
			if (handlers.discard) discardHandlers.current.set(key, handlers.discard);
			else discardHandlers.current.delete(key);
			return () => {
				saveHandlers.current.delete(key);
				discardHandlers.current.delete(key);
			};
		},
		[],
	);

	const sectionRegisters = useMemo(() => {
		const result = {} as Record<SectionKey, RegisterSection>;
		for (const { key } of sections) {
			result[key] = (handlers) => registerSection(key, handlers);
		}
		return result;
	}, [registerSection]);

	const getSnapshot = useCallback(() => snapshotRef.current, []);

	useEffect(() => {
		snapshotRef.current = useSettingsStore.getState().snapshot();
	}, []);

	const visibleSections = useMemo(() => {
		const q = filter.trim().toLowerCase();
		if (!q) return sections;
		return sections.filter((section) =>
			section.label.toLowerCase().includes(q) || (section.desc?.toLowerCase().includes(q) ?? false),
		);
	}, [filter]);

	const activeSection = useMemo(
		() => sections.find((section) => section.key === active),
		[active],
	);

	const handleLogout = useCallback(async () => {
		const ok = await confirm({
			title: 'Cerrar sesión',
			description: '¿Seguro que quieres cerrar sesión en este dispositivo?',
			confirmText: 'Cerrar sesión',
			cancelText: 'Cancelar',
			tone: 'danger',
		});
		if (!ok) return;
		logout();
		router.replace('/auth/login');
	}, [confirm, logout, router]);

	const handleDiscard = useCallback(async () => {
		const ok = await confirm({
			title: 'Descartar cambios',
			description: 'Se revertirán los ajustes a la última versión guardada. ¿Deseas continuar?',
			confirmText: 'Descartar',
			cancelText: 'Cancelar',
			tone: 'danger',
		});
		if (!ok) return;
		try {
			useSettingsStore.getState().replace(snapshotRef.current);
			const discard = discardHandlers.current.get(active);
			if (discard) await discard();
		} catch (error) {
			console.error('Error al descartar cambios', error);
			if (typeof window !== 'undefined') window.alert('No fue posible descartar los cambios.');
		}
	}, [active, confirm]);

	const handleSave = useCallback(async () => {
		const ok = await confirm({
			title: 'Guardar cambios',
			description: 'Se aplicarán los cambios para esta sección.',
			confirmText: 'Guardar',
			cancelText: 'Cancelar',
		});
		if (!ok) return;
		try {
			const handler = saveHandlers.current.get(active);
			if (handler) await handler();
			snapshotRef.current = useSettingsStore.getState().snapshot();
			if (typeof window !== 'undefined') window.alert('Cambios guardados correctamente.');
		} catch (error) {
			console.error('Error al guardar cambios', error);
			if (typeof window !== 'undefined') window.alert('No fue posible guardar.');
		}
	}, [active, confirm]);

	return (
		<div className="h-screen flex pos-pattern overflow-hidden">
			<aside className="hidden md:flex flex-col h-screen sticky top-0">
				<PosSidebar />
			</aside>
			<main className="flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border">
				<div className="px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4">
					<h1 className="font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none">
						<span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
						<span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
					</h1>
					<TopRightInfo businessName="Configuración" />
				</div>
				<div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0">
					<section className="w-full lg:w-72 xl:w-80 flex flex-col flex-shrink-0 min-h-0 lg:pl-0">
						<div
							className="rounded-2xl px-4 pt-4 pb-3 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0"
							style={{ background: 'var(--pos-summary-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}
						>
							<div className="mb-3">
								<div className="relative">
									<input
										value={filter}
										onChange={(event) => setFilter(event.target.value)}
										placeholder="Buscar en configuración..."
										className="w-full rounded-lg px-3 py-2 text-[13px] outline-none"
										style={{ background: 'rgba(255,255,255,0.9)', color: '#4b1c23', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
									/>
									<span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'rgba(75,28,35,0.6)' }}>
										⌘K
									</span>
								</div>
							</div>
							<nav aria-label="Secciones de configuración" className="flex-1 overflow-y-auto custom-scroll-area pr-1">
								<ul className="space-y-1">
									{visibleSections.map((section) => {
										const isActive = section.key === active;
										return (
											<li key={section.key}>
												<button
													onClick={() => setActive(section.key)}
													className={`w-full text-left group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${
														isActive
															? 'bg-[rgba(255,255,255,0.92)] text-[rgb(80,32,38)] shadow-sm'
															: 'text-[rgba(75,28,35,0.9)] hover:bg-[rgba(255,255,255,0.6)]'
													}`}
												>
													<span
														className={`relative flex items-center justify-center w-8 h-8 rounded-md ${
															isActive ? 'bg-white/90' : 'bg-white/75 group-hover:bg-white/85'
														} shadow-inner shadow-white/30`}
													>
														{section.icon}
													</span>
													<div className="min-w-0">
														<div className="truncate">{section.label}</div>
														{section.desc && <div className="text-[11px] truncate opacity-70">{section.desc}</div>}
													</div>
												</button>
											</li>
										);
									})}
								</ul>
							</nav>
							<div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--pos-border-soft)' }}>
								<button
									onClick={handleLogout}
									className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold focus:outline-none focus-visible:ring-2"
									style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--fc-brand-600)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
								>
									<svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
									</svg>
									Cerrar sesión
								</button>
							</div>
						</div>
					</section>
					<section className="flex-1 flex flex-col overflow-hidden min-h-0">
						<section
							className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-6 pb-4 -mt-2"
							style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)' }}
						>
							<div className="flex items-center justify-between mb-3">
								<div>
									<h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--pos-text-heading)' }}>
										{activeSection?.label}
									</h2>
									{activeSection?.desc && (
										<p className="text-[12px] opacity-80" style={{ color: 'var(--pos-text-muted)' }}>
											{activeSection.desc}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={handleDiscard}
										className="px-3 py-2 text-[13px] rounded-lg font-medium"
										style={{ background: 'rgba(0,0,0,0.06)', color: 'var(--pos-text-heading)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
									>
										Descartar
									</button>
									<button
										onClick={handleSave}
										className="px-3 py-2 text-[13px] rounded-lg font-semibold"
										style={{ background: 'var(--pos-accent-green)', color: 'white', boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}
									>
										Guardar cambios
									</button>
								</div>
							</div>
							<div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scroll-area">
								{active === 'business' && (
									<BusinessSection register={sectionRegisters.business} getSnapshot={getSnapshot} />
								)}
								{active === 'appearance' && <AppearanceSection register={sectionRegisters.appearance} getSnapshot={getSnapshot} />}
								{active === 'pos' && <PosPrefsSection register={sectionRegisters.pos} getSnapshot={getSnapshot} />}
								{active === 'receipts' && <ReceiptsSection register={sectionRegisters.receipts} getSnapshot={getSnapshot} />}
								{active === 'devices' && <DevicesSection register={sectionRegisters.devices} getSnapshot={getSnapshot} />}
								{active === 'payments' && <PaymentsSection register={sectionRegisters.payments} getSnapshot={getSnapshot} />}
								{active === 'taxes' && <TaxesSection register={sectionRegisters.taxes} getSnapshot={getSnapshot} />}
								{active === 'staff' && <StaffSection register={sectionRegisters.staff} getSnapshot={getSnapshot} />}
								{active === 'notifications' && <NotificationsSection register={sectionRegisters.notifications} getSnapshot={getSnapshot} />}
								{active === 'shortcuts' && <ShortcutsSection register={sectionRegisters.shortcuts} getSnapshot={getSnapshot} />}
								{active === 'data' && <DataSection register={sectionRegisters.data} getSnapshot={getSnapshot} />}
								{active === 'locale' && <LocaleSection register={sectionRegisters.locale} getSnapshot={getSnapshot} />}
								{active === 'account' && (
									<AccountSection
										register={sectionRegisters.account}
										getSnapshot={getSnapshot}
										onLogout={handleLogout}
										userId={user?.id_usuario ?? null}
										userEmail={user?.correo_electronico ?? null}
										userName={user?.nombre ?? null}
									/>
								)}
								{active === 'about' && <AboutSection register={sectionRegisters.about} getSnapshot={getSnapshot} />}
							</div>
						</section>
					</section>
				</div>
			</main>
			<style jsx>{`
				.custom-scroll-area::-webkit-scrollbar { width: 8px; }
				.custom-scroll-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
			`}</style>
		</div>
	);
}

const Card: React.FC<{ title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, desc, right, children }) => (
	<div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
		<div className="flex items-start justify-between gap-3 mb-3">
			<div>
				<h3 className="text-[14px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
					{title}
				</h3>
				{desc && (
					<p className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
						{desc}
					</p>
				)}
			</div>
			{right}
		</div>
		{children}
	</div>
);

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
	<div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start py-2">
		<div className="md:col-span-1">
			<div className="text-[13px] font-medium" style={{ color: 'var(--pos-text-heading)' }}>
				{label}
			</div>
			{hint && (
				<div className="text-[12px] opacity-80" style={{ color: 'var(--pos-text-muted)' }}>
					{hint}
				</div>
			)}
		</div>
		<div className="md:col-span-2">
			{children}
		</div>
	</div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
	<input
		{...props}
		className={`w-full rounded-lg px-3 py-2 text-[13px] outline-none ${props.className ?? ''}`}
		style={{
			height: 'var(--pos-control-h)',
			borderRadius: 'var(--pos-control-radius)',
			background: 'rgba(255,255,255,0.9)',
			color: '#4b1c23',
			boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
		}}
	/>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
	<select
		{...props}
		className={`w-full rounded-lg px-3 py-2 text-[13px] outline-none ${props.className ?? ''}`}
		style={{
			height: 'var(--pos-control-h)',
			borderRadius: 'var(--pos-control-radius)',
			background: 'rgba(255,255,255,0.9)',
			color: '#4b1c23',
			boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
		}}
	/>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
	<textarea
		{...props}
		className={`w-full rounded-lg px-3 py-2 text-[13px] outline-none ${props.className ?? ''}`}
		style={{
			borderRadius: 'var(--pos-control-radius)',
			background: 'rgba(255,255,255,0.9)',
			color: '#4b1c23',
			boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
			minHeight: props.rows ? undefined : 88,
		}}
	/>
);

const Toggle: React.FC<{ checked: boolean; onChange: (value: boolean) => void }> = ({ checked, onChange }) => (
	<button
		type="button"
		onClick={() => onChange(!checked)}
		className={`relative inline-flex items-center h-6 rounded-full w-11 transition ${
			checked ? 'bg-[var(--pos-accent-green)]' : 'bg-[rgba(0,0,0,0.15)]'
		}`}
	>
		<span
			className={`inline-block w-5 h-5 transform bg-white rounded-full transition ${
				checked ? 'translate-x-5' : 'translate-x-1'
			}`}
		/>
	</button>
);

function BusinessSection({ register }: SectionProps) {
	const { activeBusiness, setActiveBusiness } = useBusinessStore();
	const { businessExtra, mergeBusinessExtra } = useSettingsStore((state) => ({
		businessExtra: state.businessExtra,
		mergeBusinessExtra: state.mergeBusinessExtra,
	}));
	const [form, setForm] = useState<BusinessFormState>(() => makeBusinessFormState(activeBusiness, businessExtra));
	const [saving, setSaving] = useState(false);
	const [loadingBusiness, setLoadingBusiness] = useState(false);
	const formHashRef = useRef<string>('');
	if (!formHashRef.current) {
		formHashRef.current = JSON.stringify(form);
	}

	const syncFormState = useCallback((next: BusinessFormState) => {
		const nextHash = JSON.stringify(next);
		if (nextHash === formHashRef.current) return;
		formHashRef.current = nextHash;
		setForm(next);
	}, [setForm]);

	useEffect(() => {
		const nextForm = makeBusinessFormState(activeBusiness, businessExtra);
		syncFormState(nextForm);
	}, [activeBusiness, businessExtra, syncFormState]);

	const updateField = useCallback(
		(field: keyof BusinessFormState, value: string) => {
			if (form[field] === value) return;
			const next = { ...form, [field]: value };
			syncFormState(next);
			if (BUSINESS_EXTRA_FIELD_NAMES.has(field as keyof BusinessExtra)) {
				mergeBusinessExtra({ [field]: value } as Partial<BusinessExtra>);
			}
		},
		[form, mergeBusinessExtra, syncFormState],
	);

	const handleInputChange = useCallback(
		(field: keyof BusinessFormState) => (event: ChangeEvent<HTMLInputElement>) => {
			updateField(field, event.target.value);
		},
		[updateField],
	);

	const handleTextAreaChange = useCallback(
		(field: keyof BusinessFormState) => (event: ChangeEvent<HTMLTextAreaElement>) => {
			updateField(field, event.target.value);
		},
		[updateField],
	);

	const refreshFromStores = useCallback(() => {
		const latestBusiness = useBusinessStore.getState().activeBusiness as BusinessRecord | null;
		const latestExtra = useSettingsStore.getState().businessExtra;
		const nextForm = makeBusinessFormState(latestBusiness, latestExtra);
		syncFormState(nextForm);
	}, [syncFormState]);

	const handleRefreshBusiness = useCallback(async () => {
		setLoadingBusiness(true);
		try {
			const businesses = await api.listMyBusinesses();
			if (businesses && businesses.length > 0) {
				const first = businesses[0];
				setActiveBusiness({
					id_negocio: String(first.id_negocio ?? first.id ?? ''),
					nombre: first.nombre ?? '',
					direccion: first.direccion ?? '',
					telefono: first.telefono ?? '',
					correo: first.correo ?? '',
					logo_url: first.logo_url ?? '',
					hero_image_url: first.hero_image_url ?? '',
				});
			} else {
				if (typeof window !== 'undefined') window.alert('No encontramos negocios asociados a tu usuario.');
			}
		} catch (error) {
			console.error('Error recargando negocio', error);
			if (typeof window !== 'undefined') window.alert('No fue posible cargar el negocio.');
		} finally {
			setLoadingBusiness(false);
		}
	}, [setActiveBusiness]);

	const save = useCallback(async () => {
		if (!activeBusiness) {
			if (typeof window !== 'undefined') window.alert('Necesitas seleccionar un negocio para actualizarlo.');
			return;
		}
		if (saving) return;
		setSaving(true);
		try {
			const payload = {
				nombre: form.nombre.trim(),
				direccion: form.direccion.trim() || null,
				telefono: form.telefono.trim() || null,
				correo: form.correo.trim() || null,
				logo: form.logo.trim() || null,
				hero_image_url: form.hero_image_url.trim() || null,
			};
			const updated = await api.updateBusiness(activeBusiness.id_negocio, payload);
			setActiveBusiness({
				id_negocio: String(updated?.id_negocio ?? activeBusiness.id_negocio),
				nombre: updated?.nombre ?? payload.nombre ?? activeBusiness.nombre,
				direccion: updated?.direccion ?? form.direccion,
				telefono: updated?.telefono ?? form.telefono,
				correo: updated?.correo ?? form.correo,
				logo_url: updated?.logo_url ?? form.logo,
				hero_image_url: updated?.hero_image_url ?? form.hero_image_url,
			});
			mergeBusinessExtra({
				slogan: form.slogan,
				fiscalId: form.fiscalId,
				legalName: form.legalName,
				fiscalAddress: form.fiscalAddress,
				website: form.website,
				horarioWeek: form.horarioWeek,
				horarioSat: form.horarioSat,
				horarioSun: form.horarioSun,
				heroImage: form.heroImage,
			});
		} catch (error) {
			console.error('Error actualizando negocio', error);
			throw error;
		} finally {
			setSaving(false);
		}
	}, [activeBusiness, form, mergeBusinessExtra, saving, setActiveBusiness]);

	const discard = useCallback(() => {
		refreshFromStores();
	}, [refreshFromStores]);

	useEffect(() => {
		const unregister = register({ save, discard });
		return unregister;
	}, [register, save, discard]);

	const disabled = !activeBusiness || saving;

	return (
		<div className="space-y-4">
			{!activeBusiness && (
				<Card title="Sin negocio seleccionado" desc="Necesitas cargar un negocio para sincronizar estos datos.">
					<div className="space-y-3 text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
						<p>
							Vincula un negocio existente o crea uno nuevo desde el dashboard web. Después selecciona “Recargar negocio” para traer los datos.
						</p>
						<button
							type="button"
							onClick={handleRefreshBusiness}
							disabled={loadingBusiness}
							className="px-3 py-2 text-[13px] rounded-lg font-semibold"
							style={{ background: 'var(--pos-accent-green)', color: '#fff', opacity: loadingBusiness ? 0.7 : 1 }}
						>
							{loadingBusiness ? 'Buscando negocio…' : 'Recargar negocio'}
						</button>
					</div>
				</Card>
			)}

			<Card title="Identidad del negocio" desc="Estos datos aparecen en la cabecera del POS y en tus tickets.">
				<div className="space-y-4">
					<Row label="Nombre comercial" hint="Debe coincidir con la marca que verá tu staff.">
						<Input value={form.nombre} onChange={handleInputChange('nombre')} disabled={disabled} placeholder="Ej. FilaCero Café" />
					</Row>
					<Row label="Eslogan" hint="Mensaje corto opcional para tickets o landing.">
						<Input value={form.slogan} onChange={handleInputChange('slogan')} placeholder="Ej. Ordena rápido, disfruta más" />
					</Row>
					<Row label="Correo de contacto" hint="Se usará para enviar reportes.">
						<Input value={form.correo} onChange={handleInputChange('correo')} disabled={saving} placeholder="contacto@tu-negocio.com" type="email" />
					</Row>
					<Row label="Teléfono" hint="Número visible para dudas.">
						<Input value={form.telefono} onChange={handleInputChange('telefono')} disabled={saving} placeholder="55 1234 5678" />
					</Row>
					<Row label="Dirección" hint="Aparece en tickets.">
						<TextArea value={form.direccion} onChange={handleTextAreaChange('direccion')} disabled={saving} rows={3} placeholder="Calle 123, Colonia Centro, CDMX" />
					</Row>
					<Row label="Sitio web" hint="Incluye https:// si existe.">
						<Input value={form.website} onChange={handleInputChange('website')} placeholder="https://filacero.mx" />
					</Row>
				</div>
			</Card>

			<Card title="Información fiscal" desc="Requerida para facturación y comprobantes.">
				<div className="space-y-4">
					<Row label="Razón social">
						<Input value={form.legalName} onChange={handleInputChange('legalName')} placeholder="FilaCero S.A. de C.V." />
					</Row>
					<Row label="RFC / Identificador fiscal">
						<Input value={form.fiscalId} onChange={handleInputChange('fiscalId')} placeholder="XAXX010101000" />
					</Row>
					<Row label="Domicilio fiscal">
						<TextArea value={form.fiscalAddress} onChange={handleTextAreaChange('fiscalAddress')} rows={3} placeholder="Av. Reforma 123, Piso 4, Cuauhtémoc" />
					</Row>
				</div>
			</Card>

			<Card title="Branding" desc="Configura assets visuales que verás en el POS.">
				<div className="space-y-4">
					<Row label="URL del logo" hint="Usa un enlace válido (SVG o PNG transparente).">
						<Input value={form.logo} onChange={handleInputChange('logo')} placeholder="https://cdn.tu-negocio.com/logo.svg" />
					</Row>
					<Row label="Hero del POS" hint="Imagen grande que aparece en la pantalla de bienvenida.">
						<Input value={form.hero_image_url} onChange={handleInputChange('hero_image_url')} placeholder="https://cdn.tu-negocio.com/hero.jpg" />
					</Row>
					<Row label="Hero para landing interna" hint="Controla campañas o banners temporales.">
						<Input value={form.heroImage} onChange={handleInputChange('heroImage')} placeholder="https://cdn.tu-negocio.com/campana.jpg" />
					</Row>
				</div>
			</Card>

			<Card title="Horarios" desc="Indica cuándo está abierto tu negocio.">
				<div className="space-y-4">
					<Row label="Semanal">
						<Input value={form.horarioWeek} onChange={handleInputChange('horarioWeek')} placeholder="Lun-Vie: 08:00-20:00" />
					</Row>
					<Row label="Sábado">
						<Input value={form.horarioSat} onChange={handleInputChange('horarioSat')} placeholder="Sáb: 09:00-14:00" />
					</Row>
					<Row label="Domingo">
						<Input value={form.horarioSun} onChange={handleInputChange('horarioSun')} placeholder="Dom: cerrado" />
					</Row>
				</div>
			</Card>
		</div>
	);
}
function AppearanceSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);
	const { density, accentTeal, set } = useSettingsStore((state) => ({
		density: state.density,
		accentTeal: state.accentTeal,
		set: state.set,
	}));

	const handleDensityChange = useCallback(
		(next: Density) => {
			set({ density: next });
		},
		[set],
	);

	const handleAccentToggle = useCallback(
		(value: boolean) => {
			set({ accentTeal: value });
		},
		[set],
	);

	return (
		<div className="space-y-4">
			<Card title="Densidad" desc="Ajusta la separación entre elementos para adaptarse al dispositivo.">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{([
						{ key: 'comfortable', label: 'Cómodo', desc: 'Ideal para pantallas grandes o uso con mouse.' },
						{ key: 'compact', label: 'Compacto', desc: 'Más filas visibles para pantallas táctiles estrechas.' },
					] as Array<{ key: Density; label: string; desc: string }>).map((option) => {
						const isActive = density === option.key;
						return (
							<button
								key={option.key}
								type="button"
								onClick={() => handleDensityChange(option.key)}
								className={`flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition ${
									isActive ? 'bg-white shadow-md' : 'bg-white/70 hover:bg-white'
								}`}
								style={{ boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
							>
								<span className="text-sm font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
									{option.label}
								</span>
								<span className="text-xs" style={{ color: 'var(--pos-text-muted)' }}>
									{option.desc}
								</span>
							</button>
						);
					})}
				</div>
			</Card>

			<Card title="Color de acento" desc="Alterna rápidamente el esquema verde/teal del POS.">
				<div className="flex items-center justify-between">
					<div>
						<div className="text-[13px] font-medium" style={{ color: 'var(--pos-text-heading)' }}>
							Teal brillante
						</div>
						<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
							Si lo desactivas, usaremos un tono ámbar suave.
						</div>
					</div>
					<Toggle checked={accentTeal} onChange={handleAccentToggle} />
				</div>
				<div className="mt-4 grid grid-cols-2 gap-2">
					<div
						className="rounded-lg h-16"
						style={{ background: accentTeal ? 'var(--fc-teal-500)' : 'var(--fc-brand-600)', opacity: accentTeal ? 1 : 0.3 }}
					/>
					<div
						className="rounded-lg h-16"
						style={{ background: accentTeal ? 'var(--fc-brand-600)' : '#f3aa4d', opacity: accentTeal ? 0.3 : 1 }}
					/>
				</div>
			</Card>
		</div>
	);
}

function PosPrefsSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { defaultView, showStock, confirmRemove, twoFactorEnabled, set } = useSettingsStore((state) => ({
		defaultView: state.defaultView,
		showStock: state.showStock,
		confirmRemove: state.confirmRemove,
		twoFactorEnabled: state.twoFactorEnabled,
		set: state.set,
	}));

	const updateView = useCallback(
		(view: POSView) => {
			set({ defaultView: view });
		},
		[set],
	);

	const updateToggle = useCallback(
		(patch: Partial<{ showStock: boolean; confirmRemove: boolean; twoFactorEnabled: boolean }>) => {
			set(patch as any);
		},
		[set],
	);

	return (
		<div className="space-y-4">
			<Card title="Vista predeterminada" desc="Elige cómo se muestra tu catálogo al abrir el POS.">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
					{([
						{ key: 'grid', title: 'Cuadrícula', description: 'Fichas grandes con imágenes y atajos para pantallas táctiles.' },
						{ key: 'list', title: 'Lista', description: 'Vista compacta para escanear con teclado o lector de códigos.' },
					] as Array<{ key: POSView; title: string; description: string }>).map((option) => {
						const isActive = defaultView === option.key;
						return (
							<button
								key={option.key}
								type="button"
								onClick={() => updateView(option.key)}
								className={`flex flex-col items-start gap-1 rounded-xl px-4 py-3 text-left transition ${
									isActive ? 'bg-white shadow-md' : 'bg-white/70 hover:bg-white'
								}`}
								style={{ boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.12)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
							>
								<span className="text-sm font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
									{option.title}
								</span>
								<span className="text-xs" style={{ color: 'var(--pos-text-muted)' }}>
									{option.description}
								</span>
							</button>
						);
					})}
				</div>
			</Card>

			<Card title="Controles rápidos" desc="Define confirmaciones y avisos para tu equipo.">
				<div className="space-y-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Mostrar inventario disponible
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Enseña existencias restantes en cada producto.
							</div>
						</div>
						<Toggle checked={showStock} onChange={(value) => updateToggle({ showStock: value })} />
					</div>

					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Confirmar al eliminar
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Solicita confirmación antes de quitar un producto del carrito.
							</div>
						</div>
						<Toggle checked={confirmRemove} onChange={(value) => updateToggle({ confirmRemove: value })} />
					</div>

					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Modo seguro (2FA)
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Solicita PIN o token al reabrir el POS fuera del horario laboral.
							</div>
						</div>
						<Toggle checked={twoFactorEnabled} onChange={(value) => updateToggle({ twoFactorEnabled: value })} />
					</div>
				</div>
			</Card>
		</div>
	);
}

function ReceiptsSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { receiptPaperWidth, receiptShowLogo, receiptTaxBreakdown, receiptHeader, receiptFooter, set } = useSettingsStore(
		(state) => ({
			receiptPaperWidth: state.receiptPaperWidth,
			receiptShowLogo: state.receiptShowLogo,
			receiptTaxBreakdown: state.receiptTaxBreakdown,
			receiptHeader: state.receiptHeader,
			receiptFooter: state.receiptFooter,
			set: state.set,
		}),
	);

	const update = useCallback(
		(patch: Partial<{ receiptPaperWidth: ReceiptPaperWidth; receiptShowLogo: boolean; receiptTaxBreakdown: boolean; receiptHeader: string; receiptFooter: string }>) =>
			set(patch as any),
		[set],
	);

	return (
		<div className="space-y-4">
			<Card title="Formato" desc="Selecciona el ancho y elementos visibles en tus tickets.">
				<Row label="Ancho de papel" hint="Depende del rollo que use tu impresora.">
					<Select value={receiptPaperWidth} onChange={(event) => update({ receiptPaperWidth: event.target.value as ReceiptPaperWidth })}>
						<option value="58mm">58 mm</option>
						<option value="80mm">80 mm</option>
					</Select>
				</Row>
				<Row label="Logo en ticket">
					<Toggle checked={receiptShowLogo} onChange={(value) => update({ receiptShowLogo: value })} />
				</Row>
				<Row label="Detalle de impuestos">
					<Toggle checked={receiptTaxBreakdown} onChange={(value) => update({ receiptTaxBreakdown: value })} />
				</Row>
			</Card>

			<Card title="Encabezado" desc="Personaliza el texto inicial (nombre, RFC, etc.).">
				<TextArea value={receiptHeader} onChange={(event) => update({ receiptHeader: event.target.value })} rows={4} placeholder={'FilaCero Café\nRFC: XAXX010101000'} />
			</Card>

			<Card title="Pie de ticket" desc="Mensajes de agradecimiento o promociones.">
				<TextArea value={receiptFooter} onChange={(event) => update({ receiptFooter: event.target.value })} rows={4} placeholder={'Gracias por su compra\nSíguenos en @filaceroPOS'} />
			</Card>

			<Card title="Vista previa" desc="Así se imprimirá el ticket con la configuración actual.">
				<div className="bg-white rounded-lg px-4 py-5 text-xs space-y-2" style={{ maxWidth: receiptPaperWidth === '58mm' ? 220 : 280, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
					{receiptShowLogo && (
						<div className="text-center font-semibold tracking-wide" style={{ color: 'var(--fc-brand-600)' }}>
							[LOGO]
						</div>
					)}
					{receiptHeader && (
						<pre className="whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: '#3d1a20' }}>
							{receiptHeader}
						</pre>
					)}
					<div className="border-t pt-2 border-dashed" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
						<div className="flex justify-between">
							<span>Café latte</span>
							<span>$85.00</span>
						</div>
						<div className="flex justify-between">
							<span>Pan dulce</span>
							<span>$35.00</span>
						</div>
					</div>
					<div className="border-t pt-2 border-dashed" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
						{receiptTaxBreakdown ? (
							<div className="space-y-1">
								<div className="flex justify-between"><span>Subtotal</span><span>$103.45</span></div>
								<div className="flex justify-between"><span>IVA 16%</span><span>$16.55</span></div>
								<div className="flex justify-between font-semibold"><span>Total</span><span>$120.00</span></div>
							</div>
						) : (
							<div className="flex justify-between font-semibold"><span>Total</span><span>$120.00</span></div>
						)}
					</div>
					{receiptFooter && (
						<pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-center" style={{ color: '#3d1a20' }}>
							{receiptFooter}
						</pre>
					)}
				</div>
			</Card>
		</div>
	);
}

function DevicesSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { devices, addDevice, updateDevice, removeDevice } = useSettingsStore((state) => ({
		devices: state.devices,
		addDevice: state.addDevice,
		updateDevice: state.updateDevice,
		removeDevice: state.removeDevice,
	}));
	const [newDevice, setNewDevice] = useState<{ name: string; kind: DeviceEntry['kind']; autoPrint: boolean }>({
		name: '',
		kind: 'printer',
		autoPrint: true,
	});

	const handleAddDevice = useCallback(() => {
		if (!newDevice.name.trim()) {
			if (typeof window !== 'undefined') window.alert('Asigna un nombre al dispositivo.');
			return;
		}
		const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}`;
		addDevice({
			id,
			name: newDevice.name.trim(),
			kind: newDevice.kind,
			status: 'disconnected',
			lastSeen: null,
			autoPrint: newDevice.autoPrint,
		});
		setNewDevice({ name: '', kind: 'printer', autoPrint: true });
	}, [addDevice, newDevice]);

	const handleRemoveDevice = useCallback(
		async (id: string) => {
			const ok = typeof window === 'undefined' ? true : window.confirm('¿Eliminar este dispositivo del POS?');
			if (!ok) return;
			removeDevice(id);
		},
		[removeDevice],
	);

	return (
		<div className="space-y-4">
			<Card title="Dispositivos registrados" desc="Administra impresoras, terminales y pantallas KDS.">
				<div className="space-y-3">
					{devices.length === 0 && (
						<div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
							Aún no has registrado dispositivos. Añade uno con el formulario de abajo.
						</div>
					)}
					{devices.map((device) => (
						<div
							key={device.id}
							className="rounded-lg border px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
							style={{ borderColor: 'var(--pos-border-soft)', background: 'rgba(255,255,255,0.9)' }}
						>
							<div>
								<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
									{device.name}
								</div>
								<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
									{device.kind === 'printer' ? 'Impresora' : device.kind === 'terminal' ? 'Terminal de cobro' : 'Kitchen Display'} ·
									{' '}
									{device.status === 'connected' ? 'Conectado' : 'Desconectado'}
									{device.lastSeen && ` · Último visto ${new Date(device.lastSeen).toLocaleString()}`}
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Select value={device.status} onChange={(event) => updateDevice(device.id, { status: event.target.value as DeviceEntry['status'] })} className="w-32">
									<option value="connected">Conectado</option>
									<option value="disconnected">Desconectado</option>
								</Select>
								<div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
									<span>Autoimprimir</span>
									<Toggle checked={Boolean(device.autoPrint)} onChange={(value) => updateDevice(device.id, { autoPrint: value })} />
								</div>
								<button
									type="button"
									onClick={() => handleRemoveDevice(device.id)}
									className="px-3 py-2 text-[12px] rounded-lg font-semibold"
									style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--pos-text-heading)' }}
								>
									Quitar
								</button>
							</div>
						</div>
					))}
				</div>
			</Card>

			<Card title="Registrar dispositivo" desc="Requiere instalar el agente POS en el equipo correspondiente.">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div className="md:col-span-1">
						<Input
							value={newDevice.name}
							onChange={(event) => setNewDevice((prev) => ({ ...prev, name: event.target.value }))}
							placeholder="Nombre del dispositivo"
						/>
					</div>
					<div className="md:col-span-1">
						<Select value={newDevice.kind} onChange={(event) => setNewDevice((prev) => ({ ...prev, kind: event.target.value as DeviceEntry['kind'] }))}>
							<option value="printer">Impresora térmica</option>
							<option value="terminal">Terminal de cobro</option>
							<option value="kds">Pantalla de cocina (KDS)</option>
						</Select>
					</div>
					<div className="flex items-center gap-2 md:justify-center">
						<span className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
							Autoimprimir
						</span>
						<Toggle
							checked={newDevice.autoPrint}
							onChange={(value) => setNewDevice((prev) => ({ ...prev, autoPrint: value }))}
						/>
					</div>
				</div>
				<button
					type="button"
					onClick={handleAddDevice}
					className="mt-4 px-3 py-2 text-[13px] rounded-lg font-semibold"
					style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
				>
					Añadir dispositivo
				</button>
			</Card>
		</div>
	);
}

function PaymentsSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { payCash, payCard, tipsEnabled, tipPercents, set } = useSettingsStore((state) => ({
		payCash: state.payCash,
		payCard: state.payCard,
		tipsEnabled: state.tipsEnabled,
		tipPercents: state.tipPercents,
		set: state.set,
	}));

	const update = useCallback((patch: Partial<{ payCash: boolean; payCard: boolean; tipsEnabled: boolean; tipPercents: string }>) => {
		set(patch as any);
	}, [set]);

	return (
		<div className="space-y-4">
			<Card title="Métodos de pago" desc="Activa únicamente las opciones disponibles en tu punto de venta.">
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Efectivo
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Permite cerrar ventas registrando pagos en efectivo.
							</div>
						</div>
						<Toggle checked={payCash} onChange={(value) => update({ payCash: value })} />
					</div>

					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Tarjeta / TPV
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Habilita cobros con terminal física o integraciones.
							</div>
						</div>
						<Toggle checked={payCard} onChange={(value) => update({ payCard: value })} />
					</div>
				</div>
			</Card>

			<Card title="Propinas" desc="Configura sugerencias para la pantalla de pago.">
				<div className="space-y-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Propinas sugeridas
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Muestra montos rápidamente al cobrar.
							</div>
						</div>
						<Toggle checked={tipsEnabled} onChange={(value) => update({ tipsEnabled: value })} />
					</div>
					{tipsEnabled && (
						<Row label="Porcentajes" hint="Separados por comas, sin %.">
							<Input value={tipPercents} onChange={(event) => update({ tipPercents: event.target.value })} placeholder="5,10,15" />
						</Row>
					)}
				</div>
			</Card>
		</div>
	);
}

function TaxesSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { taxes, addTax, updateTax, removeTax } = useSettingsStore((state) => ({
		taxes: state.taxes,
		addTax: state.addTax,
		updateTax: state.updateTax,
		removeTax: state.removeTax,
	}));
	const [newTax, setNewTax] = useState<{ label: string; rate: number; appliesToAll: boolean }>({
		label: '',
		rate: 16,
		appliesToAll: true,
	});

	const handleAddTax = useCallback(() => {
		if (!newTax.label.trim()) {
			if (typeof window !== 'undefined') window.alert('Indica un nombre para la tasa.');
			return;
		}
		const id = `tax-${newTax.label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
		addTax({ id, label: newTax.label.trim(), rate: Number(newTax.rate) || 0, appliesToAll: newTax.appliesToAll });
		setNewTax({ label: '', rate: 16, appliesToAll: true });
	}, [addTax, newTax]);

	const handleRemoveTax = useCallback(
		(id: string) => {
			const ok = typeof window === 'undefined' ? true : window.confirm('¿Eliminar esta tasa de impuesto?');
			if (!ok) return;
			removeTax(id);
		},
		[removeTax],
	);

	return (
		<div className="space-y-4">
			<Card title="Tasas activas" desc="Configura las tasas que tu equipo podrá aplicar al cobrar.">
				<div className="space-y-3">
					{taxes.length === 0 && (
						<div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
							No hay tasas configuradas. Añade una nueva para comenzar.
						</div>
					)}
					{taxes.map((tax) => (
						<div
							key={tax.id}
							className="rounded-lg border px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
							style={{ borderColor: 'var(--pos-border-soft)', background: 'rgba(255,255,255,0.9)' }}
						>
							<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
								<Input value={tax.label} onChange={(event) => updateTax(tax.id, { label: event.target.value })} placeholder="Nombre" />
								<Input
									type="number"
									min="0"
									step="0.01"
									value={tax.rate}
									onChange={(event) => updateTax(tax.id, { rate: Number(event.target.value) })}
									placeholder="16"
								/>
							</div>
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
									<span>Aplicar a todo</span>
									<Toggle checked={tax.appliesToAll} onChange={(value) => updateTax(tax.id, { appliesToAll: value })} />
								</div>
								<button
									type="button"
									onClick={() => handleRemoveTax(tax.id)}
									className="px-3 py-2 text-[12px] rounded-lg font-semibold"
									style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--pos-text-heading)' }}
								>
									Quitar
								</button>
							</div>
						</div>
					))}
				</div>
			</Card>

			<Card title="Nueva tasa" desc="Define un porcentaje y aclara si se aplica por defecto.">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<Input value={newTax.label} onChange={(event) => setNewTax((prev) => ({ ...prev, label: event.target.value }))} placeholder="Ej. IVA" />
					<Input
						type="number"
						min="0"
						step="0.01"
						value={newTax.rate}
						onChange={(event) => setNewTax((prev) => ({ ...prev, rate: Number(event.target.value) }))}
						placeholder="16"
					/>
					<div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
						<span>Aplicar a todo</span>
						<Toggle checked={newTax.appliesToAll} onChange={(value) => setNewTax((prev) => ({ ...prev, appliesToAll: value }))} />
					</div>
				</div>
				<button
					type="button"
					onClick={handleAddTax}
					className="mt-4 px-3 py-2 text-[13px] rounded-lg font-semibold"
					style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
				>
					Añadir impuesto
				</button>
			</Card>
		</div>
	);
}

function StaffSection({ register }: SectionProps) {
	const { activeBusiness } = useBusinessStore();
	const confirm = useConfirm();
	const [loading, setLoading] = useState(false);
	const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
	const [inviteEmail, setInviteEmail] = useState('');
	const [inviteName, setInviteName] = useState('');

	const fetchEmployees = useCallback(async () => {
		if (!activeBusiness) return;
		setLoading(true);
		try {
			const list = await api.getEmployeesByBusiness(activeBusiness.id_negocio);
			const normalized: EmployeeRecord[] = (list ?? []).map((item: any) => ({
				id_empleado: String(item.id_empleado ?? item.id ?? ''),
				negocio_id: String(item.negocio_id ?? activeBusiness.id_negocio ?? ''),
				usuario_id: String(item.usuario_id ?? item.usuario?.id_usuario ?? ''),
				estado: item.estado ?? 'pendiente',
				fecha_alta: item.fecha_alta ?? item.created_at ?? new Date().toISOString(),
				usuario: {
					id_usuario: String(item.usuario?.id_usuario ?? item.usuario_id ?? ''),
					nombre: item.usuario?.nombre ?? item.nombre ?? item.correo_electronico ?? 'Usuario',
					correo_electronico: item.usuario?.correo_electronico ?? item.correo_electronico ?? '',
					numero_telefono: item.usuario?.numero_telefono ?? item.numero_telefono ?? null,
					avatar_url: item.usuario?.avatar_url ?? null,
					fecha_registro: item.usuario?.fecha_registro ?? null,
				},
			}));
			setEmployees(normalized);
		} catch (error) {
			console.error('Error al cargar empleados', error);
			if (typeof window !== 'undefined') window.alert('No fue posible obtener la lista de empleados.');
		} finally {
			setLoading(false);
		}
	}, [activeBusiness]);

	useEffect(() => {
		void fetchEmployees();
	}, [fetchEmployees]);

	const handleInvite = useCallback(async () => {
		if (!activeBusiness) {
			if (typeof window !== 'undefined') window.alert('Selecciona un negocio antes de invitar colaboradores.');
			return;
		}
		if (!inviteEmail.trim()) {
			if (typeof window !== 'undefined') window.alert('Necesitas ingresar un correo electrónico.');
			return;
		}
		setLoading(true);
		try {
			await api.createEmployee(activeBusiness.id_negocio, {
				correo_electronico: inviteEmail.trim(),
				nombre: inviteName.trim() || undefined,
			});
			setInviteEmail('');
			setInviteName('');
			await fetchEmployees();
		} catch (error) {
			console.error('Error invitando empleado', error);
			if (typeof window !== 'undefined') window.alert('No se pudo enviar la invitación.');
		} finally {
			setLoading(false);
		}
	}, [activeBusiness, fetchEmployees, inviteEmail, inviteName]);

	const handleStatusChange = useCallback(
		async (employee: EmployeeRecord, nextStatus: string) => {
			setLoading(true);
			try {
				await api.updateEmployee(employee.id_empleado, { estado: nextStatus });
				await fetchEmployees();
			} catch (error) {
				console.error('Error actualizando estado', error);
				if (typeof window !== 'undefined') window.alert('No se pudo actualizar el estado del empleado.');
			} finally {
				setLoading(false);
			}
		},
		[fetchEmployees],
	);

	const handleRemove = useCallback(
		async (employee: EmployeeRecord) => {
			const ok = await confirm({
				title: 'Eliminar colaborador',
				description: `¿Quieres revocar el acceso de ${employee.usuario.nombre || employee.usuario.correo_electronico}?`,
				confirmText: 'Eliminar',
				cancelText: 'Cancelar',
				tone: 'danger',
			});
			if (!ok) return;
			setLoading(true);
			try {
				await api.deleteEmployee(employee.id_empleado);
				await fetchEmployees();
			} catch (error) {
				console.error('Error eliminando empleado', error);
				if (typeof window !== 'undefined') window.alert('No se pudo eliminar al empleado.');
			} finally {
				setLoading(false);
			}
		},
		[confirm, fetchEmployees],
	);

	useEffect(() => {
		const unregister = register({ discard: () => fetchEmployees() });
		return unregister;
	}, [register, fetchEmployees]);

	if (!activeBusiness) {
		return (
			<Card title="Sin negocio" desc="Selecciona un negocio para gestionar su equipo.">
				<div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
					Usa la sección “Negocio” para cargar o crear una sucursal antes de invitar colaboradores.
				</div>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<Card title="Colaboradores" desc="Gestiona accesos y estados de tu equipo.">
				{loading && (
					<div className="text-[12px] mb-3" style={{ color: 'var(--pos-text-muted)' }}>
						Cargando información…
					</div>
				)}
				<div className="space-y-3">
					{employees.length === 0 && !loading && (
						<div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
							Aún no hay colaboradores registrados.
						</div>
					)}
					{employees.map((employee) => (
						<div
							key={employee.id_empleado}
							className="rounded-lg border px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
							style={{ borderColor: 'var(--pos-border-soft)', background: 'rgba(255,255,255,0.9)' }}
						>
							<div>
								<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
									{employee.usuario.nombre || employee.usuario.correo_electronico}
								</div>
								<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
									{employee.usuario.correo_electronico}
									{employee.usuario.numero_telefono ? ` · ${employee.usuario.numero_telefono}` : ''}
									{employee.fecha_alta ? ` · Alta ${new Date(employee.fecha_alta).toLocaleDateString()}` : ''}
								</div>
							</div>
							<div className="flex items-center gap-3">
								<Select value={employee.estado} onChange={(event) => handleStatusChange(employee, event.target.value)} className="w-32">
									<option value="activo">Activo</option>
									<option value="pendiente">Pendiente</option>
									<option value="suspendido">Suspendido</option>
								</Select>
								<button
									type="button"
									onClick={() => handleRemove(employee)}
									className="px-3 py-2 text-[12px] rounded-lg font-semibold"
									style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--pos-text-heading)' }}
									disabled={loading}
								>
									Revocar
								</button>
							</div>
						</div>
					))}
				</div>
			</Card>

			<Card title="Invitar nuevo colaborador" desc="Envía un correo con instrucciones para activar su cuenta.">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="correo@ejemplo.com" type="email" />
					<Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Nombre opcional" />
					<button
						type="button"
						onClick={handleInvite}
						className="px-3 py-2 text-[13px] rounded-lg font-semibold"
						style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
						disabled={loading}
					>
						Enviar invitación
					</button>
				</div>
			</Card>
		</div>
	);
}

function NotificationsSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { notifyDaily, notifyLowStock, notifyEmail, set } = useSettingsStore((state) => ({
		notifyDaily: state.notifyDaily,
		notifyLowStock: state.notifyLowStock,
		notifyEmail: state.notifyEmail,
		set: state.set,
	}));

	const update = useCallback(
		(patch: Partial<{ notifyDaily: boolean; notifyLowStock: boolean; notifyEmail: string }>) => set(patch as any),
		[set],
	);

	return (
		<div className="space-y-4">
			<Card title="Alertas" desc="Recibe avisos por correo sobre la operación del día.">
				<div className="space-y-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Resumen diario
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Recibe ventas totales, propinas y órdenes pendientes cada noche.
							</div>
						</div>
						<Toggle checked={notifyDaily} onChange={(value) => update({ notifyDaily: value })} />
					</div>

					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								Inventario bajo
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								Te avisaremos cuando un producto llegue a su stock mínimo.
							</div>
						</div>
						<Toggle checked={notifyLowStock} onChange={(value) => update({ notifyLowStock: value })} />
					</div>
				</div>
			</Card>

			<Card title="Correo de notificaciones" desc="Es donde recibirás los resúmenes.">
				<Input value={notifyEmail} onChange={(event) => update({ notifyEmail: event.target.value })} placeholder="operacion@tu-negocio.com" type="email" />
			</Card>
		</div>
	);
}

function ShortcutsSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { shortcuts, setShortcuts } = useSettingsStore((state) => ({
		shortcuts: state.shortcuts,
		setShortcuts: state.setShortcuts,
	}));

	const handleComboChange = useCallback(
		(id: string, combo: string) => {
			setShortcuts(shortcuts.map((shortcut) => (shortcut.id === id ? { ...shortcut, combo } : shortcut)));
		},
		[setShortcuts, shortcuts],
	);

	const handleReset = useCallback(() => {
		setShortcuts(DEFAULT_SHORTCUTS.map((item) => ({ ...item })));
	}, [setShortcuts]);

	return (
		<Card title="Atajos de teclado" desc="Optimiza la operación con combinaciones personalizadas.">
			<div className="space-y-4">
				{shortcuts.map((shortcut) => (
					<div key={shortcut.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
						<div>
							<div className="text-[13px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>
								{shortcut.label}
							</div>
							<div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
								{shortcut.readOnly ? 'Atajo fijo del sistema' : 'Puedes cambiarlo para tu equipo.'}
							</div>
						</div>
						<Input
							value={shortcut.combo}
							onChange={(event) => handleComboChange(shortcut.id, event.target.value)}
							disabled={shortcut.readOnly}
							className="md:w-48"
						/>
					</div>
				))}
				<div className="flex justify-end">
					<button
						type="button"
						onClick={handleReset}
						className="px-3 py-2 text-[12px] rounded-lg font-semibold"
						style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--pos-text-heading)' }}
					>
						Restaurar atajos por defecto
					</button>
				</div>
			</div>
		</Card>
	);
}

function DataSection({ register }: SectionProps) {
	const confirm = useConfirm();
	const { snapshot, replace, reset } = useSettingsStore((state) => ({
		snapshot: state.snapshot,
		replace: state.replace,
		reset: state.reset,
	}));
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const handleExport = useCallback(() => {
		const data = snapshot();
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		link.href = url;
		link.download = `filacero-pos-settings-${timestamp}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [snapshot]);

	const handleImportClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleImport = useCallback(
		async (event: ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			event.target.value = '';
			if (!file) return;
			try {
				const content = await file.text();
				const parsed = JSON.parse(content) as Partial<SettingsSnapshot>;
				replace(parsed);
				if (typeof window !== 'undefined') window.alert('Configuración importada correctamente.');
			} catch (error) {
				console.error('Error importando ajustes', error);
				if (typeof window !== 'undefined') window.alert('El archivo no es válido.');
			}
		},
		[replace],
	);

	const handleReset = useCallback(async () => {
		const ok = await confirm({
			title: 'Restablecer ajustes',
			description: 'Se restaurarán los valores originales del POS. Esta acción no afecta tus productos ni ventas.',
			confirmText: 'Restablecer',
			cancelText: 'Cancelar',
			tone: 'danger',
		});
		if (!ok) return;
		reset();
		if (typeof window !== 'undefined') window.alert('Ajustes restaurados.');
	}, [confirm, reset]);

	return (
		<div className="space-y-4">
			<input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
			<Card title="Respaldo" desc="Respaldos manuales en formato JSON.">
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={handleExport}
						className="px-3 py-2 text-[13px] rounded-lg font-semibold"
						style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
					>
						Exportar configuración
					</button>
					<button
						type="button"
						onClick={handleImportClick}
						className="px-3 py-2 text-[13px] rounded-lg font-semibold"
						style={{ background: 'rgba(0,0,0,0.07)', color: 'var(--pos-text-heading)' }}
					>
						Importar desde archivo
					</button>
				</div>
				<p className="mt-3 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
					Guarda el archivo exportado en un lugar seguro. Puedes importarlo en otra terminal para replicar la configuración.
				</p>
			</Card>

			<Card title="Restablecer" desc="Vuelve a los valores predeterminados de FilaCero POS.">
				<button
					type="button"
					onClick={handleReset}
					className="px-3 py-2 text-[13px] rounded-lg font-semibold"
					style={{ background: 'rgba(227,59,63,0.12)', color: 'rgb(156,23,31)' }}
				>
					Restablecer ajustes
				</button>
			</Card>
		</div>
	);
}

function LocaleSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);

	const { locale, currency, dateFormat, set } = useSettingsStore((state) => ({
		locale: state.locale,
		currency: state.currency,
		dateFormat: state.dateFormat,
		set: state.set,
	}));

	const update = useCallback(
		(patch: Partial<{ locale: LocaleCode; currency: CurrencyCode; dateFormat: SettingsSnapshot['dateFormat'] }>) => set(patch as any),
		[set],
	);

	return (
		<Card title="Idioma y región" desc="Define cómo se mostrarán montos, fechas y textos.">
			<div className="space-y-4">
				<Row label="Idioma">
					<Select value={locale} onChange={(event) => update({ locale: event.target.value as LocaleCode })}>
						<option value="es-MX">Español (México)</option>
						<option value="es-ES">Español (España)</option>
						<option value="en-US">English (US)</option>
					</Select>
				</Row>
				<Row label="Moneda">
					<Select value={currency} onChange={(event) => update({ currency: event.target.value as CurrencyCode })}>
						<option value="MXN">Peso mexicano (MXN)</option>
						<option value="USD">Dólar estadounidense (USD)</option>
						<option value="EUR">Euro (EUR)</option>
					</Select>
				</Row>
				<Row label="Formato de fecha">
					<Select value={dateFormat} onChange={(event) => update({ dateFormat: event.target.value as SettingsSnapshot['dateFormat'] })}>
						<option value="auto">Automático según idioma</option>
						<option value="DD/MM/YYYY">DD/MM/YYYY</option>
						<option value="MM/DD/YYYY">MM/DD/YYYY</option>
						<option value="YYYY-MM-DD">YYYY-MM-DD</option>
					</Select>
				</Row>
			</div>
		</Card>
	);
}

function AccountSection({ register, onLogout, userId, userEmail, userName }: AccountSectionProps) {
	const { user, checkAuth, setName } = useUserStore();
	const [form, setForm] = useState({
		name: user?.nombre ?? userName ?? '',
		phone: user?.numero_telefono ?? '',
		newPassword: '',
	});
	const [saving, setSaving] = useState(false);
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [pendingSession, setPendingSession] = useState<{ session: string; expiresAt?: string; delivery?: string } | null>(null);
	const [verificationCode, setVerificationCode] = useState('');
	const [verifying, setVerifying] = useState(false);
	const [verifyError, setVerifyError] = useState<string | null>(null);
	const verificationBadges = useMemo(
		() => {
			const verifications = user?.verifications ?? {
				email: (user as any)?.correo_verificado ?? false,
				sms: (user as any)?.sms_verificado ?? false,
				credential: (user as any)?.credencial_verificada ?? false,
			};
			return (
				[
					{ key: 'email', label: 'Correo', value: verifications.email },
					{ key: 'sms', label: 'SMS', value: verifications.sms },
					{ key: 'credential', label: 'Credencial', value: verifications.credential },
				] as const
			);
		},
		[user],
	);

	useEffect(() => {
		setForm({
			name: user?.nombre ?? userName ?? '',
			phone: user?.numero_telefono ?? '',
			newPassword: '',
		});
	}, [user, userName]);

	const handleChange = useCallback(
		(field: 'name' | 'phone' | 'newPassword', value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const save = useCallback(async () => {
		const targetId = user?.id_usuario ?? userId;
		if (!targetId) {
			if (typeof window !== 'undefined') window.alert('No hay usuario autenticado.');
			return;
		}
		if (saving) return;
		setSaving(true);
		try {
			const payload: Record<string, unknown> = {
				name: form.name.trim() || undefined,
				// phone is not allowed to be updated via settings
			};
			if (form.newPassword.trim()) payload.newPassword = form.newPassword.trim();
			const result = await api.updateUserProfile(targetId, payload);
			// If verification required, show panel instead of applying immediately
			if (result && result.session) {
				setPendingSession({ session: result.session, expiresAt: result.expiresAt, delivery: result.delivery });
				setSaving(false);
				return;
			}
			setName(form.name.trim() || null);
			await checkAuth();
			setForm((prev) => ({ ...prev, newPassword: '' }));
		} catch (error) {
			console.error('Error actualizando perfil', error);
			throw error;
		} finally {
			setSaving(false);
		}
	}, [checkAuth, form, saving, setName, user, userId]);

	const handleConfirmUpdate = useCallback(async () => {
		if (!pendingSession) return;
		if (!verificationCode || verificationCode.trim().length !== 6) {
			setVerifyError('Ingresa un código de 6 dígitos');
			return;
		}
		setVerifying(true);
		setVerifyError(null);
		try {
			await api.confirmProfileUpdate(pendingSession.session, verificationCode.trim());
			await checkAuth();
			setPendingSession(null);
			setVerificationCode('');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error al confirmar el código';
			setVerifyError(message);
		} finally {
			setVerifying(false);
		}
	}, [checkAuth, pendingSession, verificationCode]);

	const discard = useCallback(() => {
		setForm({
			name: user?.nombre ?? userName ?? '',
			phone: user?.numero_telefono ?? '',
			newPassword: '',
		});
	}, [user, userName]);

	useEffect(() => {
		const unregister = register({ save, discard });
		return unregister;
	}, [register, save, discard]);

	return (
		<div className="space-y-4">
			<Card title="Perfil" desc="Actualiza la información que se muestra en el POS.">
				<div className="space-y-3">
					<div className="flex flex-wrap gap-2">
						{verificationBadges.map((badge) => (
							<span
								key={badge.key}
								className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
									badge.value
										? 'bg-[var(--pos-accent-green)]/15 text-[var(--pos-accent-green)]'
										: 'bg-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.45)]'
								}`}
							>
								{badge.label}: {badge.value ? 'Verificado' : 'Pendiente'}
							</span>
						))}
					</div>
					<Row label="Nombre">
						<Input value={form.name} onChange={(event) => handleChange('name', event.target.value)} placeholder="Tu nombre" disabled={saving} />
					</Row>
					<Row label="Teléfono">
						<Input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="55 1234 5678" disabled />
					</Row>
					<Row label="Correo">
						<Input value={user?.correo_electronico ?? userEmail ?? ''} disabled className="bg-slate-100 cursor-not-allowed" />
					</Row>
					<Row label="Avatar">
						<div className="flex items-center gap-3">
							<input id="pos-avatar-file" type="file" accept="image/*" className="hidden" onChange={(e)=>{const f=e.target.files?.[0] ?? null; setAvatarFile(f); try{setPreviewUrl(f?URL.createObjectURL(f):null)}catch{setPreviewUrl(null)}}} />
							<label htmlFor="pos-avatar-file" className="px-3 py-2 rounded-lg border">Seleccionar</label>
							{previewUrl && <img src={previewUrl} className="h-10 w-10 rounded-full object-cover" alt="preview" />}
							<button type="button" className="px-3 py-2 rounded-lg bg-[var(--pos-accent-green)] text-white" onClick={async()=>{ if(!avatarFile||!user?.id_usuario) return; setSaving(true); try{ await api.uploadUserAvatar(user.id_usuario, avatarFile); await checkAuth(); setPreviewUrl(null); setAvatarFile(null); }catch(e){ console.error(e);} finally{ setSaving(false);} }}>Subir</button>
						</div>
					</Row>
					<Row label="Nueva contraseña" hint="Deja en blanco para mantener la actual.">
						<Input value={form.newPassword} onChange={(event) => handleChange('newPassword', event.target.value)} type="password" placeholder="••••••" disabled={saving} />
					</Row>

					{pendingSession && (
						<div className="mt-3 rounded-lg border px-4 py-3" style={{ background: 'rgba(255,255,255,0.9)' }}>
							<div className="mb-2 text-[13px] font-medium">Confirma cambios con código</div>
							<div className="flex items-center gap-3">
								<input
									placeholder="Código de 6 dígitos"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
									className="w-40 rounded-lg px-3 py-2 text-[13px] outline-none"
								/>
								<button
									onClick={handleConfirmUpdate}
									disabled={verifying}
									className="px-3 py-2 rounded-lg font-semibold"
									style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
								>
									{verifying ? 'Confirmando...' : 'Confirmar'}
								</button>
								<button
									onClick={() => { setPendingSession(null); setVerificationCode(''); setVerifyError(null); }}
									className="px-2 py-1 rounded-lg font-semibold"
								>
									Cancelar
								</button>
							</div>
							{verifyError && <div className="mt-2 text-sm text-red-600">{verifyError}</div>}
						</div>
					)}
				</div>
			</Card>
			<Card title="Sesiones" desc="Cierra la sesión actual en este dispositivo.">
				<button
					onClick={onLogout}
					className="px-3 py-2 text-[13px] rounded-lg font-semibold"
					style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
				>
					Cerrar sesión
				</button>
			</Card>
		</div>
	);
}

function AboutSection({ register }: SectionProps) {
	useEffect(() => {
		const unregister = register({});
		return unregister;
	}, [register]);
	return (
		<Card title="Acerca de FilaCero" desc="Versión interna">
			<div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>
				Versión 0.1.0 — Configurador POS.
			</div>
		</Card>
	);
}

