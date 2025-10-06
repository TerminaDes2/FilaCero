'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, Store, MapPin, Cog, ClipboardList } from 'lucide-react'
import { useUserStore } from '../../../state/userStore'

type Step = 'identidad' | 'ubicacion' | 'operacion' | 'revision' | 'exito'

type Draft = {
  identidad: {
    nombre: string
    rubro: string
    colorMarca: 'brand' | 'emerald' | 'sun'
    logoDataUrl?: string
  }
  ubicacion: {
    direccion: string
    ciudad: string
    telefono?: string
    whatsapp?: string
    web?: string
    horarioApertura?: string
    horarioCierre?: string
  }
  operacion: {
    ventaParaLlevar: boolean
    ventaEnLocal: boolean
    tiempoPrepMin: number | ''
    pagosEfectivo: boolean
    pagosTarjeta: boolean
    pagosQR: boolean
    moneda: 'EUR' | 'USD' | 'MXN' | 'ARS' | 'COP' | 'CLP'
    gestionarStock: boolean
  }
}

const EMPTY_DRAFT: Draft = {
  identidad: { nombre: '', rubro: '', colorMarca: 'brand', logoDataUrl: undefined },
  ubicacion: { direccion: '', ciudad: '', telefono: '', whatsapp: '', web: '', horarioApertura: '', horarioCierre: '' },
  operacion: {
    ventaParaLlevar: true,
    ventaEnLocal: true,
    tiempoPrepMin: 5,
    pagosEfectivo: true,
    pagosTarjeta: true,
    pagosQR: false,
    moneda: 'EUR',
    gestionarStock: true,
  },
}

const DRAFT_KEY = 'businessOnboardingDraft'

