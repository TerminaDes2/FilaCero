"use client";
import React, { useMemo, useState } from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { CategoryTabs } from '../../../src/components/pos/filters/CategoryTabs';
import { SearchBox } from '../../../src/components/pos/controls/SearchBox';
import { ViewToggle } from '../../../src/components/pos/controls/ViewToggle';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  active: boolean;
};

const MOCK: Product[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `prod_${i + 1}`,
  name: [`Café Latte`, `Brownie Nuez`, `Sandwich Jamón`, `Té Verde`, `Galleta`][i % 5] + ` ${i + 1}`,
  sku: `SKU${(1000 + i).toString()}`,
  price: 25 + (i % 6) * 7,
  stock: (i * 3) % 40,
  category: ['bebidas', 'alimentos', 'postres'][i % 3],
  active: i % 7 !== 0
}));

export default function ProductsAdminPage() {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [category, setCategory] = useState<string>('all');
  const [selection, setSelection] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Product | null>(null);

  const categories = useMemo(() => Array.from(new Set(MOCK.map(p => p.category))), []);
  const filtered = useMemo(() =>
    MOCK.filter(p => (category === 'all' || p.category === category) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
    )
  , [search, category]);

  const toggle = (id: string) => setSelection(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  const allSelected = selection.length > 0 && selection.length === filtered.length;
  const toggleAll = () => setSelection(allSelected ? [] : filtered.map(p => p.id));
  const startNew = () => {
    setDraft({ id: 'new', name: '', sku: '', price: 0, stock: 0, category: 'bebidas', active: true });
    setEditorOpen(true);
  };
  const startEdit = (p: Product) => {
    setDraft({ ...p });
    setEditorOpen(true);
  };
  const closeEditor = () => setEditorOpen(false);
  const saveDraft = () => {
    // Frontend-only mock: just close for now
    setEditorOpen(false);
  };

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      {/* Sidebar */}
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>

      {/* Main */}
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row: App brand left + TopRightInfo right */}
        <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </h1>
          <TopRightInfo employeeName='Juan Pérez' role='Cajero' businessName='Punto de Venta' />
        </div>

        {/* Category tabs outside the panel, like home */}
        <div className='px-5 relative z-20'>
          <CategoryTabs categories={categories} value={category} onChange={setCategory} />
        </div>

        {/* Panel area: all controls INSIDE the panel */}
        <section className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 -mt-4' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
          {/* Panel header: search + view + actions (import/new) */}
          <header className='space-y-3 mb-3 flex-none'>
            <div className='flex flex-col md:flex-row md:items-center gap-3'>
              <SearchBox value={search} onChange={setSearch} />
              <div className='flex items-center gap-2'>
                <ViewToggle value={view} onChange={setView} />
                <div className='ml-0 md:ml-2 flex items-center gap-2'>
                  <button className='h-9 px-3 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Importar CSV</button>
                  <button onClick={startNew} className='h-9 px-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Nuevo producto</button>
                </div>
              </div>
            </div>
          </header>
          {/* Bulk bar when selecting */}
          {selection.length > 0 && (
            <div className='mb-3 flex items-center justify-between rounded-lg px-3 py-2' style={{ background: 'var(--pos-summary-bg)', border: '1px solid var(--pos-summary-border)' }}>
              <div className='text-sm' style={{ color: 'var(--pos-text-heading)' }}>{selection.length} seleccionados</div>
              <div className='flex items-center gap-2'>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Activar</button>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Desactivar</button>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Aplicar descuento</button>
              </div>
            </div>
          )}

          {/* Grid view */}
          {view === 'grid' ? (
            <div className='min-h-0 overflow-y-auto pr-1 custom-scroll-area'>
              {/* Select all inline sticky bar (not a grid card) */}
              <div className='sticky top-0 z-10 mb-2'>
                <label className='w-full rounded-lg px-3 py-2 flex items-center gap-3 bg-[var(--pos-card-bg)] border border-[var(--pos-card-border)] cursor-pointer shadow-sm'>
                  <input type='checkbox' className='accent-[var(--pos-accent-green)]' checked={allSelected} onChange={toggleAll} />
                  <span className='text-sm font-medium' style={{ color: 'var(--pos-text-heading)' }}>Seleccionar todos ({filtered.length})</span>
                </label>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
              {filtered.map(p => {
                const selected = selection.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={'group relative rounded-xl p-3 transition shadow-sm hover:shadow-md'}
                    style={{
                      background: 'var(--pos-card-bg)',
                      border: '1px solid var(--pos-card-border)',
                      color: 'var(--pos-text-heading)',
                      boxShadow: selected ? 'inset 0 0 0 2px var(--pos-accent-green)' : undefined
                    }}
                  >
                    <div className='flex items-start gap-2'>
                      <input type='checkbox' className='mt-0.5 accent-[var(--pos-accent-green)]' checked={selected} onChange={() => toggle(p.id)} />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='text-sm font-semibold truncate'>{p.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.active ? '' : 'opacity-60'}`} style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{p.category}</span>
                        </div>
                        <div className='mt-1 text-[11px] text-[var(--pos-text-muted)] truncate'>SKU: {p.sku}</div>
                        <div className='mt-2 flex items-center justify-between'>
                          <span className='text-sm font-semibold tabular-nums'>${p.price.toFixed(2)}</span>
                          <span className='text-[11px] text-[var(--pos-text-muted)]'>Stock: {p.stock}</span>
                        </div>
                      </div>
                    </div>
                    <div className='mt-2 flex items-center gap-2'>
                      <button onClick={() => startEdit(p)} className='h-8 px-2 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Editar</button>
                      <button className='h-8 px-2 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{p.active ? 'Desactivar' : 'Activar'}</button>
                      <button className='ml-auto h-8 px-2 rounded-md text-xs font-semibold' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Clonar</button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          ) : (
            // List view (table)
            <div className='min-h-0 overflow-auto rounded-lg border border-[var(--pos-card-border)] bg-[var(--pos-card-bg)]'>
              <table className='w-full text-[13px]'>
                <thead className='sticky top-0 bg-[var(--pos-badge-stock-bg)] text-left'>
                  <tr>
                    <th className='px-3 py-2 w-10'><input type='checkbox' checked={allSelected} onChange={toggleAll} className='accent-[var(--pos-accent-green)]' /></th>
                    <th className='px-3 py-2'>Producto</th>
                    <th className='px-3 py-2'>SKU</th>
                    <th className='px-3 py-2'>Categoría</th>
                    <th className='px-3 py-2 text-right'>Precio</th>
                    <th className='px-3 py-2 text-right'>Stock</th>
                    <th className='px-3 py-2 text-right'>Estado</th>
                    <th className='px-3 py-2 text-right'>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const selected = selection.includes(p.id);
                    return (
                      <tr key={p.id} className={`border-t border-[var(--pos-card-border)] ${selected ? 'bg-[var(--pos-badge-stock-bg)]' : ''}`}>
                        <td className='px-3 py-2'><input type='checkbox' className='accent-[var(--pos-accent-green)]' checked={selected} onChange={() => toggle(p.id)} /></td>
                        <td className='px-3 py-2' style={{ color: 'var(--pos-text-heading)' }}>{p.name}</td>
                        <td className='px-3 py-2 text-[var(--pos-text-muted)]'>{p.sku}</td>
                        <td className='px-3 py-2'><span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{p.category}</span></td>
                        <td className='px-3 py-2 text-right tabular-nums' style={{ color: 'var(--pos-text-heading)' }}>${p.price.toFixed(2)}</td>
                        <td className='px-3 py-2 text-right text-[var(--pos-text-muted)]'>{p.stock}</td>
                        <td className='px-3 py-2 text-right'><span className={`text-xs font-medium ${p.active ? 'text-[var(--pos-accent-green)]' : 'text-[var(--pos-text-muted)]'}`}>{p.active ? 'Activo' : 'Inactivo'}</span></td>
                        <td className='px-3 py-2 text-right'>
                          <div className='inline-flex items-center gap-2'>
                            <button onClick={() => startEdit(p)} className='h-8 px-2 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Editar</button>
                            <button className='h-8 px-2 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{p.active ? 'Desactivar' : 'Activar'}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right-side editor panel */}
        {editorOpen && (
          <>
            <button aria-label='Cerrar editor' onClick={closeEditor} className='fixed inset-0 bg-black/20 backdrop-blur-[1px] cursor-default' />
            <aside className='fixed right-0 top-0 h-screen w-[360px] md:w-[420px] shadow-2xl z-50 flex flex-col' style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
              <div className='px-4 py-3 border-b' style={{ borderColor: 'var(--pos-card-border)' }}>
                <div className='flex items-center justify-between'>
                  <h2 className='text-base font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{draft?.id === 'new' ? 'Nuevo producto' : 'Editar producto'}</h2>
                  <button onClick={closeEditor} className='h-9 w-9 rounded-md flex items-center justify-center hover:bg-[var(--pos-badge-stock-bg)] focus:outline-none focus-visible:ring-2'>
                    <span aria-hidden>✕</span>
                  </button>
                </div>
              </div>
              <div className='p-4 flex-1 overflow-auto space-y-3'>
                <div>
                  <label className='block text-xs mb-1 text-[var(--pos-text-muted)]'>Nombre</label>
                  <input value={draft?.name ?? ''} onChange={e=> setDraft(d => d ? { ...d, name: e.target.value } : d)} className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs mb-1 text-[var(--pos-text-muted)]'>SKU</label>
                    <input value={draft?.sku ?? ''} onChange={e=> setDraft(d => d ? { ...d, sku: e.target.value } : d)} className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                  <div>
                    <label className='block text-xs mb-1 text-[var(--pos-text-muted)]'>Categoría</label>
                    <select value={draft?.category ?? 'bebidas'} onChange={e=> setDraft(d => d ? { ...d, category: e.target.value as Product['category'] } : d)} className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>
                      <option value='bebidas'>Bebidas</option>
                      <option value='alimentos'>Alimentos</option>
                      <option value='postres'>Postres</option>
                    </select>
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <label className='block text-xs mb-1 text-[var(--pos-text-muted)]'>Precio</label>
                    <input type='number' step='0.01' value={draft?.price ?? 0} onChange={e=> setDraft(d => d ? { ...d, price: parseFloat(e.target.value || '0') } : d)} className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                  <div>
                    <label className='block text-xs mb-1 text-[var(--pos-text-muted)]'>Stock</label>
                    <input type='number' value={draft?.stock ?? 0} onChange={e=> setDraft(d => d ? { ...d, stock: parseInt(e.target.value || '0', 10) } : d)} className='w-full h-9 rounded-md px-2 text-sm' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                </div>
                <label className='inline-flex items-center gap-2 text-sm'>
                  <input type='checkbox' checked={!!draft?.active} onChange={e=> setDraft(d => d ? { ...d, active: e.target.checked } : d)} className='accent-[var(--pos-accent-green)]' />
                  <span style={{ color: 'var(--pos-text-heading)' }}>Activo</span>
                </label>
              </div>
              <div className='p-4 border-t flex items-center justify-end gap-2' style={{ borderColor: 'var(--pos-card-border)' }}>
                <button onClick={closeEditor} className='h-9 px-3 rounded-md text-sm' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Cancelar</button>
                <button onClick={saveDraft} className='h-9 px-3 rounded-md text-sm font-semibold' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Guardar</button>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
