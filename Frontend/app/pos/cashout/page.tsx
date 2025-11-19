"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { DollarSign, ReceiptText, Wallet, ArrowDownCircle, RefreshCcw, AlertTriangle, History as HistoryIcon, CalendarDays } from 'lucide-react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { api } from '../../../src/lib/api';
import { useBusinessStore } from '../../../src/state/businessStore';

interface BusinessOption {
  id: string;
  name: string;
}

interface CashoutSummary {
  businessId: string;
  range: { from: string; to: string };
  totals: {
    salesCount: number;
    salesAmount: number | null;
    expectedCash: number | null;
    declaredCash: number | null;
    difference: number | null;
  };
  opening: {
    suggested: number | null;
    declared: number | null;
  };
  paymentBreakdown: Array<{
    id_tipo_pago: string | null;
    label: string;
    total: number | null;
    tickets: number;
  }>;
  recentSales: Array<{
    id: string;
    timestamp: string | null;
    total: number | null;
    paymentLabel: string;
  }>;
  lastCashout: {
    id: string;
    startedAt: string | null;
    finishedAt: string | null;
    initialAmount: number | null;
    finalAmount: number | null;
    salesCount: number | null;
  } | null;
}

interface CashoutResponse {
  cashout?: {
    id_corte: string;
  };
  resumen: CashoutSummary;
}

interface CashoutHistoryEntry {
  id: string;
  startedAt: string | null;
  finishedAt: string | null;
  totals: CashoutSummary['totals'];
  opening: CashoutSummary['opening'];
  paymentBreakdown: CashoutSummary['paymentBreakdown'];
  recentSales: CashoutSummary['recentSales'];
  recordedBy: string | null;
}

interface CashoutHistoryResponse {
  businessId: string;
  items: CashoutHistoryEntry[];
}

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return moneyFormatter.format(value);
}

function formatInputValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return value.toFixed(2);
}

function formatDate(value: string | null | undefined, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-MX', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

const panelSurfaceStyle: React.CSSProperties = {
  background: 'var(--pos-bg-sand)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)',
};
const panelStrongSurfaceStyle: React.CSSProperties = {
  background: 'var(--pos-bg-sand)',
  boxShadow: '0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)',
};
const listPanelItemStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.86)',
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
};
const listChipStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.05)',
  color: 'var(--pos-text-heading)',
};
const paymentChipStyle: React.CSSProperties = {
  background: 'rgba(15,118,110,0.08)',
  color: 'var(--pos-text-heading)',
};
const skeletonBlockStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.05)',
};

const emptySummary: CashoutSummary = {
  businessId: '',
  range: { from: new Date().toISOString(), to: new Date().toISOString() },
  totals: {
    salesCount: 0,
    salesAmount: 0,
    expectedCash: 0,
    declaredCash: null,
    difference: null,
  },
  opening: {
    suggested: null,
    declared: null,
  },
  paymentBreakdown: [],
  recentSales: [],
  lastCashout: null,
};

