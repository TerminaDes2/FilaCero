'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, Store, MapPin, Cog, ClipboardList } from 'lucide-react'
import { useUserStore } from '../../../state/userStore'
import { LoginCard } from '../../auth/LoginCard'
import { api, activeBusiness } from '../../../lib/api'
import { useTranslation } from '../../../hooks/useTranslation'

type Step = 'identidad' | 'ubicacion' | 'operacion' | 'revision' | 'exito'

type Draft = {
  identidad: {
    nombre: string
    rubro: string
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
  identidad: { nombre: '', rubro: '', logoDataUrl: undefined },
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

export default function BusinessOnboardingWizard({ embed = false }: { embed?: boolean }) {
  const router = useRouter()
  const { role } = useUserStore()
  const { t } = useTranslation()
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
    setStep(s => (s === 'identidad' ? 'ubicacion' : s === 'ubicacion' ? 'operacion' : s === 'operacion' ? 'revision' : s))
  }, [stepValid])

  const back = useCallback(() => {
    setStep(s => (s === 'ubicacion' ? 'identidad' : s === 'operacion' ? 'ubicacion' : s === 'revision' ? 'operacion' : s))
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === 'Return') && stepValid) {
        if (step !== 'revision') {
          e.preventDefault();
          next();
        }
      }
      if (e.key === 'Escape') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, stepValid, step])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmAndCreate = useCallback(async () => {
    if (!stepValid) return
    setSaving(true)
    setError(null)
    try {
      const payload: Parameters<typeof api.createBusiness>[0] = {
        nombre: draft.identidad.nombre.trim(),
      }
      const direccion = draft.ubicacion.direccion.trim()
      if (direccion) payload.direccion = direccion
      const telefono = (draft.ubicacion.telefono || '').trim()
      if (telefono) payload.telefono = telefono
      // Logo aún no se sube al backend; se usa solo para vista previa local
      const created = await api.createBusiness(payload as any)
      const id = String((created as any)?.id_negocio ?? (created as any)?.id)
      if (id) activeBusiness.set(id)
      // limpiar draft y pasar a éxito
      try { localStorage.removeItem(DRAFT_KEY) } catch {}
      setStep('exito')
    } catch (e: any) {
      if (e?.status === 413) {
        setError(t('onboarding.business.errors.logoTooBig'))
      } else {
        setError(e?.message || t('onboarding.business.errors.createFailed'))
      }
    } finally {
      setSaving(false)
    }
  }, [draft, stepValid])

  // Bind Enter to confirm when on revision step (declared after confirmAndCreate exists)
  useEffect(() => {
    if (step !== 'revision') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === 'Return') && stepValid) {
        e.preventDefault();
        if (!saving) confirmAndCreate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, stepValid, saving, confirmAndCreate]);

  // Acentos fijos a la marca principal (brand)

  if (step === 'exito') {
    if (embed) {
      return (
        <div className="w-full max-w-md mx-auto text-center">
          <div className="flex items-center justify-center py-2">
            <CheckCircle2 className={`w-12 h-12 text-brand-600`} />
          </div>
          <h1 className="text-xl font-bold mb-1">{t('onboarding.business.success.title')}</h1>
          <p className="text-sm text-gray-600 mb-4">{t('onboarding.business.success.subtitle')}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push('/')} className="fc-btn-secondary">{t('onboarding.business.success.goHome')}</button>
            <button onClick={() => router.push('/pos')} className={`fc-btn-primary bg-brand-600 hover:bg-brand-700`}>{t('onboarding.business.success.goPOS')}</button>
          </div>
          <div className="mt-3 text-xs text-gray-500">{t('onboarding.business.success.note')}</div>
        </div>
      )
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginCard
          brandMark={<Store className="w-6 h-6" />}
          brandFull
          title={t('onboarding.business.success.title')}
          subtitle={t('onboarding.business.success.subtitle')}
          footer={(
            <div className="flex items-center justify-between">
              <button onClick={() => router.push('/')} className="fc-btn-secondary">{t('onboarding.business.success.goHome')}</button>
              <button onClick={() => router.push('/pos')} className={`fc-btn-primary bg-brand-600 hover:bg-brand-700`}>{t('onboarding.business.success.goPOS')}</button>
            </div>
          )}
        >
          <div className="flex items-center justify-center py-2">
            <CheckCircle2 className={`w-12 h-12 text-brand-600`} />
          </div>
        </LoginCard>
      </div>
    )
  }

  if (embed) {
    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
          <div className="mb-4">
          <Progress step={step} />
        </div>
        {step === 'identidad' && (
          <div className="space-y-4">
            {showHints && (
              <div className="p-3 rounded-xl bg-white/70 ring-1 ring-black/5 text-xs text-gray-600">
                {t('onboarding.business.hints.identity')}
                <button type="button" onClick={()=>setShowHints(false)} className="ml-2 text-brand-600 font-medium hover:underline">{t('onboarding.business.hints.hide')}</button>
              </div>
            )}
            <Field label={t('onboarding.business.identity.name.label')} required>
              <input value={draft.identidad.nombre} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, nombre:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.identity.name.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.identity.category.label')} required hint={t('onboarding.business.identity.category.hint')}>
              <select value={draft.identidad.rubro} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, rubro:e.target.value}}))} className="fc-select">
                <option value="">{t('onboarding.business.identity.category.placeholder')}</option>
                <option value="cafeteria">{t('onboarding.business.identity.category.options.cafeteria')}</option>
                <option value="panaderia">{t('onboarding.business.identity.category.options.bakery')}</option>
                <option value="pasteleria">{t('onboarding.business.identity.category.options.pastry')}</option>
                <option value="resto-cafe">{t('onboarding.business.identity.category.options.cafe')}</option>
              </select>
            </Field>
            {/* Color de marca removido: acentos fijos a brand */}
            <Field label={t('onboarding.business.identity.logo.label')} hint={t('onboarding.business.identity.logo.hint')}>
              <input type="file" accept="image/*,.svg" onChange={handleFile(setDraft)} />
              {draft.identidad.logoDataUrl && (
                <div className="mt-2 inline-flex items-center gap-3 p-2 rounded-xl bg-white/70 ring-1 ring-black/5">
                  <Image src={draft.identidad.logoDataUrl} alt="Logo preview" width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
                  <span className="text-xs text-gray-600">{t('onboarding.business.identity.logo.preview')}</span>
                </div>
              )}
            </Field>
          </div>
        )}
        {step === 'ubicacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('onboarding.business.location.address.label')} required>
              <input value={draft.ubicacion.direccion} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, direccion:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.address.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.city.label')} required>
              <input value={draft.ubicacion.ciudad} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, ciudad:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.city.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.phone.label')} hint={t('onboarding.business.location.phone.hint')}>
              <input value={draft.ubicacion.telefono} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, telefono:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.phone.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.whatsapp.label')}>
              <input value={draft.ubicacion.whatsapp} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, whatsapp:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.whatsapp.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.website.label')}>
              <input value={draft.ubicacion.web} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, web:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.website.placeholder')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('onboarding.business.location.hours.opens')}>
                <input type="time" value={draft.ubicacion.horarioApertura} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioApertura:e.target.value}}))} className="fc-input" />
              </Field>
              <Field label={t('onboarding.business.location.hours.closes')}>
                <input type="time" value={draft.ubicacion.horarioCierre} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioCierre:e.target.value}}))} className="fc-input" />
              </Field>
            </div>
          </div>
        )}
        {step === 'operacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('onboarding.business.operation.salesModes.label')} hint={t('onboarding.business.operation.salesModes.hint')}>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaParaLlevar} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaParaLlevar:e.target.checked}}))} /> {t('onboarding.business.operation.salesModes.takeaway')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaEnLocal} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaEnLocal:e.target.checked}}))} /> {t('onboarding.business.operation.salesModes.dineIn')}</label>
              </div>
            </Field>
            <Field label={t('onboarding.business.operation.prepTime.label')}>
              <input type="number" min={0} value={draft.operacion.tiempoPrepMin} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, tiempoPrepMin:e.target.value===''?'':Number(e.target.value)}}))} className="fc-input" />
            </Field>
            <Field label={t('onboarding.business.operation.paymentMethods.label')} hint={t('onboarding.business.operation.paymentMethods.hint')}>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosEfectivo} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosEfectivo:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.cash')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosTarjeta} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosTarjeta:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.card')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosQR} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosQR:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.qr')}</label>
              </div>
            </Field>
            <Field label={t('onboarding.business.operation.currency.label')}>
              <select value={draft.operacion.moneda} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, moneda:e.target.value as Draft['operacion']['moneda']}}))} className="fc-select">
                {(['EUR','USD','MXN','ARS','COP','CLP'] as const).map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label={t('onboarding.business.operation.inventory.label')}>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.gestionarStock} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, gestionarStock:e.target.checked}}))} /> {t('onboarding.business.operation.inventory.activate')}</label>
            </Field>
          </div>
        )}
        {step === 'revision' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Summary title={t('onboarding.business.review.title.identity')}>
              <Item label={t('onboarding.business.review.labels.name')} value={draft.identidad.nombre} />
              <Item label={t('onboarding.business.review.labels.category')} value={draft.identidad.rubro} />
            </Summary>
            <Summary title={t('onboarding.business.review.title.location')}>
              <Item label={t('onboarding.business.review.labels.address')} value={draft.ubicacion.direccion} />
              <Item label={t('onboarding.business.review.labels.city')} value={draft.ubicacion.ciudad} />
              {draft.ubicacion.telefono && <Item label={t('onboarding.business.review.labels.phone')} value={draft.ubicacion.telefono} />}
              {draft.ubicacion.whatsapp && <Item label={t('onboarding.business.review.labels.whatsapp')} value={draft.ubicacion.whatsapp} />}
            </Summary>
            <Summary title={t('onboarding.business.review.title.operation')}>
              <Item label={t('onboarding.business.review.labels.sales')} value={[draft.operacion.ventaEnLocal && t('onboarding.business.operation.salesModes.dineIn'), draft.operacion.ventaParaLlevar && t('onboarding.business.operation.salesModes.takeaway')].filter(Boolean).join(' · ')} />
              <Item label={t('onboarding.business.review.labels.payments')} value={[draft.operacion.pagosEfectivo && t('onboarding.business.operation.paymentMethods.cash'), draft.operacion.pagosTarjeta && t('onboarding.business.operation.paymentMethods.card'), draft.operacion.pagosQR && t('onboarding.business.operation.paymentMethods.qr')].filter(Boolean).join(' · ')} />
              <Item label={t('onboarding.business.review.labels.currency')} value={draft.operacion.moneda} />
            </Summary>
            <div className="md:col-span-2">
              <Preview draft={draft} t={t} />
            </div>
          </div>
        )}
        {/* Navegación (embed) */}
        <div className="mt-4 flex items-center justify-between">
          <button onClick={back} disabled={step==='identidad'} className="fc-btn-secondary inline-flex items-center gap-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/> {t('onboarding.business.navigation.back')}</button>
          <button
            onClick={step==='revision' ? confirmAndCreate : next}
            disabled={!stepValid || (step==='revision' && saving)}
            className={`fc-btn-primary inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50`}
          >
            {step==='revision' ? (saving ? t('onboarding.business.navigation.creating') : t('onboarding.business.navigation.confirm')) : t('onboarding.business.navigation.next')}
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">{t('onboarding.business.navigation.shortcuts')}</div>
        {error && <div className="mt-2 text-xs text-rose-600 text-center">{error}</div>}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoginCard
        brandMark={<Store className="w-6 h-6" />}
        brandFull
        title="Configura tu Negocio"
        subtitle="Continuando tu registro: completa estos pasos para finalizar"
        footer={(
          <div className="flex items-center justify-between">
            <button onClick={back} disabled={step==='identidad'} className="fc-btn-secondary inline-flex items-center gap-2 disabled:opacity-50"><ChevronLeft className="w-4 h-4"/> Atrás</button>
              <button onClick={step==='revision' ? confirmAndCreate : next} disabled={!stepValid || (step==='revision' && saving)} className={`fc-btn-primary inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50`}>
              {step==='revision' ? (saving ? 'Creando…' : 'Confirmar y crear') : 'Siguiente'}
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        )}
      >
        <div className="mb-4">
          <Progress step={step} />
        </div>
        {/* steps content retained as in embed rendering */}
        {step === 'identidad' && (
          <div className="space-y-4">
            {showHints && (
              <div className="p-3 rounded-xl bg-white/70 ring-1 ring-black/5 text-xs text-gray-600">
                {t('onboarding.business.hints.nameTip')}
                <button type="button" onClick={()=>setShowHints(false)} className="ml-2 text-brand-600 font-medium hover:underline">{t('onboarding.business.hints.hide')}</button>
              </div>
            )}
            <Field label={t('onboarding.business.identity.name.label')} required>
              <input value={draft.identidad.nombre} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, nombre:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.identity.name.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.identity.category.label')} required hint={t('onboarding.business.identity.category.hint')}>
              <select value={draft.identidad.rubro} onChange={e=>setDraft(d=>({...d, identidad:{...d.identidad, rubro:e.target.value}}))} className="fc-select">
                <option value="">{t('onboarding.business.identity.category.select')}</option>
                <option value="cafeteria">{t('onboarding.business.identity.category.options.cafeteria')}</option>
                <option value="panaderia">{t('onboarding.business.identity.category.options.bakery')}</option>
                <option value="pasteleria">{t('onboarding.business.identity.category.options.pastry')}</option>
                <option value="resto-cafe">{t('onboarding.business.identity.category.options.restoCafe')}</option>
              </select>
            </Field>
            {/* Color de marca removido: acentos fijos a brand */}
            <Field label={t('onboarding.business.identity.logo.label')} hint={t('onboarding.business.identity.logo.hint')}>
              <FileUploader onUpload={(dataUrl)=>setDraft(d=>({...d, identidad:{...d.identidad, logoDataUrl:dataUrl}}))} accept="image/*,.svg" />
              {draft.identidad.logoDataUrl && (
                <div className="mt-2 inline-flex items-center gap-3 p-2 rounded-xl bg-white/70 ring-1 ring-black/5">
                  <Image src={draft.identidad.logoDataUrl} alt="Logo preview" width={40} height={40} className="w-10 h-10 object-contain" unoptimized />
                  <span className="text-xs text-gray-600">{t('onboarding.business.review.preview.label')}</span>
                </div>
              )}
            </Field>
          </div>
        )}
        {step === 'ubicacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('onboarding.business.location.address.label')} required>
              <input value={draft.ubicacion.direccion} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, direccion:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.address.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.city.label')} required>
              <input value={draft.ubicacion.ciudad} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, ciudad:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.city.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.phone.label')} hint={t('onboarding.business.location.phone.hint')}>
              <input value={draft.ubicacion.telefono} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, telefono:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.phone.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.whatsapp.label')}>
              <input value={draft.ubicacion.whatsapp} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, whatsapp:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.whatsapp.placeholder')} />
            </Field>
            <Field label={t('onboarding.business.location.website.label')}>
              <input value={draft.ubicacion.web} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, web:e.target.value}}))} className="fc-input" placeholder={t('onboarding.business.location.website.placeholder')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('onboarding.business.location.hours.open')}>
                <input type="time" value={draft.ubicacion.horarioApertura} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioApertura:e.target.value}}))} className="fc-input" />
              </Field>
              <Field label={t('onboarding.business.location.hours.close')}>
                <input type="time" value={draft.ubicacion.horarioCierre} onChange={e=>setDraft(d=>({...d, ubicacion:{...d.ubicacion, horarioCierre:e.target.value}}))} className="fc-input" />
              </Field>
            </div>
          </div>
        )}
        {step === 'operacion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('onboarding.business.operation.salesMode.label')} hint={t('onboarding.business.operation.salesMode.hint')}>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaParaLlevar} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaParaLlevar:e.target.checked}}))} /> {t('onboarding.business.operation.salesMode.takeaway')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.ventaEnLocal} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, ventaEnLocal:e.target.checked}}))} /> {t('onboarding.business.operation.salesMode.dineIn')}</label>
              </div>
            </Field>
            <Field label={t('onboarding.business.operation.prepTime.label')}>
              <input type="number" min={0} value={draft.operacion.tiempoPrepMin} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, tiempoPrepMin:e.target.value===''?'':Number(e.target.value)}}))} className="fc-input" />
            </Field>
            <Field label={t('onboarding.business.operation.paymentMethods.label')} hint={t('onboarding.business.operation.paymentMethods.hint')}>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosEfectivo} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosEfectivo:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.cash')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosTarjeta} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosTarjeta:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.card')}</label>
                <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.pagosQR} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, pagosQR:e.target.checked}}))} /> {t('onboarding.business.operation.paymentMethods.qr')}</label>
              </div>
            </Field>
            <Field label={t('onboarding.business.operation.currency.label')}>
              <select value={draft.operacion.moneda} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, moneda:e.target.value as Draft['operacion']['moneda']}}))} className="fc-select">
                {(['EUR','USD','MXN','ARS','COP','CLP'] as const).map(m=> <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label={t('onboarding.business.operation.inventory.label')}>
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.operacion.gestionarStock} onChange={e=>setDraft(d=>({...d, operacion:{...d.operacion, gestionarStock:e.target.checked}}))} /> {t('onboarding.business.operation.inventory.enable')}</label>
            </Field>
          </div>
        )}
        {step === 'revision' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Summary title={t('onboarding.business.review.title.identity')}>
              <Item label={t('onboarding.business.review.labels.name')} value={draft.identidad.nombre} />
              <Item label={t('onboarding.business.review.labels.category')} value={draft.identidad.rubro} />
            </Summary>
            <Summary title={t('onboarding.business.review.title.location')}>
              <Item label={t('onboarding.business.review.labels.address')} value={draft.ubicacion.direccion} />
              <Item label={t('onboarding.business.review.labels.city')} value={draft.ubicacion.ciudad} />
              {draft.ubicacion.telefono && <Item label={t('onboarding.business.location.phone.label')} value={draft.ubicacion.telefono} />}
              {draft.ubicacion.whatsapp && <Item label={t('onboarding.business.location.whatsapp.label')} value={draft.ubicacion.whatsapp} />}
            </Summary>
            <Summary title={t('onboarding.business.review.title.operation')}>
              <Item label={t('onboarding.business.review.labels.sales')} value={[draft.operacion.ventaEnLocal && t('onboarding.business.operation.salesModes.dineIn'), draft.operacion.ventaParaLlevar && t('onboarding.business.operation.salesModes.takeaway')].filter(Boolean).join(' · ')} />
              <Item label={t('onboarding.business.review.labels.payments')} value={[draft.operacion.pagosEfectivo && t('onboarding.business.operation.paymentMethods.cash'), draft.operacion.pagosTarjeta && t('onboarding.business.operation.paymentMethods.card'), draft.operacion.pagosQR && t('onboarding.business.operation.paymentMethods.qr')].filter(Boolean).join(' · ')} />
              <Item label={t('onboarding.business.review.labels.currency')} value={draft.operacion.moneda} />
            </Summary>
            <div className="md:col-span-2">
              <Preview draft={draft} t={t} />
            </div>
          </div>
        )}
      </LoginCard>
      {error && <div className="mt-2 text-xs text-rose-600 text-center">{error}</div>}
    </div>
  )
}

