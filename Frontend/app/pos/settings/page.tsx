"use client";
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { useUserStore } from '../../../src/state/userStore';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { useConfirm } from '../../../src/components/system/ConfirmProvider';

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
  { key: 'business', label: 'Negocio', desc: 'Nombre, logo y datos fiscales', icon: icon('M4 7h16M4 12h16M4 17h10') },
  { key: 'appearance', label: 'Apariencia', desc: 'Tema, acentos y densidad', icon: icon('M4 6h16v12H4z') },
  { key: 'pos', label: 'Preferencias POS', desc: 'Operación diaria y accesos rápidos', icon: icon('M6 3h12l3 6H3z M3 9h18v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z') },
  { key: 'receipts', label: 'Tickets/Facturas', desc: 'Formato y contenido de tickets', icon: icon('M7 8h10M7 12h10M7 16h7') },
  { key: 'devices', label: 'Dispositivos', desc: 'Impresoras y terminales', icon: icon('M4 7h16v10H4z M8 17v2h8v-2') },
  { key: 'payments', label: 'Pagos', desc: 'Métodos y propinas', icon: icon('M3 7h18v10H3z M7 7v10') },
  { key: 'taxes', label: 'Impuestos', desc: 'Tasas y desglose', icon: icon('M7 17h10M7 12h10M7 7h10') },
  { key: 'staff', label: 'Staff y roles', desc: 'Permisos y acceso', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z') },
  { key: 'notifications', label: 'Notificaciones', desc: 'Alertas y resúmenes', icon: icon('M12 19a3 3 0 0 0 3-3H9a3 3 0 0 0 3 3Zm6-5V11a6 6 0 1 0-12 0v3l-2 2h16Z') },
  { key: 'shortcuts', label: 'Atajos', desc: 'Productividad', icon: icon('M7 7h10v10H7z M9 9h6v6H9z') },
  { key: 'data', label: 'Datos y copia', desc: 'Exportar/Importar', icon: icon('M4 17h16M12 3v10m0 0 3-3m-3 3-3-3') },
  { key: 'locale', label: 'Idioma y región', desc: 'Moneda y formatos', icon: icon('M12 3a9 9 0 1 0 9 9h-9V3z') },
  { key: 'account', label: 'Cuenta y seguridad', desc: 'Sesiones y contraseña', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4Z') },
  { key: 'about', label: 'Acerca de', desc: 'Versión y legal', icon: icon('M12 7v6M12 17h.01') },
];

export default function POSSettingsPage() {
  const router = useRouter();
  const { reset } = useUserStore();
  const settings = useSettingsStore();
  const confirm = useConfirm();
  const [active, setActive] = useState<SectionKey>('business');
  const [filter, setFilter] = useState('');

  const visibleSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(s =>
      s.label.toLowerCase().includes(q) || (s.desc?.toLowerCase().includes(q))
    );
  }, [filter]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Cerrar sesión',
      description: '¿Seguro que quieres cerrar sesión en este dispositivo?',
      confirmText: 'Cerrar sesión',
      cancelText: 'Cancelar',
      tone: 'danger'
    });
    if (!ok) return;
    try { reset(); } catch {}
    router.push('/');
  };

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row */}
        <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
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
                  <button className='px-3 py-2 text-[13px] rounded-lg font-medium'
                          style={{ background:'rgba(0,0,0,0.06)', color:'var(--pos-text-heading)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
                    Descartar
                  </button>
      <button className='px-3 py-2 text-[13px] rounded-lg font-semibold'
        style={{ background:'var(--pos-accent-green)', color:'white', boxShadow:'0 1px 0 rgba(0,0,0,0.05)'}}>
                    Guardar cambios
                  </button>
                </div>
              </div>

              <div className='flex-1 min-h-0 overflow-y-auto pr-1 custom-scroll-area'>
                {active === 'business' && <BusinessSection />}
                {active === 'appearance' && <AppearanceSection />}
                {active === 'pos' && <PosPrefsSection />}
                {active === 'receipts' && <ReceiptsSection />}
                {active === 'devices' && <DevicesSection />}
                {active === 'payments' && <PaymentsSection />}
                {active === 'taxes' && <TaxesSection />}
                {active === 'staff' && <StaffSection />}
                {active === 'notifications' && <NotificationsSection />}
                {active === 'shortcuts' && <ShortcutsSection />}
                {active === 'data' && <DataSection />}
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

// ——— Sections ——— //
const Card: React.FC<{ title: string; desc?: string; children: React.ReactNode; right?: React.ReactNode }>=({ title, desc, children, right })=> (
  <div className='rounded-xl p-4' style={{background:'rgba(255,255,255,0.9)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
    <div className='flex items-start justify-between gap-3 mb-3'>
      <div>
        <h3 className='text-[14px] font-semibold' style={{color:'var(--pos-text-heading)'}}>{title}</h3>
        {desc && <p className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>{desc}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }>=({ label, hint, children })=> (
  <div className='grid grid-cols-1 md:grid-cols-3 gap-3 items-center py-2'>
    <div className='md:col-span-1'>
      <div className='text-[13px] font-medium' style={{color:'var(--pos-text-heading)'}}>{label}</div>
      {hint && <div className='text-[12px] opacity-80' style={{color:'var(--pos-text-muted)'}}>{hint}</div>}
    </div>
    <div className='md:col-span-2'>{children}</div>
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full rounded-lg px-3 py-2 text-[13px] outline-none ${props.className ?? ''}`}
         style={{ background:'rgba(255,255,255,0.9)', color:'#4b1c23', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}} />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`w-full rounded-lg px-3 py-2 text-[13px] outline-none ${props.className ?? ''}`}
          style={{ background:'rgba(255,255,255,0.9)', color:'#4b1c23', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}} />
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean)=>void }> = ({ checked, onChange }) => (
  <button
    type='button'
    onClick={()=> onChange(!checked)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition ${checked ? 'bg-[var(--pos-accent-green)]' : 'bg-[rgba(0,0,0,0.15)]'}`}
  >
    <span className={`inline-block w-5 h-5 transform bg-white rounded-full transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
  </button>
);

function BusinessSection() {
  return (
    <div className='space-y-4'>
      <Card title='Identidad del negocio' desc='Información pública y de contacto' right={<button className='text-[12px] px-3 py-1.5 rounded-md' style={{background:'rgba(0,0,0,0.06)'}}>Editar</button>}>
        <Row label='Nombre del negocio'>
          <Input placeholder='Ej. Cafetería La Esquina' />
        </Row>
        <Row label='Slogan'>
          <Input placeholder='Un lugar para disfrutar' />
        </Row>
        <Row label='Logo'>
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 rounded-lg bg-white/80 flex items-center justify-center' style={{boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
              <span className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>Previsualización</span>
            </div>
            <button className='px-3 py-2 text-[13px] rounded-lg font-medium' style={{background:'rgba(0,0,0,0.06)'}}>Subir logo</button>
          </div>
        </Row>
        <Row label='Datos fiscales' hint='RFC/NIF, razón social y domicilio'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            <Input placeholder='RFC / NIF' />
            <Input placeholder='Razón social' />
            <Input placeholder='Dirección fiscal' className='md:col-span-2' />
          </div>
        </Row>
        <Row label='Contacto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <Input placeholder='Teléfono' />
            <Input placeholder='Email' />
            <Input placeholder='Sitio web' />
          </div>
        </Row>
        <Row label='Horario'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <Input placeholder='Lun-Vie: 8:00-20:00' />
            <Input placeholder='Sáb: 9:00-14:00' />
            <Input placeholder='Dom: cerrado' />
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
        <Row label='Densidad'>
          <Select value={density} onChange={e=> set({density: e.target.value as any})}>
            <option value='comfortable'>Cómoda</option>
            <option value='compact'>Compacta</option>
          </Select>
        </Row>
        <Row label='Acento'>
          <div className='flex items-center gap-3'>
            <Toggle checked={accentTeal} onChange={(v)=> set({accentTeal: v})} />
            <span className='text-[13px]' style={{color:'var(--pos-text-muted)'}}>Usar acento verde brand</span>
          </div>
        </Row>
      </Card>
      <Card title='Vista previa'>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
          {[1,2,3,4,5,6].map(i=> (
            <div key={i} className='rounded-xl h-24' style={{background:'linear-gradient(135deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06))'}} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function PosPrefsSection() {
  const { showStock, confirmRemove, defaultView, set } = useSettingsStore();
  return (
    <div className='space-y-4'>
      <Card title='Operación'>
        <Row label='Vista predeterminada'>
          <div className='flex items-center gap-2'>
            <button onClick={()=> set({defaultView:'grid'})} className={`px-3 py-2 rounded-lg text-[13px] ${defaultView==='grid'?'bg-[var(--pos-accent-green)] text-white':'bg-[rgba(0,0,0,0.06)]'}`}>Grid</button>
            <button onClick={()=> set({defaultView:'list'})} className={`px-3 py-2 rounded-lg text-[13px] ${defaultView==='list'?'bg-[var(--pos-accent-green)] text-white':'bg-[rgba(0,0,0,0.06)]'}`}>Lista</button>
          </div>
        </Row>
        <Row label='Mostrar inventario'>
          <Toggle checked={showStock} onChange={(v)=> set({showStock: v})} />
        </Row>
        <Row label='Confirmar antes de eliminar'>
          <Toggle checked={confirmRemove} onChange={(v)=> set({confirmRemove: v})} />
        </Row>
      </Card>
      <Card title='Accesos rápidos'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
          {['Nueva venta','Abrir cajón','Reimprimir ticket'].map(a=> (
            <button key={a} className='px-3 py-2 rounded-lg text-[13px]' style={{background:'rgba(0,0,0,0.06)'}}>{a}</button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReceiptsSection() {
  const [logo, setLogo] = useState(true);
  const [taxBreakdown, setTaxBreakdown] = useState(true);
  return (
    <div className='space-y-4'>
      <Card title='Formato de ticket'>
        <Row label='Ancho papel'>
          <Select defaultValue='80mm'>
            <option>58mm</option>
            <option>80mm</option>
          </Select>
        </Row>
        <Row label='Mostrar logo en ticket'>
          <Toggle checked={logo} onChange={setLogo} />
        </Row>
        <Row label='Desglose de impuestos'>
          <Toggle checked={taxBreakdown} onChange={setTaxBreakdown} />
        </Row>
        <Row label='Encabezado'>
          <Input placeholder='Texto de encabezado' />
        </Row>
        <Row label='Pie de página'>
          <Input placeholder='Gracias por su compra' />
        </Row>
      </Card>
    </div>
  );
}

function DevicesSection() {
  return (
    <div className='space-y-4'>
  <Card title='Impresoras' right={<button className='px-3 py-2 text-[13px] rounded-lg font-medium' style={{background:'var(--pos-accent-green)', color:'#fff'}}>Registrar</button>}>
        <div className='rounded-lg p-3 flex items-center justify-between' style={{background:'rgba(0,0,0,0.04)'}}>
          <div>
            <div className='text-[13px] font-medium' style={{color:'var(--pos-text-heading)'}}>Ninguna impresora configurada</div>
            <div className='text-[12px]' style={{color:'var(--pos-text-muted)'}}>Agrega una para imprimir tickets</div>
          </div>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Buscar dispositivos</button>
        </div>
      </Card>
    </div>
  );
}

function PaymentsSection() {
  const [cash, setCash] = useState(true);
  const [card, setCard] = useState(true);
  const [tips, setTips] = useState(true);
  return (
    <div className='space-y-4'>
      <Card title='Métodos aceptados'>
        <Row label='Efectivo'><Toggle checked={cash} onChange={setCash} /></Row>
        <Row label='Tarjeta'><Toggle checked={card} onChange={setCard} /></Row>
        <Row label='Propinas'>
          <div className='flex items-center gap-3'>
            <Toggle checked={tips} onChange={setTips} />
            <Input placeholder='Porcentajes: 5, 10, 15' />
          </div>
        </Row>
      </Card>
    </div>
  );
}

function TaxesSection() {
  return (
    <div className='space-y-4'>
      <Card title='Tasas de impuesto' right={<button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Nueva tasa</button>}>
        <div className='rounded-lg p-3' style={{background:'rgba(0,0,0,0.04)'}}>
          <div className='text-[13px]' style={{color:'var(--pos-text-muted)'}}>Sin tasas definidas</div>
        </div>
      </Card>
    </div>
  );
}

function StaffSection() {
  return (
    <div className='space-y-4'>
      <Card title='Miembros del equipo' right={<button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Invitar</button>}>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {[1,2,3].map(i=> (
            <div key={i} className='rounded-lg p-3 flex items-center justify-between' style={{background:'rgba(0,0,0,0.04)'}}>
              <div>
                <div className='text-[13px] font-medium' style={{color:'var(--pos-text-heading)'}}>Miembro {i}</div>
                {/* Rol dinámico mostrado arriba via TopRightInfo */}
              </div>
              <button className='px-3 py-1.5 text-[12px] rounded-md' style={{background:'rgba(0,0,0,0.06)'}}>Gestionar</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const [daily, setDaily] = useState(true);
  const [lowStock, setLowStock] = useState(true);
  return (
    <div className='space-y-4'>
      <Card title='Alertas'>
        <Row label='Resumen diario'><Toggle checked={daily} onChange={setDaily} /></Row>
        <Row label='Stock bajo'><Toggle checked={lowStock} onChange={setLowStock} /></Row>
        <Row label='Email de reportes'><Input placeholder='correo@tu-negocio.com' /></Row>
      </Card>
    </div>
  );
}

function ShortcutsSection() {
  return (
    <div className='space-y-4'>
      <Card title='Atajos de teclado'>
        <div className='rounded-lg p-3' style={{background:'rgba(0,0,0,0.04)'}}>
          <ul className='text-[13px]' style={{color:'var(--pos-text-heading)'}}>
            <li className='flex justify-between py-1'><span>Abrir búsqueda</span><span className='opacity-70'>⌘K</span></li>
            <li className='flex justify-between py-1'><span>Nueva venta</span><span className='opacity-70'>N</span></li>
            <li className='flex justify-between py-1'><span>Agregar al carrito</span><span className='opacity-70'>A</span></li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

function DataSection() {
  return (
    <div className='space-y-4'>
      <Card title='Datos'>
        <div className='flex items-center gap-2'>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Exportar (.json)</button>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Importar</button>
        </div>
      </Card>
      <Card title='Zona de peligro' desc='Acciones destructivas'>
        <button className='px-3 py-2 text-[13px] rounded-lg font-semibold' style={{background:'rgba(220,38,38,0.12)', color:'#7f1d1d'}}>Resetear datos locales</button>
      </Card>
    </div>
  );
}

function LocaleSection() {
  const { locale, currency, dateFormat, set } = useSettingsStore();
  return (
    <div className='space-y-4'>
      <Card title='Idioma y región'>
        <Row label='Idioma'>
          <Select value={locale} onChange={(e)=> set({locale: e.target.value as any})}>
            <option value='es-MX'>Español (MX)</option>
            <option value='es-ES'>Español (ES)</option>
            <option value='en-US'>English (US)</option>
          </Select>
        </Row>
        <Row label='Moneda'>
          <Select value={currency} onChange={(e)=> set({currency: e.target.value as any})}>
            <option value='MXN'>MXN</option>
            <option value='USD'>USD</option>
            <option value='EUR'>EUR</option>
          </Select>
        </Row>
        <Row label='Formato de fecha'>
          <Select value={dateFormat} onChange={(e)=> set({dateFormat: e.target.value as any})}>
            <option value='auto'>Automático (regional)</option>
            <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
            <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
            <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
          </Select>
        </Row>
        <Row label='Formato numérico'>
          <Select defaultValue='1,234.56'>
            <option>1,234.56</option>
            <option>1.234,56</option>
          </Select>
        </Row>
      </Card>
    </div>
  );
}

function AccountSection({ onLogout }: { onLogout: ()=>void }) {
  return (
    <div className='space-y-4'>
      <Card title='Seguridad'>
        <Row label='Email'>
          <Input placeholder='correo@tu-negocio.com' />
        </Row>
        <Row label='Contraseña'>
          <div className='flex items-center gap-2'>
            <Input type='password' placeholder='••••••••' />
            <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Cambiar</button>
          </div>
        </Row>
        <Row label='2FA'>
          <Toggle checked={false} onChange={()=>{}} />
        </Row>
      </Card>
      <Card title='Sesiones' desc='Cierra sesión de este u otros dispositivos'>
        <div className='flex flex-wrap gap-2'>
          <button className='px-3 py-2 text-[13px] rounded-lg' style={{background:'rgba(0,0,0,0.06)'}}>Cerrar otras sesiones</button>
          <button onClick={onLogout} className='px-3 py-2 text-[13px] rounded-lg font-semibold' style={{background:'var(--pos-accent-green)', color:'#fff'}}>Cerrar sesión</button>
        </div>
      </Card>
    </div>
  );
}

function AboutSection() {
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