export default function BusinessOnboardingWizard() {
  const router = useRouter()
  const { role } = useUserStore()
  const [step, setStep] = useState<Step>('identidad')
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [showHints, setShowHints] = useState<boolean>(true)

  // Cargar y persistir draft
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(DRAFT_KEY) : null
      if (raw) setDraft({ ...EMPTY_DRAFT, ...JSON.parse(raw) })
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {}
  }, [draft])

  // Si el rol no es OWNER, sugerir volver
  useEffect(() => {
    if (role !== 'OWNER') {
      // No bloqueamos, pero invitamos a seleccionar el rol negocio
      // Se mantiene la ruta funcionando por si llega directo
    }
  }, [role])

  // Validación por paso
  const stepValid = useMemo(() => {
    if (step === 'identidad') return draft.identidad.nombre.trim().length >= 2 && draft.identidad.rubro.trim().length >= 2
    if (step === 'ubicacion') return draft.ubicacion.direccion.trim().length >= 5 && draft.ubicacion.ciudad.trim().length >= 2
    if (step === 'operacion') return (draft.operacion.ventaParaLlevar || draft.operacion.ventaEnLocal) && !!draft.operacion.moneda
    if (step === 'revision') return true
    return false
  }, [step, draft])

  const next = useCallback(() => {
    if (!stepValid) return
    setStep(s => (s === 'identidad' ? 'ubicacion' : s === 'ubicacion' ? 'operacion' : s === 'operacion' ? 'revision' : s === 'revision' ? 'exito' : s))
  }, [stepValid])

  const back = useCallback(() => {
    setStep(s => (s === 'ubicacion' ? 'identidad' : s === 'operacion' ? 'ubicacion' : s === 'revision' ? 'operacion' : s))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === 'Return') && stepValid) next()
      if (e.key === 'Escape') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, stepValid])

  const colorClass = draft.identidad.colorMarca === 'emerald' ? 'emerald' : draft.identidad.colorMarca === 'sun' ? 'sun' : 'brand'

  if (step === 'exito') return <SuccessScreen colorClass={colorClass} onGoPOS={() => router.push('/pos')} onFinish={() => router.push('/')} />

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-b from-white to-white/70 dark:from-slate-900 dark:to-slate-900">
      {/* Top brand chip */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 dark:bg-slate-900/50 border-b border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
            <Store className={`w-4 h-4 text-${colorClass}-600`} />
            <span className="text-sm font-semibold">Onboarding Negocio</span>
          </div>
          <Progress step={step} colorClass={colorClass} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de contenido */}
        <section className="lg:col-span-2">
          {step === 'identidad' && (
            <Card>
              <CardHeader icon={<Store className={`w-5 h-5 text-${colorClass}-600`} />} title="Identidad del negocio" subtitle="Define cómo se presentará tu marca" />
              {showHints && (
                <div className="mb-3 p-3 rounded-xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-xs text-gray-600 flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01"/></svg>
                  <div>
                    Usa un nombre fácil de recordar y un color que represente tu estilo. Puedes subir un logo para ver cómo luce.
                    <button type="button" onClick={()=>setShowHints(false)} className="ml-2 text-brand-600 font-medium hover:underline">Ocultar tips</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nombre comercial" required>
                  <input value={draft.identidad.nombre} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, nombre:e.target.value}}))} className="fc-input" placeholder="Ej. Café Aurora" />
                </Field>
                <Field label="Rubro" required hint="Selecciona el tipo de negocio">
                  <select value={draft.identidad.rubro} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, rubro:e.target.value}}))} className="fc-select">
                    <option value="">Selecciona…</option>
                    <option value="cafeteria">Cafetería</option>
                    <option value="panaderia">Panadería</option>
                    <option value="pasteleria">Pastelería</option>
                    <option value="resto-cafe">Resto-Café</option>
                  </select>
                </Field>
                <Field label="Color de marca" hint="Afecta acentos y progresos">
                  <div className="flex items-center gap-2">
                    {(['brand','emerald','sun'] as const).map(c => (
                      <button key={c} type="button" onClick={()=>setDraft(d=>({...d, identidad:{...d.identidad, colorMarca:c}}))}
                        aria-pressed={draft.identidad.colorMarca===c}
                        className={`w-9 h-9 rounded-full ring-2 transition shadow-sm ${draft.identidad.colorMarca===c?`ring-${colorClass}-500`:'ring-black/10'} bg-gradient-to-br ${c==='brand'?'from-rose-500 to-rose-400':c==='emerald'?'from-emerald-500 to-emerald-400':'from-amber-400 to-amber-300'}`}
                        title={c}
                      />
                    ))}
                  </div>
                </Field>
                <Field label="Logo (opcional)" hint="SVG/PNG recomendado. No se sube, solo vista previa.">
                  <input type="file" accept="image/*,.svg" onChange={handleFile(setDraft)} />
                  {draft.identidad.logoDataUrl && (
                    <div className="mt-2 inline-flex items-center gap-3 p-2 rounded-xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
                      <img src={draft.identidad.logoDataUrl} alt="Logo preview" className="w-10 h-10 object-contain" />
                      <span className="text-xs text-gray-600">Vista previa</span>
                    </div>
                  )}
                </Field>
              </div>
            </Card>
          )}

          {step === 'ubicacion' && (
            <Card>
              <CardHeader icon={<MapPin className={`w-5 h-5 text-${colorClass}-600`} />} title="Ubicación y contacto" subtitle="Cuéntanos dónde y cómo contactarte" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Dirección" required>
                  <input value={draft.ubicacion.direccion} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, direccion:e.target.value}}))} className="fc-input" placeholder="Calle 123, Piso 1" />
                </Field>
                <Field label="Ciudad" required>
                  <input value={draft.ubicacion.ciudad} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, ciudad:e.target.value}}))} className="fc-input" placeholder="Madrid" />
                </Field>
                <Field label="Teléfono" hint="Con prefijo">
                  <input value={draft.ubicacion.telefono} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, telefono:e.target.value}}))} className="fc-input" placeholder="+34 600 000 000" />
                </Field>
                <Field label="WhatsApp">
                  <input value={draft.ubicacion.whatsapp} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, whatsapp:e.target.value}}))} className="fc-input" placeholder="+34 600 000 000" />
                </Field>
                <Field label="Web (opcional)">
                  <input value={draft.ubicacion.web} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, web:e.target.value}}))} className="fc-input" placeholder="https://cafearora.com" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Abre a">
                    <input type="time" value={draft.ubicacion.horarioApertura} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioApertura:e.target.value}}))} className="fc-input" />
                  </Field>
                  <Field label="Cierra a">
                    <input type="time" value={draft.ubicacion.horarioCierre} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioCierre:e.target.value}}))} className="fc-input" />
                  </Field>
                </div>
              </div>
            </Card>
          )}

          {step === 'operacion' && (
            <Card>
              <CardHeader icon={<Cog className={`w-5 h-5 text-${colorClass}-600`} />} title="Operación" subtitle="Configura cómo vendes y cobras" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Modalidades de venta" hint="Elige una o ambas">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaParaLlevar} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaParaLlevar:e.target.checked}}))} /> Para llevar</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaEnLocal} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaEnLocal:e.target.checked}}))} /> En local</label>
                  </div>
                </Field>
                <Field label="Tiempo medio de preparación (min)">
                  <input type="number" min={0} value={draft.operacion.tiempoPrepMin} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, tiempoPrepMin:e.target.value===''?'':Number(e.target.value)}}))} className="fc-input" />
                </Field>
                <Field label="Métodos de pago" hint="Selecciona los que aceptas">
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosEfectivo} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosEfectivo:e.target.checked}}))} /> Efectivo</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosTarjeta} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosTarjeta:e.target.checked}}))} /> Tarjeta</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosQR} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosQR:e.target.checked}}))} /> QR</label>
                  </div>
                </Field>
                <Field label="Moneda">
                  <select value={draft.operacion.moneda} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, moneda:e.target.value as Draft['operacion']['moneda']}}))} className="fc-select">
                    {(['EUR','USD','MXN','ARS','COP','CLP'] as const).map(m=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Gestión de stock">
                  <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.gestionarStock} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, gestionarStock:e.target.checked}}))} /> Activar control de stock</label>
                </Field>
              </div>
            </Card>
          )}

          {step === 'revision' && (
            <Card>
              <CardHeader icon={<ClipboardList className={`w-5 h-5 text-${colorClass}-600`} />} title="Revisión" subtitle="Confirma que todo esté correcto" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Summary title="Identidad">
                  <Item label="Nombre" value={draft.identidad.nombre} />
                  <Item label="Rubro" value={draft.identidad.rubro} />
                </Summary>
                <Summary title="Ubicación">
                  <Item label="Dirección" value={draft.ubicacion.direccion} />
                  <Item label="Ciudad" value={draft.ubicacion.ciudad} />
                  {draft.ubicacion.telefono && <Item label="Teléfono" value={draft.ubicacion.telefono} />}
                  {draft.ubicacion.whatsapp && <Item label="WhatsApp" value={draft.ubicacion.whatsapp} />}                
                </Summary>
                <Summary title="Operación">
                  <Item label="Venta" value={[draft.operacion.ventaEnLocal && 'En local', draft.operacion.ventaParaLlevar && 'Para llevar'].filter(Boolean).join(' · ')} />
                  <Item label="Pagos" value={[draft.operacion.pagosEfectivo && 'Efectivo', draft.operacion.pagosTarjeta && 'Tarjeta', draft.operacion.pagosQR && 'QR'].filter(Boolean).join(' · ')} />
                  <Item label="Moneda" value={draft.operacion.moneda} />
                </Summary>
              </div>
            </Card>
          )}

          {/* Navegación */}
          <div className="mt-4 flex items-center justify-between">
            <button onClick={back} disabled={step==='identidad'} className="fc-btn-secondary inline-flex items-center gap-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/> Atrás</button>
            <button onClick={next} disabled={!stepValid} className={`fc-btn-primary inline-flex items-center gap-2 bg-${colorClass}-600 hover:bg-${colorClass}-700 disabled:opacity-50`}>
              {step==='revision' ? 'Confirmar y crear' : 'Siguiente'}
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">Pulsa Enter para continuar, Esc para volver</div>
        </section>

        {/* Panel lateral con preview */}
        <aside className="lg:col-span-1">
          <Preview draft={draft} colorClass={colorClass} />
        </aside>
      </main>
    </div>
  )
}

