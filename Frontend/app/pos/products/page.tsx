"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selection, setSelection] = useState<string[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Product | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const categories = useMemo(() => Array.from(new Set(MOCK.map(p => p.category))), []);
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    let list = MOCK.filter(p =>
      (category === 'all' || p.category === category) &&
      (statusFilter === 'all' || (statusFilter === 'active' ? p.active : !p.active)) &&
      (p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s))
    );
    list = list.sort((a, b) => {
      let av: number | string = a[sortBy as keyof Product] as any;
      let bv: number | string = b[sortBy as keyof Product] as any;
      if (sortBy === 'name') {
        av = (av as string).toLowerCase();
        bv = (bv as string).toLowerCase();
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [search, category, statusFilter, sortBy, sortDir]);

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
  const startClone = (p: Product) => {
    setDraft({ id: 'new', name: `${p.name} (copia)`, sku: '', price: p.price, stock: p.stock, category: p.category, active: p.active });
    setEditorOpen(true);
  };
  const closeEditor = () => setEditorOpen(false);
  const saveDraft = () => {
    // Frontend-only mock: just close for now
    setEditorOpen(false);
  };

  // UX: when the editor opens, focus the name input and enable hotkeys
  useEffect(() => {
    if (!editorOpen) return;
    // focus name input shortly after open to ensure element is in DOM
    const t = setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeEditor();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveDraft();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [editorOpen]);

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      {/* Sidebar */}
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>

      {/* Main */}
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row: App brand left + TopRightInfo right */}
  <div className='px-5 relative z-10 mb-0.5 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </h1>
          <TopRightInfo employeeName='Juan Pérez' role='Cajero' businessName='Punto de Venta' />
        </div>

        {/* Category tabs outside the panel, like home */}
  <div className='px-5 relative z-10'>
          <CategoryTabs categories={categories} value={category} onChange={setCategory} />
        </div>

        {/* Panel area: all controls INSIDE the panel */}
  <section className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 -mt-4 flex flex-col' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
          {/* Panel header: search + view + actions (import/new) */}
          <header className='space-y-3 mb-3 flex-none'>
            <div className='flex flex-col md:flex-row md:items-center gap-3'>
              <div className='flex-1 min-w-0'>
                <SearchBox value={search} onChange={(v)=> { setHasInteracted(true); setSearch(v); }} />
              </div>
              <div className='flex items-center flex-wrap gap-2'>
                <ViewToggle value={view} onChange={setView} />
                {/* Filtro de estado */}
                <div className='hidden sm:flex items-center rounded-lg overflow-hidden border border-[var(--pos-card-border)]'>
                  {(['all','active','inactive'] as const).map(v => (
                    <button key={v} onClick={() => setStatusFilter(v)} className={`appearance-none h-9 px-3 text-xs font-semibold ${statusFilter===v ? 'text-white' : ''}`} style={statusFilter===v ? { background: 'var(--pos-accent-green)' } : { background: 'var(--pos-card-bg)', color: 'var(--pos-text-heading)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                      {v==='all' ? 'Todos' : v==='active' ? 'Activos' : 'Inactivos'}
                    </button>
                  ))}
                </div>
                {/* Ordenar */}
                <div className='hidden sm:flex items-center gap-1 ml-1'>
                  <label className='text-xs text-[var(--pos-text-muted)]'>Ordenar</label>
                  <div className='relative'>
                    <select value={sortBy} onChange={e=> setSortBy(e.target.value as any)} className='appearance-none h-9 pl-2 pr-8 rounded-md text-xs' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                      <option value='name'>Nombre</option>
                      <option value='price'>Precio</option>
                      <option value='stock'>Stock</option>
                    </select>
                    <svg aria-hidden viewBox='0 0 24 24' className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' style={{ color: 'var(--pos-text-muted)' }}>
                      <path d='M6 9l6 6 6-6' />
                    </svg>
                  </div>
                  <button aria-label='Cambiar dirección' onClick={()=> setSortDir(d=> d==='asc'?'desc':'asc')} className='appearance-none h-9 w-9 rounded-md flex items-center justify-center' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                    {sortDir==='asc' ? '↑' : '↓'}
                  </button>
                </div>
                <div className='ml-0 md:ml-2 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start'>
                  <button onClick={startNew} className='h-9 px-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Nuevo producto</button>
                </div>
              </div>
            </div>
            {/* Info de resultados y limpiar filtros */}
            <div className='flex items-center justify-between text-xs'>
              <div aria-live='polite' className='text-[var(--pos-text-muted)]'>Resultados: <span className='font-semibold' style={{ color: 'var(--pos-text-heading)' }}>{filtered.length}</span></div>
              {(search || category !== 'all' || statusFilter !== 'all') && (
                <button onClick={()=> { setSearch(''); setCategory('all'); setStatusFilter('all'); }} className='h-7 px-2 rounded-md border' style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Limpiar filtros</button>
              )}
            </div>
          </header>
          {/* Bulk bar when selecting */}
          {selection.length > 0 && (
            <div className='mb-3 flex-none flex items-center justify-between rounded-lg px-3 py-2' style={{ background: 'var(--pos-summary-bg)', border: '1px solid var(--pos-summary-border)' }}>
              <div className='text-sm' style={{ color: 'var(--pos-text-heading)' }}>{selection.length} seleccionados</div>
              <div className='flex items-center gap-2'>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Activar</button>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>Desactivar</button>
                <button className='h-8 px-3 rounded-md text-xs font-medium' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Aplicar descuento</button>
                <button onClick={()=> setSelection([])} className='h-8 px-3 rounded-md text-xs font-medium border' style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Deseleccionar</button>
              </div>
            </div>
          )}

          {/* Grid view */}
          {view === 'grid' ? (
            <div className='flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scroll-area'>
              {/* Select all inline sticky bar (not a grid card) */}
              <div className='sticky top-0 z-[5] mb-2'>
                <label className='w-full rounded-lg px-3 py-2 flex items-center gap-3 bg-[var(--pos-card-bg)] border border-[var(--pos-card-border)] cursor-pointer shadow-sm'>
                  <input type='checkbox' className='accent-[var(--pos-accent-green)]' checked={allSelected} onChange={toggleAll} />
                  <span className='text-sm font-medium' style={{ color: 'var(--pos-text-heading)' }}>Seleccionar todos ({filtered.length})</span>
                </label>
              </div>

              {filtered.length === 0 ? (
                <div className='h-[60vh] min-h-[340px] flex items-center justify-center'>
                  <div className='text-center max-w-sm'>
                    <div className='text-[11px] font-semibold uppercase tracking-wide mb-1' style={{ color: 'var(--pos-text-muted)' }}>Sin resultados</div>
                    <p className='text-sm mb-3' style={{ color: 'var(--pos-text-heading)' }}>No encontramos productos que coincidan con tu búsqueda o filtros.</p>
                    <div className='flex items-center gap-2 justify-center'>
                      <button onClick={()=> { setSearch(''); setCategory('all'); setStatusFilter('all'); }} className='h-9 px-3 rounded-md text-xs font-semibold' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Limpiar filtros</button>
                      <button onClick={startNew} className='h-9 px-3 rounded-full text-xs font-semibold text-white' style={{ background: 'var(--fc-brand-600)' }}>Crear producto</button>
                    </div>
                  </div>
                </div>
              ) : (
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
                      boxShadow: selected ? 'inset 0 0 0 2px var(--pos-accent-green)' : undefined,
                      opacity: p.active ? 1 : 0.8
                    }}
                  >
                    <div className='flex items-start gap-2'>
                      <input type='checkbox' className='mt-0.5 accent-[var(--pos-accent-green)]' checked={selected} onChange={() => toggle(p.id)} />
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2'>
                          <h3 className='text-sm font-semibold truncate'>{p.name}</h3>
                          <div className='flex items-center gap-1'>
                            {p.stock === 0 && (
                              <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: '#ffe5e5', color: '#7a1f1f' }}>Agotado</span>
                            )}
                            {p.stock > 0 && p.stock < 5 && (
                              <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: '#fff6e5', color: '#7a4a1f' }}>Bajo stock</span>
                            )}
                            {!p.active && (
                              <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: '#e6e6f7', color: '#34346b' }}>Inactivo</span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${p.active ? '' : 'opacity-60'}`} style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{p.category}</span>
                          </div>
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
                      <button onClick={()=> startClone(p)} className='ml-auto h-8 px-2 rounded-md text-xs font-semibold' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Clonar</button>
                    </div>
                  </div>
                );
              })}
              </div>
              )}
            </div>
          ) : (
            // List view (table)
            <div className='flex-1 min-h-0 overflow-auto rounded-lg border border-[var(--pos-card-border)] bg-[var(--pos-card-bg)]'>
              {filtered.length === 0 ? (
                <div className='h-[60vh] min-h-[340px] flex items-center justify-center'>
                  <div className='text-center max-w-sm'>
                    <div className='text-[11px] font-semibold uppercase tracking-wide mb-1' style={{ color: 'var(--pos-text-muted)' }}>Sin resultados</div>
                    <p className='text-sm mb-3' style={{ color: 'var(--pos-text-heading)' }}>No encontramos productos que coincidan con tu búsqueda o filtros.</p>
                    <div className='flex items-center gap-2 justify-center'>
                      <button onClick={()=> { setSearch(''); setCategory('all'); setStatusFilter('all'); }} className='h-9 px-3 rounded-md text-xs font-semibold' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Limpiar filtros</button>
                      <button onClick={startNew} className='h-9 px-3 rounded-full text-xs font-semibold text-white' style={{ background: 'var(--fc-brand-600)' }}>Crear producto</button>
                    </div>
                  </div>
                </div>
              ) : (
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
                        <td className='px-3 py-2 text-right text-[var(--pos-text-muted)]'>
                          {p.stock === 0 ? <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: '#ffe5e5', color: '#7a1f1f' }}>Agotado</span> : p.stock < 5 ? <span className='text-[10px] px-1.5 py-0.5 rounded-full' style={{ background: '#fff6e5', color: '#7a4a1f' }}>Bajo stock</span> : p.stock}
                        </td>
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
              )}
            </div>
          )}
        </section>

        {/* Right-side editor panel */}
        {editorOpen && (
          <>
            <button aria-label='Cerrar editor' onClick={closeEditor} className='fixed inset-0 bg-black/35 backdrop-blur-[1px] cursor-default z-[90]' />
            <aside className='fixed right-0 top-0 h-screen w-[92vw] sm:w-[440px] md:w-[480px] shadow-2xl z-[110] flex flex-col' style={{ background: 'var(--pos-card-bg)', borderLeft: '1px solid var(--pos-card-border)' }}>
              {/* Header estilo panel de pago */}
              <div className='px-5 py-4 border-b flex items-center gap-3' style={{ borderColor: 'var(--pos-card-border)' }}>
                <div className='w-10 h-10 rounded-xl flex items-center justify-center' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>
                  <svg viewBox='0 0 24 24' className='w-5 h-5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
                    <rect x='3' y='7' width='14' height='10' rx='2' />
                    <path d='M7 7V5h14v10h-2' />
                  </svg>
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='text-[11px] font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>{draft?.id === 'new' ? 'Nuevo' : 'Editar'}</div>
                  <h2 className='text-xl font-extrabold truncate' style={{ color: 'var(--pos-text-heading)' }}>{draft?.name || 'Producto'}</h2>
                </div>
                <button onClick={closeEditor} className='w-10 h-10 rounded-full flex items-center justify-center text-white focus:outline-none focus-visible:ring-2 transition-colors' style={{ background: 'var(--fc-brand-600)' }}>✕</button>
              </div>

              {/* Body con secciones "candy" */}
              <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {/* Sección: Información básica */}
                <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Información básica</h3>
                    <span className='px-2 py-0.5 rounded-md text-[11px] font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{draft?.category ?? 'Categoría'}</span>
                  </div>
                  <div>
                    <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Nombre</label>
                    <input ref={nameInputRef} value={draft?.name ?? ''} onChange={e=> setDraft(d => d ? { ...d, name: e.target.value } : d)} className='w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                  </div>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>SKU</label>
                      <div className='flex gap-2'>
                        <input value={draft?.sku ?? ''} onChange={e=> setDraft(d => d ? { ...d, sku: e.target.value } : d)} className='flex-1 h-10 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                        <button type='button' onClick={()=> setDraft(d => d ? { ...d, sku: (d.name || 'PROD').toUpperCase().replace(/\s+/g,'-').slice(0,16) } : d)} className='h-10 px-3 rounded-lg text-xs font-semibold transition-colors' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Generar</button>
                      </div>
                    </div>
                    <div>
                      <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Categoría</label>
                      <div className='relative'>
                        <select value={draft?.category ?? 'bebidas'} onChange={e=> setDraft(d => d ? { ...d, category: e.target.value as Product['category'] } : d)} className='appearance-none w-full h-10 rounded-lg pl-3 pr-8 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)', WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}>
                          <option value='bebidas'>Bebidas</option>
                          <option value='alimentos'>Alimentos</option>
                          <option value='postres'>Postres</option>
                        </select>
                        <svg aria-hidden viewBox='0 0 24 24' className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' style={{ color: 'var(--pos-text-muted)' }}>
                          <path d='M6 9l6 6 6-6' />
                        </svg>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sección: Precio y stock */}
                <section className='rounded-2xl p-4 space-y-3' style={{ background: 'var(--pos-bg-sand)', border: '1px solid var(--pos-border-soft)' }}>
                  <h3 className='text-sm font-extrabold' style={{ color: 'var(--pos-text-heading)' }}>Precio y stock</h3>
                  <div className='grid grid-cols-2 gap-3 items-end'>
                    <div>
                      <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Precio</label>
                      <div className='relative'>
                        <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm px-1.5 py-0.5 rounded-md' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>$</span>
                        <input type='number' step='0.01' value={draft?.price ?? 0} onChange={e=> setDraft(d => d ? { ...d, price: parseFloat(e.target.value || '0') } : d)} className='w-full h-10 rounded-lg pl-8 pr-3 text-sm tabular-nums focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                      </div>
                    </div>
                    <div>
                      <label className='block text-xs mb-1 font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Stock</label>
                      <input type='number' value={draft?.stock ?? 0} onChange={e=> setDraft(d => d ? { ...d, stock: parseInt(e.target.value || '0', 10) } : d)} className='w-full h-10 rounded-lg px-3 text-sm focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }} />
                    </div>
                  </div>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold' style={{ color: 'var(--pos-text-heading)' }}>Estado</span>
                    <button type='button' onClick={()=> setDraft(d => d ? { ...d, active: !d.active } : d)} className={`h-8 px-3 rounded-full text-xs font-semibold transition-colors ${draft?.active ? 'text-white' : ''}`} style={draft?.active ? { background: 'var(--pos-accent-green)' } : { background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>
                      {draft?.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </section>

                {/* Sección: Vista previa rápida */}
                <section className='rounded-2xl p-4' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)' }}>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                      <div className='text-xs font-semibold uppercase tracking-wide' style={{ color: 'var(--pos-text-muted)' }}>Vista previa</div>
                      <h4 className='text-base font-extrabold truncate' style={{ color: 'var(--pos-text-heading)' }}>{draft?.name || 'Producto'}</h4>
                      <div className='mt-1 flex items-center gap-2'>
                        <span className='px-2 py-0.5 rounded-md text-[11px] font-medium' style={{ background: 'var(--pos-badge-stock-bg)', color: '#694b3e' }}>{draft?.category || 'Categoría'}</span>
                        <span className='px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums' style={{ background: '#E6F7EF', color: '#204E42' }}>${(draft?.price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <span className='text-[11px]' style={{ color: 'var(--pos-text-muted)' }}>SKU: {draft?.sku || '—'}</span>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className='p-5 border-t flex items-center justify-between gap-2' style={{ borderColor: 'var(--pos-card-border)' }}>
                <div className='text-[11px] text-[var(--pos-text-muted)] hidden sm:block'>Esc para cerrar • ⌘/Ctrl + Enter para {draft?.id === 'new' ? 'crear' : 'guardar'}</div>
                <div className='ml-auto flex items-center gap-2'>
                  <button onClick={closeEditor} className='h-11 px-4 rounded-lg text-sm font-semibold transition-colors' style={{ background: 'var(--pos-card-bg)', border: '1px solid var(--pos-card-border)', color: 'var(--pos-text-heading)' }}>Cancelar</button>
                  <button onClick={saveDraft} className='h-11 px-5 rounded-full text-sm font-semibold text-white transition-transform active:scale-[0.98]' style={{ background: 'var(--fc-brand-600)' }}>{draft?.id === 'new' ? 'Crear →' : 'Guardar →'}</button>
                </div>
              </div>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
