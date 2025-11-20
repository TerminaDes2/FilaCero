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
import { BrandLogo } from '../../../src/components/BrandLogo';
import { useBusinessStore } from '../../../src/state/businessStore';
type SectionKey =
  | 'business'
  | 'appearance'
  | 'devices'
  | 'payments'
  | 'notifications'
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
  { key: 'business', label: 'Negocio', desc: 'Nombre, logo y datos fiscales', icon: icon('M4 7h16M4 12h16M4 17h10') },
  { key: 'appearance', label: 'Apariencia', desc: 'Tema, acentos y densidad', icon: icon('M4 6h16v12H4z') },
  { key: 'devices', label: 'Dispositivos', desc: 'Impresoras y terminales', icon: icon('M4 7h16v10H4z M8 17v2h8v-2') },
  { key: 'payments', label: 'Pagos', desc: 'Métodos y propinas', icon: icon('M3 7h18v10H3z M7 7v10') },
  { key: 'locale', label: 'Idioma y región', desc: 'Moneda y formatos', icon: icon('M12 3a9 9 0 1 0 9 9h-9V3z') },
  { key: 'account', label: 'Cuenta y seguridad', desc: 'Sesiones y contraseña', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z') },
  { key: 'about', label: 'Acerca de', desc: 'Versión y legal', icon: icon('M12 7v6M12 17h.01') },
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
    <div className='h-screen flex pos-pattern overflow-hidden'>
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row */}
        <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Configuración</span>
          </h1>
          <TopRightInfo businessName='Configuración' />
        </div>
        <div className='flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0'>
          {/* Left nav */}
          <section className='w-full lg:w-72 xl:w-80 flex flex-col flex-shrink-0 min-h-0 lg:pl-0'>
            <div className='rounded-2xl px-4 pt-4 pb-3 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0'
                 style={{background:'var(--pos-summary-bg)', boxShadow:'0 2px 4px rgba(0,0,0,0.06)'}}>
              {/* Search settings */}
              <div className='mb-3'>
                <div className='relative'>
                  <input
                    value={filter}
                    onChange={(e)=> setFilter(e.target.value)}
                    placeholder='Buscar en configuración...'
                    className='w-full rounded-lg px-3 py-2 text-[13px] outline-none'
                    style={{ background:'rgba(255,255,255,0.9)', color:'#4b1c23', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}
                  />
                  <span className='absolute right-2 top-1/2 -translate-y-1/2 text-[12px]' style={{color:'rgba(75,28,35,0.6)'}}>⌘K</span>
                </div>
              </div>
              {/* Nav items */}
              <nav aria-label='Secciones de configuración' className='flex-1 overflow-y-auto custom-scroll-area pr-1'>
                <ul className='space-y-1'>
                  {visibleSections.map(s => {
                    const isActive = s.key === active;
                    return (
                      <li key={s.key}>
                        <button
                          onClick={()=> setActive(s.key)}
                          className={`w-full text-left group flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium tracking-tight transition-colors focus:outline-none focus-visible:ring-2 ring-white/60 ${isActive ? 'bg-[rgba(255,255,255,0.92)] text-[rgb(80,32,38)] shadow-sm' : 'text-[rgba(75,28,35,0.9)] hover:bg-[rgba(255,255,255,0.6)]'}`}
                        >
                          <span className={`relative flex items-center justify-center w-8 h-8 rounded-md ${isActive ? 'bg-white/90' : 'bg-white/75 group-hover:bg-white/85'} shadow-inner shadow-white/30`}>{s.icon}</span>
                          <div className='min-w-0'>
                            <div className='truncate'>{s.label}</div>
                            {s.desc && <div className='text-[11px] truncate opacity-70'>{s.desc}</div>}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Logout inline */}
              <div className='pt-3 mt-3 border-t' style={{borderColor:'var(--pos-border-soft)'}}>
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold focus:outline-none focus-visible:ring-2'
                  style={{ background:'rgba(255,255,255,0.92)', color:'var(--fc-brand-600)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}}
                >
                  <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M16 17l5-5-5-5M21 12H9M13 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7' /></svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </section>

          {/* Right content */}
          <section className='flex-1 flex flex-col overflow-hidden min-h-0'>
            <section className='flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-6 pb-4 -mt-2' style={{background:'var(--pos-bg-sand)', boxShadow:'0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)'}}>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <h2 className='text-xl font-semibold tracking-tight' style={{color:'var(--pos-text-heading)'}}>
                    {sections.find(s=> s.key===active)?.label}
                  </h2>
                  {sections.find(s=> s.key===active)?.desc && (
                    <p className='text-[12px] opacity-80' style={{color:'var(--pos-text-muted)'}}>
                      {sections.find(s=> s.key===active)?.desc}
                    </p>
                  )}
                </div>
                {/* Action bar */}
                <div className='flex items-center gap-2'>
                  <button onClick={handleDiscard} className='px-3 py-2 text-[13px] rounded-lg font-medium'
                          style={{ background:'rgba(0,0,0,0.06)', color:'var(--pos-text-heading)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
                    Descartar
                  </button>
      <button onClick={handleSave} className='px-3 py-2 text-[13px] rounded-lg font-semibold'
        style={{ background:'var(--pos-accent-green)', color:'white', boxShadow:'0 1px 0 rgba(0,0,0,0.05)'}}>
                    Guardar cambios
                  </button>
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto pr-1 custom-scroll-area'>
                {active === 'business' && <BusinessSection />}
                {active === 'appearance' && <AppearanceSection />}
                {active === 'devices' && <DevicesSection />}
                {active === 'payments' && <PaymentsSection />}
                {active === 'notifications' && <NotificationsSection />}
                {active === 'locale' && <LocaleSection />}
                {active === 'account' && <AccountSection onLogout={handleLogout} />}
                {active === 'about' && <AboutSection />}
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

function BusinessSection() {
  const { business, setBusiness } = useBusinessStore();

  return (
    <div className='space-y-4'>
      <Card
        title='Identidad del negocio'
        desc='Información pública y de contacto'
        right={<button className='text-[12px] px-3 py-1.5 rounded-md' style={{background:'rgba(0,0,0,0.06)'}}>Editar</button>}
      >

        {/* Nombre del negocio */}
        <Row label='Nombre del negocio'>
          <Input
            value={business.name}
            onChange={(e) => setBusiness({ name: e.target.value })}
            placeholder='Ej. Cafetería La Esquina'
          />
        </Row>

        {/* Slogan */}
        <Row label='Slogan'>
          <Input
            value={business.slogan}
            onChange={(e) => setBusiness({ slogan: e.target.value })}
            placeholder='Un lugar para disfrutar'
          />
        </Row>

        {/* Logo */}
        <Row label='Logo'>
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 rounded-lg bg-white/80 flex items-center justify-center'
                 style={{boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
              {business.logo ? (
                <img src={business.logo} className='w-full h-full object-cover rounded-lg' />
              ) : (
                <span className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>Previsualización</span>
              )}
            </div>

            <input
              type="file"
              className="hidden"
              id="logoInput"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setBusiness({ logo: url });
                }
              }}
            />

            <button
              onClick={() => document.getElementById('logoInput')?.click()}
              className='px-3 py-2 text-[13px] rounded-lg font-medium'
              style={{background:'rgba(0,0,0,0.06)'}}
            >
              Subir logo
            </button>
          </div>
        </Row>

        {/* Datos fiscales */}
        <Row label='Datos fiscales' hint='RFC/NIF, razón social y domicilio'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <Input
              value={business.rfc}
              onChange={(e) => setBusiness({ rfc: e.target.value })}
              placeholder='RFC / NIF'
            />
            <Input
              value={business.razonSocial}
              onChange={(e) => setBusiness({ razonSocial: e.target.value })}
              placeholder='Razón social'
            />
            <Input
              value={business.direccionFiscal}
              onChange={(e) => setBusiness({ direccionFiscal: e.target.value })}
              placeholder='Dirección fiscal'
              className='md:col-span-2'
            />
          </div>
        </Row>

        {/* Contacto */}
        <Row label='Contacto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <Input
              value={business.telefono}
              onChange={(e) => setBusiness({ telefono: e.target.value })}
              placeholder='Teléfono'
            />
            <Input
              value={business.email}
              onChange={(e) => setBusiness({ email: e.target.value })}
              placeholder='Email'
            />
            <Input
              value={business.website}
              onChange={(e) => setBusiness({ website: e.target.value })}
              placeholder='Sitio web'
            />
          </div>
        </Row>

        {/* Horario */}
        <Row label='Horario'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <Input
              value={business.horario1}
              onChange={(e) => setBusiness({ horario1: e.target.value })}
              placeholder='Lun-Vie: 8:00-20:00'
            />
            <Input
              value={business.horario2}
              onChange={(e) => setBusiness({ horario2: e.target.value })}
              placeholder='Sáb: 9:00-14:00'
            />
            <Input
              value={business.horario3}
              onChange={(e) => setBusiness({ horario3: e.target.value })}
              placeholder='Dom: cerrado'
            />
          </div>
        </Row>

      </Card>
    </div>
  );
}


function AppearanceSection() {
  const { density, accentTeal, set } = useSettingsStore();
  return (
    <div className='space-y-4'>
      <Card title='Tema' desc='Ajustes visuales (solo modo claro)'>
        <Row label='Densidad' hint='Se aplica inmediatamente a todos los controles'>
          <div className='inline-flex items-center rounded-lg p-0.5' style={{background:'rgba(0,0,0,0.06)'}} role='group' aria-label='Selector de densidad'>
            <button
              type='button'
              aria-pressed={density==='comfortable'}
              onClick={()=> set({ density: 'comfortable' })}
              className={`px-3 text-[13px] font-medium rounded-md transition-colors ${density==='comfortable' ? 'text-white' : ''}`}
              style={{ height: 'var(--pos-control-h)', background: density==='comfortable' ? 'var(--pos-accent-green)' : 'transparent' }}
            >
              Cómoda
            </button>
            <button
              type='button'
              aria-pressed={density==='compact'}
              onClick={()=> set({ density: 'compact' })}
              className={`px-3 text-[13px] font-medium rounded-md transition-colors ${density==='compact' ? 'text-white' : ''}`}
              style={{ height: 'var(--pos-control-h)', background: density==='compact' ? 'var(--pos-accent-green)' : 'transparent' }}
            >
              Compacta
            </button>
          </div>
        </Row>
        <Row label='Acento'>
          <div className='flex items-center gap-3'>
            <Toggle checked={accentTeal} onChange={(v)=> set({accentTeal: v})} />
            <span className='text-[13px]' style={{color:'var(--pos-text-muted)'}}>Usar acento verde brand</span>
          </div>
        </Row>
      </Card>
      <Card title='Vista previa'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div className='rounded-xl p-3 space-y-2' style={{background:'rgba(0,0,0,0.03)'}}>
            <Input placeholder='Campo de entrada' />
            <Select defaultValue='op1'>
              <option value='op1'>Opción A</option>
              <option value='op2'>Opción B</option>
            </Select>
            <div className='flex gap-2'>
              <button className='px-3 rounded-lg text-[13px] font-medium' style={{ height: 'var(--pos-control-h)', background:'rgba(0,0,0,0.06)' }}>Secundario</button>
              <button className='px-3 rounded-full text-[13px] font-semibold text-white' style={{ height: 'var(--pos-control-h)', background:'var(--pos-accent-green)' }}>Primario</button>
            </div>
          </div>
          <div className='rounded-xl p-3 space-y-2' style={{background:'rgba(0,0,0,0.03)'}}>
            <div className='rounded-lg p-3 flex items-center justify-between' style={{background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)'}}>
              <div>
                <div className='text-[13px] font-semibold' style={{color:'var(--pos-text-heading)'}}>Elemento</div>
                <div className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>Descripción</div>
              </div>
              <span className='px-2 rounded-full text-[12px]' style={{height:'calc(var(--pos-control-h) - 12px)', display:'inline-flex', alignItems:'center', background:'var(--pos-badge-price-bg)', color:'var(--pos-chip-text)'}}>MXN 120</span>
            </div>
            <div className='rounded-lg p-3 flex items-center justify-between' style={{background:'var(--pos-card-bg)', border:'1px solid var(--pos-card-border)'}}>
              <div>
                <div className='text-[13px] font-semibold' style={{color:'var(--pos-text-heading)'}}>Elemento</div>
                <div className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>Descripción</div>
              </div>
              <button className='px-3 rounded-full text-[12px] font-semibold text-white' style={{ height: 'var(--pos-control-h)', background:'var(--pos-accent-green)' }}>Agregar</button>
            </div>
          </div>
          <div className='rounded-xl p-3 flex flex-col gap-2' style={{background:'rgba(0,0,0,0.03)'}}>
            <div className='rounded-lg p-3 flex-1' style={{background:'var(--pos-summary-bg)', border:'1px solid var(--pos-summary-border)'}}>
              <div className='text-[13px] font-semibold mb-2' style={{color:'var(--pos-text-heading)'}}>Resumen</div>
              <div className='space-y-1 text-[12px]'>
                <div className='flex justify-between'><span>Subtotal</span><span>$ 100.00</span></div>
                <div className='flex justify-between'><span>Impuestos</span><span>$ 16.00</span></div>
                <div className='flex justify-between font-semibold'><span>Total</span><span>$ 116.00</span></div>
              </div>
            </div>
            <button className='px-3 rounded-full text-[13px] font-semibold text-white' style={{ height: 'var(--pos-control-h)', background:'var(--pos-accent-green)' }}>Cobrar</button>
          </div>
        </div>
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
				phoneNumber: form.phone.trim() ? form.phone.trim() : null,
			};
			if (form.newPassword.trim()) payload.newPassword = form.newPassword.trim();
			await api.updateUserProfile(targetId, payload);
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
						<Input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} placeholder="55 1234 5678" disabled={saving} />
					</Row>
					<Row label="Correo">
						<Input value={user?.correo_electronico ?? userEmail ?? ''} disabled className="bg-slate-100 cursor-not-allowed" />
					</Row>
					<Row label="Nueva contraseña" hint="Deja en blanco para mantener la actual.">
						<Input value={form.newPassword} onChange={(event) => handleChange('newPassword', event.target.value)} type="password" placeholder="••••••" disabled={saving} />
					</Row>
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

function AboutSection( ) {
  return (
    <div className='space-y-4'>
      <Card title='Acerca de FilaCero'>
        <div className='text-[13px]' style={{color:'var(--pos-text-heading)'}}>
          <p>Versión: 0.1.0</p>
          <p className='opacity-80'>© {new Date().getFullYear()} FilaCero</p>
        </div>
      </Card>
      <Card title='Términos y Privacidad'>
        <div className='flex gap-2'>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Términos</button>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Privacidad</button>
        </div>
      </Card>
    </div>
  );
}