// Components
function Progress({ step }: { step: Step }) {
  const idx = step === 'identidad' ? 1 : step === 'ubicacion' ? 2 : step === 'operacion' ? 3 : step === 'revision' ? 4 : 5
  const pct = (idx - 1) / 4 * 100
  return (
    <div className="w-56">
      {(() => { const { t } = useTranslation(); return (<div className="text-xs font-medium mb-1 text-gray-600">{t('onboarding.business.progress.step')} {idx <= 4 ? idx : 4} {t('onboarding.business.progress.of')} 4</div>) })()}
      <div className="h-2 rounded-full bg-gray-200/70 overflow-hidden">
        <div className={`h-full bg-brand-600 transition-all`} style={{ width: `${pct}%`}} />
      </div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-white/80 backdrop-blur ring-1 ring-black/5 p-5 shadow-sm">{children}</div>
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 ring-1 ring-black/5">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
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
    <div className="p-3 rounded-xl bg-white/60 ring-1 ring-black/5">
      <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Item({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-gray-700"><span className="text-xs">{label}</span><span className="text-sm font-medium text-gray-900">{value}</span></div>
  )
}

function Preview({ draft, t }: { draft: Draft, t: (key: string) => string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 ring-1 ring-black/5 p-5 h-full">
      <div className="text-xs font-semibold text-gray-600 mb-2">{t('onboarding.business.review.preview.title')}</div>
      <div className="rounded-xl p-4 bg-white/80 ring-1 ring-black/5">
        <div className="flex items-center gap-3">
            {draft.identidad.logoDataUrl ? (
              <Image src={draft.identidad.logoDataUrl} alt="Logo" width={40} height={40} className="w-10 h-10 rounded object-contain" unoptimized />
            ) : (
            <div className={`w-10 h-10 rounded flex items-center justify-center bg-brand-600/10 text-brand-700 ring-1 ring-brand-600/20`}>
              <Store className="w-5 h-5"/>
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900">{draft.identidad.nombre || t('onboarding.business.review.preview.defaultName')}</div>
            <div className="text-[11px] text-gray-600">{draft.identidad.rubro || t('onboarding.business.review.preview.defaultCategory')}</div>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-xs text-gray-700">
          {draft.ubicacion.direccion && <div className="flex items-center gap-2"><MapPin className={`w-3.5 h-3.5 text-brand-600`} /> <span>{draft.ubicacion.direccion}{draft.ubicacion.ciudad ? `, ${draft.ubicacion.ciudad}`:''}</span></div>}
          <div className="flex items-center gap-2"><Cog className={`w-3.5 h-3.5 text-brand-600`} /> <span>{[draft.operacion.ventaEnLocal && t('onboarding.business.operation.salesModes.dineIn'), draft.operacion.ventaParaLlevar && t('onboarding.business.operation.salesModes.takeaway')].filter(Boolean).join(' · ')}</span></div>
          <div className="flex items-center gap-2"><span className={`inline-flex w-2 h-2 rounded-full bg-brand-500`}/> <span>{t('onboarding.business.review.labels.currency')}: {draft.operacion.moneda}</span></div>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ onGoPOS, onFinish }:{ onGoPOS:()=>void, onFinish:()=>void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center">
  <CheckCircle2 className={`w-12 h-12 mx-auto mb-3 text-brand-600`} />
        <h1 className="text-2xl font-bold mb-1">¡Tu negocio está listo!</h1>
        <p className="text-sm text-gray-600 mb-5">Puedes empezar a crear productos y aceptar pedidos.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={onFinish} className="fc-btn-secondary">Volver al inicio</button>
          <button onClick={onGoPOS} className={`fc-btn-primary bg-brand-600 hover:bg-brand-700`}>Ir al POS</button>
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