export default function CashoutPage() {
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const [businesses, setBusinesses] = useState<BusinessOption[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [fullDayMode, setFullDayMode] = useState<boolean>(true);
  const [summary, setSummary] = useState<CashoutSummary>(emptySummary);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [history, setHistory] = useState<CashoutHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<{ openAmount: string; closeAmount: string }>({ openAmount: '', closeAmount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummaryError(null);
    api.listMyBusinesses()
      .then((list) => {
        if (cancelled) return;
        const mapped: BusinessOption[] = (list || []).map((item: any) => ({
          id: String(item.id_negocio ?? item.id ?? item.uuid ?? ''),
          name: item.nombre || 'Negocio sin nombre',
        })).filter((item) => !!item.id);
        setBusinesses(mapped);
        if (!mapped.length) {
          setSelectedBusinessId('');
          return;
        }
        const preselected = activeBusiness?.id_negocio && mapped.some((biz) => biz.id === activeBusiness.id_negocio)
          ? activeBusiness.id_negocio
          : mapped[0].id;
        setSelectedBusinessId(preselected);
        const chosen = mapped.find((biz) => biz.id === preselected);
        if (chosen) {
          setActiveBusiness({
            id_negocio: chosen.id,
            nombre: chosen.name,
          });
        }
      })
      .catch(() => {
        if (!cancelled) setSummaryError('No se pudieron cargar los negocios');
      });
    return () => {
      cancelled = true;
    };
  }, [activeBusiness?.id_negocio, setActiveBusiness]);

  const hydrateSummary = useCallback(async (businessId: string, opts: { silent?: boolean } = {}) => {
    if (!businessId) return;
    if (!opts.silent) {
      setLoadingSummary(true);
      setSummaryError(null);
    }
    try {
      const data: CashoutSummary = await api.getCashoutSummary({
        id_negocio: businessId,
        incluir_recientes: true,
        limite_recientes: 12,
        todo_el_dia: fullDayMode,
      });
      setSummary(data);
      const suggested = data.opening.declared ?? data.opening.suggested;
      setFormValues({
        openAmount: formatInputValue(suggested),
        closeAmount: '',
      });
    } catch (error: any) {
      setSummary(emptySummary);
      setSummaryError(error?.message || 'No se pudo obtener el resumen');
    } finally {
      if (!opts.silent) setLoadingSummary(false);
    }
  }, [fullDayMode]);

  const hydrateHistory = useCallback(async (businessId: string, opts: { silent?: boolean } = {}) => {
    if (!businessId) return;
    if (!opts.silent) {
      setLoadingHistory(true);
      setHistoryError(null);
    }
    try {
      const data: CashoutHistoryResponse = await api.getCashoutHistory({
        id_negocio: businessId,
        limite: 6,
        incluir_recientes: false,
      });
      setHistory(data?.items ?? []);
    } catch (error: any) {
      setHistory([]);
      setHistoryError(error?.message || 'No se pudo obtener el historial');
    } finally {
      if (!opts.silent) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      void hydrateSummary(selectedBusinessId);
    }
  }, [selectedBusinessId, hydrateSummary]);

  useEffect(() => {
    if (selectedBusinessId) {
      void hydrateHistory(selectedBusinessId);
    } else {
      setHistory([]);
    }
  }, [selectedBusinessId, hydrateHistory]);

  const handleRefresh = useCallback(() => {
    if (!selectedBusinessId) return;
    void hydrateSummary(selectedBusinessId);
    void hydrateHistory(selectedBusinessId, { silent: true });
  }, [selectedBusinessId, hydrateSummary, hydrateHistory]);

  const toggleFullDay = () => {
    setFullDayMode((prev) => !prev);
  };

  const handleBusinessChange = (id: string) => {
    setSelectedBusinessId(id);
    const found = businesses.find((biz) => biz.id === id);
    if (found) {
      setActiveBusiness({
        id_negocio: found.id,
        nombre: found.name,
      });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBusinessId) return;

    const payload: {
      id_negocio: string;
      monto_inicial?: number;
      monto_final?: number;
      todo_el_dia?: boolean;
    } = {
      id_negocio: selectedBusinessId,
    };

    const openAmount = Number.parseFloat(formValues.openAmount.replace(/,/g, '.'));
    if (!Number.isNaN(openAmount)) {
      payload.monto_inicial = Number(openAmount.toFixed(2));
    }

    const closeAmount = Number.parseFloat(formValues.closeAmount.replace(/,/g, '.'));
    if (!Number.isNaN(closeAmount)) {
      payload.monto_final = Number(closeAmount.toFixed(2));
    }

    payload.todo_el_dia = fullDayMode;

    setSubmitting(true);
    setFeedback(null);
    try {
      const data: CashoutResponse = await api.createCashout(payload);
      setFeedback({ type: 'success', message: 'Corte de caja registrado correctamente' });
      if (data?.resumen) {
        setSummary(data.resumen);
        const suggested = data.resumen.opening.suggested;
        setFormValues({
          openAmount: formatInputValue(suggested),
          closeAmount: '',
        });
      } else {
        await hydrateSummary(selectedBusinessId, { silent: true });
      }
      await hydrateHistory(selectedBusinessId, { silent: true });
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'No se pudo registrar el corte' });
    } finally {
      setSubmitting(false);
    }
  };

  const expectedCash = summary?.totals.expectedCash ?? null;
  const declaredCash = formValues.closeAmount.trim() ? Number.parseFloat(formValues.closeAmount.replace(/,/g, '.')) : null;
  const liveDifference = declaredCash != null && expectedCash != null && !Number.isNaN(declaredCash)
    ? Number((declaredCash - expectedCash).toFixed(2))
    : null;

  const rangeLabel = useMemo(() => {
    if (!summary?.range) return '';
    const from = formatDate(summary.range.from);
    const to = formatDate(summary.range.to);
    return `${from} → ${to}`;
  }, [summary.range]);

  const coverageLabel = fullDayMode ? 'Cobertura: día completo' : 'Cobertura: desde último corte';

  return (
    <div className="h-screen flex pos-pattern overflow-hidden">
      <aside className="hidden md:flex flex-col h-screen sticky top-0">
        <PosSidebar />
      </aside>
      <main className="flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border">
        <div className="px-5 relative z-20 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--pos-text-muted)' }}>
              Corte de caja · {coverageLabel}
            </p>
            <p className="text-xs" style={{ color: 'var(--pos-text-muted)' }}>{rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BusinessSelect
              value={selectedBusinessId}
              options={businesses}
              onChange={handleBusinessChange}
              disabled={!businesses.length || loadingSummary || loadingHistory}
            />
            <button
              type="button"
              onClick={toggleFullDay}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium"
              style={{ background: fullDayMode ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.85)', color: 'var(--pos-text-heading)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}
            >
              <CalendarDays className="w-4 h-4" />
              {fullDayMode ? 'Todo el día' : 'Último corte'}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium"
              style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--pos-text-heading)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
              disabled={loadingSummary || loadingHistory}
            >
              <RefreshCcw className="w-4 h-4" />
              Actualizar
            </button>
            <TopRightInfo showLogout />
          </div>
        </div>

        <section className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0 px-5 pb-6">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            <div
              className="rounded-2xl p-4 space-y-4 flex-none"
              style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)' }}
            >
              {summaryError && (
                <div className="flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ background: 'rgba(254,226,226,0.8)', color: '#7f1d1d' }}>
                  <AlertTriangle className="w-4 h-4" />
                  {summaryError}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <SummaryCard
                  title="Ventas registradas"
                  value={loadingSummary ? '…' : summary.totals.salesCount.toString()}
                  icon={<ReceiptText className="w-5 h-5" />}
                />
                <SummaryCard
                  title="Monto vendido"
                  value={loadingSummary ? '…' : formatMoney(summary.totals.salesAmount)}
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <SummaryCard
                  title="Efectivo esperado"
                  value={loadingSummary ? '…' : formatMoney(summary.totals.expectedCash)}
                  icon={<Wallet className="w-5 h-5" />}
                />
                <SummaryCard
                  title="Diferencia"
                  value={loadingSummary ? '…' : formatMoney(liveDifference ?? summary.totals.difference)}
                  icon={<ArrowDownCircle className={`w-5 h-5 ${((liveDifference ?? summary.totals.difference) ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`} />}
                  emphasis
                />
              </div>
              <PaymentBreakdown loading={loadingSummary} payments={summary.paymentBreakdown} />
            </div>
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 min-h-0">
              <div
                className="rounded-2xl p-4 overflow-hidden flex flex-col"
                style={panelSurfaceStyle}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[14px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>Ventas recientes</h2>
                  <span className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{summary.totals.salesCount} tickets</span>
                </div>
                <RecentSales loading={loadingSummary} sales={summary.recentSales} />
              </div>
              <div
                className="rounded-2xl p-4 overflow-hidden flex flex-col"
                style={panelSurfaceStyle}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4" style={{ color: 'var(--pos-text-muted)' }} />
                    <h2 className="text-[14px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>Historial de cortes</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedBusinessId && hydrateHistory(selectedBusinessId)}
                    className="text-[11px] underline-offset-2"
                    style={{ color: 'var(--pos-text-muted)' }}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? 'Actualizando…' : 'Actualizar' }
                  </button>
                </div>
                {historyError && (
                  <div className="mb-2 text-[12px] rounded-md px-3 py-2" style={{ background: 'rgba(254,226,226,0.8)', color: '#7f1d1d' }}>
                    {historyError}
                  </div>
                )}
                <HistoryList loading={loadingHistory} items={history} />
              </div>
            </div>
          </div>

          <aside className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0">
            <div
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={panelStrongSurfaceStyle}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--pos-text-heading)' }}>Registrar corte</h2>
                <p className="text-[12px] mt-1" style={{ color: 'var(--pos-text-muted)' }}>
                  Verifica montos y confirma el cierre del turno.
                </p>
              </div>
              {summary.opening.suggested != null && (
                <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: 'rgba(245,240,235,0.9)', color: 'var(--pos-text-muted)' }}>
                  Sugerido para el siguiente turno: <strong style={{ color: 'var(--pos-text-heading)' }}>{formatMoney(summary.opening.suggested)}</strong>
                </div>
              )}
              {feedback && (
                <div
                  className="text-sm rounded-md px-3 py-2"
                  style={{
                    background: feedback.type === 'success' ? 'rgba(209,250,229,0.9)' : 'rgba(254,226,226,0.9)',
                    color: feedback.type === 'success' ? '#065f46' : '#7f1d1d',
                  }}
                >
                  {feedback.message}
                </div>
              )}
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
                  Monto inicial
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={formValues.openAmount}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, openAmount: event.target.value }))}
                    className="rounded-md px-3 py-2 text-[13px]"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', color: 'var(--pos-text-heading)' }}
                    placeholder={formatInputValue(summary.opening.suggested) || '0.00'}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>
                  Monto final contado
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={formValues.closeAmount}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, closeAmount: event.target.value }))}
                    className="rounded-md px-3 py-2 text-[13px]"
                    style={{ background: 'rgba(255,255,255,0.9)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', color: 'var(--pos-text-heading)' }}
                    placeholder={formatInputValue(expectedCash) || '0.00'}
                  />
                </label>
                <div className="rounded-lg px-3 py-2 text-[12px]" style={{ background: 'rgba(244,244,245,0.85)', color: 'var(--pos-text-muted)' }}>
                  Diferencia actual: <strong style={{ color: (liveDifference ?? summary.totals.difference ?? 0) >= 0 ? 'var(--pos-accent-green)' : '#b91c1c' }}>{formatMoney(liveDifference ?? summary.totals.difference)}</strong>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !selectedBusinessId}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold"
                  style={{ background: 'var(--pos-accent-green)', color: '#fff', boxShadow: '0 8px 18px -10px rgba(16,185,129,0.8)' }}
                >
                  {submitting ? 'Guardando…' : 'Confirmar corte'}
                </button>
              </form>
              {summary.lastCashout && (
                <div className="mt-1 rounded-lg px-3 py-2 text-[12px]" style={{ background: 'rgba(237,244,243,0.9)', color: 'var(--pos-text-muted)' }}>
                  Último corte: {formatDate(summary.lastCashout.finishedAt)} · {formatMoney(summary.lastCashout.finalAmount)}
                </div>
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

const BusinessSelect: React.FC<{ value: string; options: BusinessOption[]; onChange: (value: string) => void; disabled?: boolean }> = ({ value, options, onChange, disabled }) => (
  <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled || !options.length}
    className="rounded-md px-3 py-2 text-[12px]"
    style={{ background: 'rgba(255,255,255,0.95)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)', color: 'var(--pos-text-heading)' }}
  >
    {options.length === 0 && <option value="">Sin negocios</option>}
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.name}
      </option>
    ))}
  </select>
);

