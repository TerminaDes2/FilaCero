'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { api, activeBusiness } from '../../../../src/lib/api';

export default function KitchenHistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [range, setRange] = useState<{ from?: string; to?: string }>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const biz = activeBusiness.get() || undefined;
        const data = await api.getSales({ id_negocio: biz, estado: 'entregado' });
        setRows(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (ql) {
        const code = (r.codigo || r.code || r.folio || '').toString().toLowerCase();
        const mesa = (r.mesa || r.table || '').toString().toLowerCase();
        if (!code.includes(ql) && !mesa.includes(ql)) return false;
      }
      const date = new Date(r.fecha || r.createdAt || r.fecha_venta || Date.now());
      if (range.from && date < new Date(range.from)) return false;
      if (range.to && date > new Date(range.to)) return false;
      return true;
    });
  }, [rows, q, range]);

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Historial de comandas</h1>
          <p className="text-sm text-gray-600">Pedidos entregados y cerrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar código/mesa" className="px-3 py-2 rounded-lg border bg-white text-sm" />
          <input type="date" value={range.from || ''} onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))} className="px-3 py-2 rounded-lg border bg-white text-sm" />
          <input type="date" value={range.to || ''} onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))} className="px-3 py-2 rounded-lg border bg-white text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-3 border-b">Fecha</th>
              <th className="p-3 border-b">Código</th>
              <th className="p-3 border-b">Mesa</th>
              <th className="p-3 border-b">Total items</th>
              <th className="p-3 border-b">Notas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => {
              const date = new Date(r.fecha || r.createdAt || r.fecha_venta || Date.now());
              const items = Array.isArray(r.items || r.detalles || r.line_items) ? (r.items || r.detalles || r.line_items) : [];
              const total = items.reduce((sum: number, it: any) => sum + Number(it.qty || it.cantidad || 1), 0);
              return (
                <tr key={idx} className="odd:bg-gray-50/50">
                  <td className="p-3 border-b">{date.toLocaleString()}</td>
                  <td className="p-3 border-b">{r.codigo || r.code || r.folio || '-'}</td>
                  <td className="p-3 border-b">{r.mesa || r.table || '-'}</td>
                  <td className="p-3 border-b">{total}</td>
                  <td className="p-3 border-b">{r.nota || r.notes || '-'}</td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && (
              <tr><td className="p-6 text-center text-gray-400" colSpan={5}>Sin resultados</td></tr>
            )}
            {loading && (
              <tr><td className="p-6 text-center text-gray-400" colSpan={5}>Cargando…</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