// Components
function Progress({ step, colorClass }: { step: Step, colorClass: string }) {
  const idx = step === 'identidad' ? 1 : step === 'ubicacion' ? 2 : step === 'operacion' ? 3 : step === 'revision' ? 4 : 5
  const pct = (idx - 1) / 4 * 100
  return (
    <div className="w-56">
      <div className="text-xs font-medium mb-1 text-gray-600">Paso {idx <= 4 ? idx : 4} de 4</div>
      <div className="h-2 rounded-full bg-gray-200/70 overflow-hidden">
        <div className={`h-full bg-${colorClass}-600 transition-all`} style={{ width: `${pct}%`}} />
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/80 dark:bg-slate-900/40 backdrop-blur ring-1 ring-black/5 dark:ring-white/10 p-5 shadow-sm">{children}</div>
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h2>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }: { label: string, required?: boolean, hint?: string, children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </div>
      {children}
      {hint && <div className="mt-1 text-[10px] text-gray-500">{hint}</div>}
    </label>
  )
}

function Summary({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
      <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Item({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-gray-700"><span className="text-xs">{label}</span><span className="text-sm font-medium text-gray-900 dark:text-slate-100">{value}</span></div>
  )
}

function Preview({ draft, colorClass }: { draft: Draft, colorClass: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 dark:from-white/5 dark:to-white/0 ring-1 ring-black/5 dark:ring-white/10 p-5 h-full">
      <div className="text-xs font-semibold text-gray-600 mb-2">Vista previa</div>
      <div className="rounded-xl p-4 bg-white/80 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex items-center gap-3">
          {draft.identidad.logoDataUrl ? (
            <img src={draft.identidad.logoDataUrl} alt="Logo" className="w-10 h-10 rounded object-contain" />
          ) : (
            <div className={`w-10 h-10 rounded flex items-center justify-center bg-${colorClass}-600/10 text-${colorClass}-700 ring-1 ring-${colorClass}-600/20`}>
              <Store className="w-5 h-5"/>
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900">{draft.identidad.nombre || 'Tu negocio'}</div>
            <div className="text-[11px] text-gray-600">{draft.identidad.rubro || 'Rubro'}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs text-gray-700">
          {draft.ubicacion.direccion && <div className="flex items-center gap-2"><MapPin className={`w-3.5 h-3.5 text-${colorClass}-600`} /> <span>{draft.ubicacion.direccion}{draft.ubicacion.ciudad ? `, ${draft.ubicacion.ciudad}`:''}</span></div>}
          <div className="flex items-center gap-2"><Cog className={`w-3.5 h-3.5 text-${colorClass}-600`} /> <span>{[draft.operacion.ventaEnLocal && 'En local', draft.operacion.ventaParaLlevar && 'Para llevar'].filter(Boolean).join(' · ')}</span></div>
          <div className="flex items-center gap-2"><span className={`inline-flex w-2 h-2 rounded-full bg-${colorClass}-500`}/> <span>Moneda: {draft.operacion.moneda}</span></div>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ colorClass, onGoPOS, onFinish }:{ colorClass: string, onGoPOS:()=>void, onFinish:()=>void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 text-${colorClass}-600`} />
        <h1 className="text-2xl font-bold mb-1">¡Tu negocio está listo!</h1>
        <p className="text-sm text-gray-600 mb-5">Puedes empezar a crear productos y aceptar pedidos.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onFinish} className="fc-btn-secondary">Volver al inicio</button>
          <button onClick={onGoPOS} className={`fc-btn-primary bg-${colorClass}-600 hover:bg-${colorClass}-700`}>Ir al POS</button>
        </div>
      </div>
    </div>
  )
}

// helpers
function handleFile(setDraft: React.Dispatch<React.SetStateAction<Draft>>) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(d => ({ ...d, identidad: { ...d.identidad, logoDataUrl: reader.result as string } }))
    }
    reader.readAsDataURL(file)
  }
}

// Tailwind form presets
// Using classes consistent with the project (flattened appearance)
declare global {
  interface HTMLElementTagNameMap {
    // noop to keep file TS module
  }
}