const SummaryCard: React.FC<{ title: string; value: string; icon: React.ReactNode; emphasis?: boolean }> = ({ title, value, icon, emphasis }) => (
  <div
    className={`rounded-2xl p-4 flex items-start gap-3 ${emphasis ? 'shadow-[0_10px_24px_-12px_rgba(32,32,32,0.36)]' : ''}`}
    style={{ background: emphasis ? 'linear-gradient(165deg, rgba(255,255,255,0.96), rgba(255,255,255,0.84))' : 'rgba(255,255,255,0.9)', boxShadow: emphasis ? 'inset 0 0 0 1px rgba(0,0,0,0.04)' : 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)', color: 'var(--pos-text-heading)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}>
      {icon}
    </div>
    <div>
      <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--pos-text-muted)' }}>{title}</div>
      <div className="text-xl font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{value}</div>
    </div>
  </div>
);

const PaymentBreakdown: React.FC<{ loading: boolean; payments: CashoutSummary['paymentBreakdown'] }> = ({ loading, payments }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.65)' }} />
        ))}
      </div>
    );
  }
  if (!payments.length) {
    return (
      <div className="rounded-xl px-3 py-3 text-[12px]" style={{ background: 'rgba(255,255,255,0.65)', color: 'var(--pos-text-muted)' }}>
        Aún no hay ventas registradas para este periodo.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {payments.map((payment) => (
        <div key={payment.id_tipo_pago ?? payment.label} className="rounded-xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.78)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <div className="text-[12px] font-medium" style={{ color: 'var(--pos-text-heading)' }}>{payment.label || 'Sin tipo'}</div>
          <div className="text-[13px]" style={{ color: 'var(--pos-text-muted)' }}>{payment.tickets} tickets</div>
          <div className="text-base font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{formatMoney(payment.total)}</div>
        </div>
      ))}
    </div>
  );
};

