"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { useSettingsStore } from '../../../src/state/settingsStore';
import { api, activeBusiness } from '../../../src/lib/api';

type RangeKey = 'today'|'7d'|'14d'|'30d';
type AnalyticsData = {
  kpis: { revenueToday: number; ticketsToday: number; avgTicket: number; itemsSold: number };
  sparkline: { h: number; v: number }[];
  barDaily: { d: string; v: number }[];
  donut: { label: string; value: number }[];
  heatmap: { day: number; hour: number; v: number }[][];
};

// Utilidad para rangos
function rangeToDates(r: RangeKey): { desde: Date; hasta: Date; bucket: 'hour'|'day' } {
  const now = new Date();
  const end = new Date(now);
  if (r === 'today') {
    const start = new Date(now);
    start.setHours(0,0,0,0);
    return { desde: start, hasta: end, bucket: 'hour' };
  }
  const days = r === '7d' ? 7 : r === '14d' ? 14 : 30;
  const start = new Date(now);
  start.setHours(0,0,0,0);
  start.setDate(start.getDate() - (days - 1));
  return { desde: start, hasta: end, bucket: 'day' };
}

// Suma segura del total de una venta
function saleTotal(sale: any): number {
  if (sale?.total != null) return Number(sale.total) || 0;
  if (Array.isArray(sale?.detalle_venta)) {
    return sale.detalle_venta.reduce((acc: number, d: any) => acc + (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 0), 0);
  }
  return 0;
}