const RecentSales: React.FC<{ loading: boolean; sales: CashoutSummary['recentSales'] }> = ({ loading, sales }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 rounded-xl animate-pulse" style={skeletonBlockStyle} />
        ))}
      </div>
    );
  }
  if (!sales.length) {
    return <div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>No hay ventas registradas en el intervalo actual.</div>;
  }
  return (
    <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1 custom-scroll-area">
      {sales.map((sale) => (
        <div key={sale.id} className="rounded-xl px-3 py-2.5 flex items-center justify-between" style={listPanelItemStyle}>
          <div>
            <div className="text-[12px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{formatMoney(sale.total)}</div>
            <div className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{sale.paymentLabel}</div>
          </div>
          <div className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{formatDate(sale.timestamp)}</div>
        </div>
      ))}
    </div>
  );
};

const HistoryList: React.FC<{ loading: boolean; items: CashoutHistoryEntry[] }> = ({ loading, items }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 rounded-xl animate-pulse" style={skeletonBlockStyle} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <div className="text-[12px]" style={{ color: 'var(--pos-text-muted)' }}>Aún no se registran cortes en este negocio.</div>;
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[360px] pr-1 custom-scroll-area">
      {items.map((entry) => {
        const declared = formatMoney(entry.totals.declaredCash);
        const expected = formatMoney(entry.totals.expectedCash);
        const rawDiff = entry.totals.difference;
        const diffValue = rawDiff ?? 0;
        const diffColor = diffValue >= 0 ? 'var(--pos-accent-green)' : '#b91c1c';
        const diffLabel = rawDiff == null ? '—' : `${diffValue >= 0 ? '+' : ''}${formatMoney(diffValue)}`;
        const finishLabel = formatDate(entry.finishedAt ?? entry.startedAt);

        return (
          <div key={entry.id} className="rounded-xl px-3 py-3 flex flex-col gap-2" style={listPanelItemStyle}>
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{finishLabel}</div>
              <div className="text-[11px]" style={{ color: 'var(--pos-text-muted)' }}>{entry.totals.salesCount} tickets</div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--pos-text-muted)' }}>Declarado</div>
                <div className="text-[14px] font-semibold" style={{ color: 'var(--pos-text-heading)' }}>{declared}</div>
              </div>
              <div className="text-[12px] font-medium" style={{ color: rawDiff == null ? 'var(--pos-text-muted)' : diffColor }}>
                {diffLabel}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: 'var(--pos-text-muted)' }}>
              <span className="px-2 py-1 rounded-full" style={listChipStyle}>Esperado {expected}</span>
              <span className="px-2 py-1 rounded-full" style={listChipStyle}>Ventas {formatMoney(entry.totals.salesAmount)}</span>
              <span className="px-2 py-1 rounded-full" style={listChipStyle}>Apertura {formatMoney(entry.opening.declared)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {entry.paymentBreakdown.map((payment) => (
                <div key={`${entry.id}-${payment.id_tipo_pago ?? payment.label}`} className="px-2 py-1 rounded-md text-[10px]"
                  style={paymentChipStyle}>
                  {(payment.label || 'Sin tipo')}: {formatMoney(payment.total)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