function useAnalytics(range: RangeKey, negocioId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [data, setData] = useState<AnalyticsData>();

  useEffect(() => {
    let cancelled = false;
    const { desde, hasta, bucket } = rangeToDates(range);
    const desdeStr = desde.toISOString();
    const hastaStr = hasta.toISOString();
    setLoading(true);
    setError(null);

  api.getSales({ estado: 'pagada', desde: desdeStr, hasta: hastaStr, ...(negocioId ? { id_negocio: negocioId } : {}) })
      .then((sales: any[]) => {
        if (cancelled) return;
        // KPIs
        const tickets = sales.length;
        const revenue = sales.reduce((acc, s) => acc + saleTotal(s), 0);
        let items = 0;
        for (const s of sales) {
          for (const d of (s.detalle_venta || [])) items += Number(d.cantidad) || 0;
        }
        const avgTicket = tickets > 0 ? revenue / tickets : 0;

        // Sparkline (24 puntos): si today -> por hora del día; si no -> últimos 24 buckets por día
        const points: { h: number; v: number }[] = [];
        if (bucket === 'hour') {
          const hours = Array.from({ length: 24 }, (_, h) => h);
          const byHour = new Array(24).fill(0);
          for (const s of sales) {
            const d = new Date(s.fecha_venta || s.fecha || s.createdAt || Date.now());
            const h = d.getHours();
            byHour[h] += saleTotal(s);
          }
          for (const h of hours) points.push({ h, v: Math.round(byHour[h]) });
        } else {
          // Tomar hasta 24 días hacia atrás (o lo que cubra el rango)
          const map = new Map<string, number>(); // yyyy-mm-dd -> revenue
          for (const s of sales) {
            const d = new Date(s.fecha_venta || s.fecha || s.createdAt || Date.now());
            const key = d.toISOString().slice(0,10);
            map.set(key, (map.get(key) || 0) + saleTotal(s));
          }
          const days: { date: Date; key: string }[] = [];
          const start = new Date(rangeToDates(range).desde);
          const end = new Date(rangeToDates(range).hasta);
          const iter = new Date(end);
          iter.setHours(0,0,0,0);
          const maxPoints = 24;
          while (iter >= start && days.length < maxPoints) {
            const key = iter.toISOString().slice(0,10);
            days.unshift({ date: new Date(iter), key });
            iter.setDate(iter.getDate() - 1);
          }
          let idx = 0;
          for (const day of days) points.push({ h: idx++, v: Math.round(map.get(day.key) || 0) });
        }

        // Barras: 14 días recientes de revenue
        const barDays: { d: string; v: number }[] = [];
        {
          const map = new Map<string, number>();
          for (const s of sales) {
            const d = new Date(s.fecha_venta || s.fecha || s.createdAt || Date.now());
            const key = d.toISOString().slice(0,10);
            map.set(key, (map.get(key) || 0) + saleTotal(s));
          }
          const end = new Date();
          end.setHours(0,0,0,0);
          const iter = new Date(end);
          for (let i=13;i>=0;i--) {
            const day = new Date(iter);
            day.setDate(end.getDate() - (13 - i));
            const key = day.toISOString().slice(0,10);
            const label = `${day.getDate()}/${day.getMonth()+1}`;
            barDays.push({ d: label, v: Math.round(map.get(key) || 0) });
          }
        }

        // Donut: % por categoría (si viene product.categoria.nombre, si no 'Otros')
        const catMap = new Map<string, number>();
        for (const s of sales) {
          for (const d of (s.detalle_venta || [])) {
            const product = d.producto || d.product || {};
            const cat = (product.categoria && (product.categoria.nombre || product.categoria.name)) || 'Otros';
            const amount = (Number(d.precio_unitario) || 0) * (Number(d.cantidad) || 0);
            catMap.set(cat, (catMap.get(cat) || 0) + amount);
          }
        }
        const donutEntries = Array.from(catMap.entries());
        donutEntries.sort((a,b)=> b[1]-a[1]);
        const donut = donutEntries.slice(0,4).map(([label, value])=> ({ label, value: Math.round(value) }));

        // Heatmap: intensidad por (día de semana 0..6, bloque de 2h)
        const heat: number[][] = Array.from({ length: 7 }, ()=> new Array(12).fill(0));
        for (const s of sales) {
          const d = new Date(s.fecha_venta || s.fecha || s.createdAt || Date.now());
          const dow = (d.getDay()+6)%7; // convertir a L=0 .. D=6
          const block = Math.floor(d.getHours()/2); // 0..11
          heat[dow][block] += saleTotal(s);
        }
        // Normalizar a 0..1 para visualización
        let maxHeat = 0;
        for (const row of heat) for (const v of row) maxHeat = Math.max(maxHeat, v);
        const heatmap = heat.map((row,day)=> row.map((v,hour)=> ({ day, hour, v: maxHeat? v/maxHeat : 0 })));

        const payload: AnalyticsData = {
          kpis: {
            revenueToday: Math.round(revenue),
            ticketsToday: tickets,
            avgTicket: Math.round(avgTicket),
            itemsSold: items
          },
          sparkline: points,
          barDaily: barDays,
          donut,
          heatmap
        };
        setData(payload);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Error cargando métricas');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [range, negocioId]);

  return { loading, error, data };
}

function num(n: number) { return n.toLocaleString('es-MX'); }

export default function AnalyticsPage() {
  const { defaultView } = useSettingsStore(); // store presence
  const [range, setRange] = useState<RangeKey>('today');
  const [negocioId, setNegocioId] = useState<string | null>(null);
  useEffect(() => {
    const stored = activeBusiness.get();
    if (stored) setNegocioId(stored);
    else if (process.env.NEXT_PUBLIC_NEGOCIO_ID) setNegocioId(String(process.env.NEXT_PUBLIC_NEGOCIO_ID));
  }, []);
  const handleBusinessChange = useCallback((id: string) => {
    setNegocioId(id || null);
    if (id) activeBusiness.set(id);
  }, []);
  const { loading, error, data } = useAnalytics(range, negocioId || undefined);

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header */}
        <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Métricas</span>
          </h1>
          <div className='flex items-center gap-3'>
            <RangeSelector value={range} onChange={setRange} />
            <BusinessSelector value={negocioId || ''} onChange={handleBusinessChange} />
            <TopRightInfo businessName='Analítica' />
          </div>
        </div>

        <section className='flex-1 flex flex-col overflow-hidden min-h-0'>
          <div className='flex-1 min-h-0 overflow-y-auto rounded-t-2xl px-5 pt-6 pb-4 -mt-1' style={{background:'var(--pos-bg-sand)', boxShadow:'0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)'}}>
            {loading && (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
                {Array.from({ length: 8 }).map((_,i)=> (
                  <div key={i} className='h-24 rounded-xl animate-pulse' style={{background:'rgba(255,255,255,0.6)'}} />
                ))}
              </div>
            )}
            {error && (
              <div className='text-sm text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-md px-3 py-2'>No se pudieron cargar las métricas.</div>
            )}
            {!loading && !error && data && (<Dashboard data={data} />)}
          </div>
        </section>
      </main>
    </div>
  );
}

function Dashboard({ data }: { data: AnalyticsData }) {
  const totalDonut = data.donut.reduce((a,b)=> a + b.value, 0);
  const donutAngles = data.donut.reduce<{ label:string; start:number; end:number; value:number }[]>((acc, seg, idx) => {
    const start = acc[idx-1]?.end ?? 0;
    const end = start + (seg.value/totalDonut) * Math.PI * 2;
    acc.push({ label: seg.label, start, end, value: seg.value });
    return acc;
  }, []);

  return (
    <div className='flex flex-col gap-5'>
      {/* KPI cards */}
      <section className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        <KPI title='Ingresos' value={`$ ${num(data.kpis.revenueToday)}`} delta={+8} spark={[12,16,14,18,22,24,28,26]} />
        <KPI title='Tickets' value={num(data.kpis.ticketsToday)} delta={+4} spark={[6,7,8,7,9,10,11,12]} />
        <KPI title='Ticket promedio' value={`$ ${num(data.kpis.avgTicket)}`} delta={-2} spark={[70,68,69,71,67,66,67,67]} />
        <KPI title='Artículos vendidos' value={num(data.kpis.itemsSold)} delta={+5} spark={[80,82,84,86,88,90,92,94]} />
      </section>

      {/* Row: sparkline + donut */}
      <section className='grid grid-cols-1 xl:grid-cols-3 gap-3'>
        <Card title='Tráfico por hora (hoy)' right={<span className='kbd-hint'>Hoy</span>}>
          <Sparkline data={data.sparkline} />
        </Card>
        <Card title='Ventas por categoría' right={<span className='kbd-hint'>7d</span>}>
          <DonutChart segments={donutAngles} />
        </Card>
        <Card title='Ranking rápido (14 días)'>
          <BarChart data={data.barDaily} />
        </Card>
      </section>

      {/* Insights strip */}
      <section className='grid grid-cols-1 md:grid-cols-3 gap-3'>
        <InsightCard icon='⚡' title='Hora pico' value='14:00 - 16:00' hint='Mayor flujo de tickets' />
        <InsightCard icon='🥤' title='Top categoría' value='Bebidas (42%)' hint='Capuccino y Latte dominan' />
        <InsightCard icon='🧍' title='Prom. por ticket' value={`$ ${num(data.kpis.avgTicket)}`} hint='Estrategia de upsell efectiva' />
      </section>

      {/* Heatmap */}
      <section>
        <Card title='Heatmap (hora × día)'>
          <Heatmap data={data.heatmap} />
        </Card>
      </section>
    </div>
  );
}

const Card: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }>=({ title, right, children })=> (
  <div className='rounded-2xl p-4' style={{background:'rgba(255,255,255,0.9)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
    <div className='flex items-center justify-between mb-2'>
      <h3 className='text-[14px] font-semibold' style={{color:'var(--pos-text-heading)'}}>{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

const KPI: React.FC<{ title: string; value: string | number; delta?: number; spark?: number[] }>=({ title, value, delta, spark })=> {
  const positive = (delta ?? 0) >= 0;
  const miniPts = useMemo(()=> {
    if (!spark || spark.length<2) return '';
    const max = Math.max(...spark);
    const min = Math.min(...spark);
    return spark.map((v,i)=> `${(i/(spark.length-1))*100},${100 - ((v-min)/(max-min||1))*100}`).join(' ');
  }, [spark]);
  return (
    <div className='rounded-2xl p-4 relative overflow-hidden' style={{background:'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
      <div className='flex items-center justify-between'>
        <div className='text-[12px] font-medium' style={{color:'var(--pos-text-muted)'}}>{title}</div>
        {typeof delta === 'number' && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${positive?'text-white':''}`} style={{background: positive ? 'var(--pos-accent-green)' : 'rgba(220,38,38,0.15)', color: positive ? '#fff' : '#7f1d1d'}}>
            {positive ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className='text-2xl font-extrabold tracking-tight' style={{color:'var(--pos-text-heading)'}}>{value}</div>
      {spark && (
        <svg viewBox='0 0 100 28' className='w-full h-7 mt-1'>
          <polyline points={miniPts} fill='none' stroke='var(--pos-accent-green)' strokeWidth='2' vectorEffect='non-scaling-stroke' />
        </svg>
      )}
      <div className='absolute -right-6 -bottom-6 w-24 h-24 rounded-full' style={{background:'var(--pos-badge-price-bg)'}} />
    </div>
  );
};

const Sparkline: React.FC<{ data: { h:number; v:number }[] }>=({ data })=> {
  const max = Math.max(...data.map(d=>d.v), 1);
  const pts = data.map((d,i) => `${(i/(data.length-1))*100},${100 - (d.v/max)*100}`).join(' ');
  const [hover, setHover] = useState<{i:number;x:number;y:number;v:number}|null>(null);
  return (
    <svg viewBox='0 0 100 40' role='img' aria-label='Sparkline de tráfico por hora' className='w-full h-24' onMouseLeave={()=>setHover(null)}>
      <polyline points={pts} fill='none' stroke='var(--pos-accent-green)' strokeWidth='2' vectorEffect='non-scaling-stroke' />
      <linearGradient id='grad' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stopColor='var(--pos-accent-green)' stopOpacity='0.22' />
        <stop offset='100%' stopColor='var(--pos-accent-green)' stopOpacity='0.02' />
      </linearGradient>
      <polygon points={`0,40 ${pts.replaceAll(',', ' ')} 100,40`} fill='url(#grad)' opacity={0.45} />
      {data.map((d,i)=>{
        const x = (i/(data.length-1))*100;
        const y = 100 - (d.v/max)*100;
        return (
          <g key={i} onMouseEnter={(e)=> setHover({i, x, y, v: d.v})}>
            <circle cx={x} cy={y} r={1.2} fill='var(--pos-accent-green)' />
          </g>
        );
      })}
      {hover && (
        <g>
          <rect x={Math.min(Math.max(hover.x-12,0),80)} y={Math.max(hover.y-18,0)} width='20' height='10' rx='2' fill='rgba(0,0,0,0.7)' />
          <text x={Math.min(Math.max(hover.x-10,2),88)} y={Math.max(hover.y-10,8)} fontSize='4' fill='#fff'>{hover.v}</text>
        </g>
      )}
    </svg>
  );
};

const BarChart: React.FC<{ data: { d:string; v:number }[] }>=({ data })=> {
  const max = Math.max(...data.map(d=>d.v), 1);
  return (
    <div className='grid grid-cols-14 gap-1 items-end h-32'>
      {data.map((b,i)=> {
        const h = Math.max(6, Math.round((b.v/max)*100));
        return (
          <div key={i} className='flex flex-col items-center gap-1'>
            <div className='w-3 rounded-sm transition-transform hover:scale-y-105' title={`$ ${num(b.v)}`} style={{height:`${h}%`, background:'var(--pos-accent-green)'}} aria-label={`${b.d}: $${num(b.v)}`} />
            <div className='text-[10px]' style={{color:'var(--pos-text-muted)'}}>{b.d}</div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart: React.FC<{ segments: { label:string; start:number; end:number; value:number }[] }>=({ segments })=> {
  const R = 36;
  const C = 2*Math.PI*R;
  return (
    <div className='flex items-center gap-4'>
      <svg viewBox='0 0 100 100' className='w-32 h-32'>
        <circle cx='50' cy='50' r={R} fill='none' stroke='rgba(0,0,0,0.06)' strokeWidth='14' />
        {segments.map((s, i) => {
          const ratio = (s.end - s.start) / (Math.PI*2);
          const dash = `${ratio*C} ${C}`;
          const offset = C * (1 - (s.start/(Math.PI*2)));
          const color = i%4===0?'var(--fc-teal-500)':i%4===1?'var(--fc-brand-600)':i%4===2?'var(--pos-warning)':'var(--pos-chip-text)';
          return (
            <circle key={i} cx='50' cy='50' r={R} fill='none' stroke={color}
              strokeWidth='14' strokeDasharray={dash} strokeDashoffset={offset} strokeLinecap='round' />
          );
        })}
      </svg>
      <ul className='text-[12px]'>
        {segments.map((s,i)=> (
          <li key={i} className='flex items-center gap-2'>
            <span className='inline-block w-2.5 h-2.5 rounded-sm' style={{background:i%4===0?'var(--fc-teal-500)':i%4===1?'var(--fc-brand-600)':i%4===2?'var(--pos-warning)':'var(--pos-chip-text)'}} />
            <span style={{color:'var(--pos-text-heading)'}}>{s.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Heatmap: React.FC<{ data: { day:number; hour:number; v:number }[][] }>=({ data })=> {
  const days = ['L','M','X','J','V','S','D'];
  return (
    <div className='overflow-x-auto'>
      <div className='inline-grid grid-rows-8 grid-cols-[auto_repeat(12,_minmax(28px,_1fr))] gap-1 p-2 rounded-xl' style={{background:'rgba(255,255,255,0.6)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
        <div />
        {Array.from({ length: 12 }, (_,h)=>(<div key={h} className='text-[10px] text-center' style={{color:'var(--pos-text-muted)'}}>{h*2}:00</div>))}
        {data.map((row, d)=>(
          <React.Fragment key={d}>
            <div className='text-[10px] pr-2 flex items-center justify-end' style={{color:'var(--pos-text-muted)'}}>{days[d]}</div>
            {row.map((cell, i)=> {
              const intensity = Math.round(cell.v*100);
              return <div key={i} title={`${days[d]} ${cell.hour*2}:00 · ${intensity}%`} aria-label={`Día ${days[d]}, ${cell.hour*2}:00, ${intensity}%`} className='rounded hover:ring-1 hover:ring-black/10' style={{background:`rgba(76,193,173,${0.06 + cell.v*0.6})`, height:28}} />
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const RangeSelector: React.FC<{ value: RangeKey; onChange: (r: RangeKey)=>void }>=({ value, onChange })=> (
  <div className='inline-flex items-center rounded-lg p-0.5' style={{background:'rgba(0,0,0,0.06)'}} role='group' aria-label='Rango de fechas'>
    {(['today','7d','14d','30d'] as RangeKey[]).map((r)=> (
      <button key={r} type='button' aria-pressed={value===r} onClick={()=> onChange(r)} className={`px-3 text-[12px] font-medium rounded-md transition-colors ${value===r ? 'text-white' : ''}`} style={{ height: 'var(--pos-control-h)', background: value===r ? 'var(--pos-accent-green)' : 'transparent' }}>
        {r==='today'?'Hoy':r}
      </button>
    ))}
  </div>
);

const BusinessSelector: React.FC<{ value: string; onChange: (id: string)=>void }>=({ value, onChange })=> {
  const [list, setList] = useState<Array<{ id_negocio: string; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetchedRef.current) {
      if (!value && list[0]) onChange(list[0].id_negocio);
      return;
    }
    fetchedRef.current = true;
    let cancelled = false;
    setLoading(true);
    api.listMyBusinesses()
      .then((arr: any[]) => {
        if (cancelled) return;
        const mapped = (arr||[]).map(b => ({ id_negocio: String(b.id_negocio ?? b.id), nombre: b.nombre || 'Sin nombre' }));
        setList(mapped);
        if (!value && mapped[0]) onChange(mapped[0].id_negocio);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [onChange, value, list]);
  return (
    <select value={value} onChange={(e)=> onChange(e.target.value)} className='text-[12px] rounded-md px-2' style={{ height: 'var(--pos-control-h)' }} aria-label='Negocio'>
      {list.map(b => <option key={b.id_negocio} value={b.id_negocio}>{b.nombre}</option>)}
    </select>
  );
};

const InsightCard: React.FC<{ icon:string; title:string; value:string; hint?:string }>=({ icon, title, value, hint })=> (
  <div className='rounded-2xl p-4 flex items-center gap-3' style={{background:'rgba(255,255,255,0.9)', boxShadow:'inset 0 0 0 1px rgba(0,0,0,0.05)'}}>
    <div className='w-10 h-10 rounded-xl flex items-center justify-center text-xl' style={{background:'var(--pos-badge-stock-bg)', color:'var(--pos-chip-text)'}}>{icon}</div>
    <div className='min-w-0'>
      <div className='text-[12px] font-medium' style={{color:'var(--pos-text-muted)'}}>{title}</div>
      <div className='text-base font-semibold truncate' style={{color:'var(--pos-text-heading)'}}>{value}</div>
      {hint && <div className='text-[11px]' style={{color:'var(--pos-text-muted)'}}>{hint}</div>}
    </div>
  </div>
);
