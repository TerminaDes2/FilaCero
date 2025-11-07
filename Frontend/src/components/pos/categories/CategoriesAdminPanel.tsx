"use client";
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useCategoriesStore, CategoryItem, CategoryColor } from '../../../pos/categoriesStore';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import EditCategoryPanel from './EditCategoryPanel';
import { SearchBox } from '../../pos/controls/SearchBox';

interface CategoriesAdminPanelProps {
  onNewCategory?: () => void;
}

const colorTokens: Record<CategoryColor, { bg: string; fg: string; ring: string; dot: string; label: string }> = {
  brand: { bg: 'bg-brand-600/12', fg: 'text-brand-700', ring: 'ring-brand-500/30', dot: 'bg-brand-500', label: 'Brand' },
  teal: { bg: 'bg-[color:var(--fc-teal-500)]/12', fg: 'text-[color:var(--fc-teal-600)]', ring: 'ring-[color:var(--fc-teal-500)]/30', dot: 'bg-[color:var(--fc-teal-500)]', label: 'Teal' },
  amber: { bg: 'bg-amber-500/12', fg: 'text-amber-700', ring: 'ring-amber-500/30', dot: 'bg-amber-500', label: 'Amber' },
  gray: { bg: 'bg-slate-500/12', fg: 'text-slate-700', ring: 'ring-slate-500/30', dot: 'bg-slate-500', label: 'Gray' },
  rose: { bg: 'bg-rose-500/12', fg: 'text-rose-700', ring: 'ring-rose-500/30', dot: 'bg-rose-500', label: 'Rose' }
};

export const CategoriesAdminPanel: React.FC<CategoriesAdminPanelProps> = ({ onNewCategory }) => {
  // --- 👇 CÓDIGO MODIFICADO ---
  // Obtenemos 'fetchCategories' y ya no necesitamos 'bootstrap'
  const { categories, fetchCategories, update, remove, moveUp, moveDown } = useCategoriesStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryItem | null>(null);

  // Reemplazamos el useEffect para que cargue desde la API
  useEffect(() => {
    setLoading(true);
    fetchCategories().finally(() => {
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // El array vacío asegura que se ejecute solo una vez
  // --- FIN DEL CÓDIGO MODIFICADO ---

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header: search left, action right (sin título interno) */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="relative w-full">
            <SearchBox value={query} onChange={setQuery} />
          </div>
        </div>
        <button
          onClick={onNewCategory}
          className="h-9 px-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2"
          style={{ background: 'var(--pos-accent-green)', color: '#fff' }}
        >
          Nueva categoría
        </button>
      </div>

      {/* Grid of category chips with controls */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 rounded-2xl p-1" style={{ boxShadow:'inset 0 0 0 1px var(--pos-border-soft)' }}>
        {loading && (
          <div className='col-span-full text-center py-8 text-[var(--pos-text-muted)] text-sm'>Cargando categorías…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className='col-span-full text-center py-16 px-4'>
            <svg viewBox='0 0 24 24' className='w-12 h-12 mx-auto text-slate-300' fill='none' stroke='currentColor' strokeWidth='1.4'>
              <circle cx='12' cy='12' r='7' />
              <path d='M8 12h8' />
            </svg>
            <p className='text-sm font-medium text-slate-600 mt-3'>No hay resultados</p>
            <p className='text-[12px] text-slate-500 mt-1'>Ajusta filtros o agrega nuevos elementos.</p>
          </div>
        )}
        {!loading && filtered.map(c => {
          const t = colorTokens[c.color];
          return (
            <div
              key={c.id}
              className={`group relative rounded-2xl border transition shadow-sm hover:shadow-md overflow-visible`} 
              style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}
            >
              <div className={`flex items-center justify-between gap-3 p-3 ring-1 ${t.ring} ${t.bg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex w-2 h-2 rounded-full ${t.dot}`} />
                  <div className="truncate">
                    <div className={`text-sm font-semibold truncate ${t.fg}`}>{c.icon ? `${c.icon} ${c.name}` : c.name}</div>
                    <div className='text-[11px] text-slate-500/80'>Categoría</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={()=>moveUp(c.id)} className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center" title="Subir"><ChevronUp className="w-4 h-4"/></button>
                  <button onClick={()=>moveDown(c.id)} className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center" title="Bajar"><ChevronDown className="w-4 h-4"/></button>
                  <InlineEdit category={c} onSave={(patch)=>update(c.id, patch)} onDelete={()=>remove(c.id)} onOpenEditPanel={()=>setEditing(c)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <EditCategoryPanel
          category={editing}
          onClose={() => setEditing(null)}
          onUpdated={() => setEditing(null)}
        />
      )}
    </div>
  );
};

// La sub-función InlineEdit no necesita cambios
function InlineEdit({ category, onSave, onDelete, onOpenEditPanel }:{ category: CategoryItem, onSave:(patch: Partial<Pick<CategoryItem,'name'|'color'|'icon'>>) => Promise<void>, onDelete:()=>Promise<void>, onOpenEditPanel?: (c: CategoryItem)=>void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState<CategoryColor>(category.color);
  const [icon, setIcon] = useState(category.icon || '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const t = colorTokens[color];

  const commit = async () => {
    const patch: Partial<Pick<CategoryItem,'name'|'color'|'icon'>> = {};
    if (name.trim() && name.trim() !== category.name) patch.name = name.trim();
    if (icon.trim() !== (category.icon || '')) patch.icon = icon.trim() || undefined;
    if (color !== category.color) patch.color = color;
    if (!Object.keys(patch).length) {
      setEditing(false);
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onSave(patch);
      setEditing(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'No se pudo guardar los cambios.';
      setError(message);
    } finally {
      setPending(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onClick = (e: MouseEvent) => {
      const node = rootRef.current;
      if (node && !node.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('click', onClick); };
  }, []);

  if (!editing) {
    return (
      <div ref={rootRef} className="relative" data-menu-root>
        <button
          onClick={(e)=> { e.stopPropagation(); setMenuOpen(v=>!v); }}
          className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center"
          title="Opciones"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          disabled={pending}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <div role="menu" className="absolute right-0 mt-1 w-36 rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-20">
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
              onClick={()=>{
                setError(null);
                setMenuOpen(false);
                if (onOpenEditPanel) {
                  onOpenEditPanel(category);
                  return;
                }
                setEditing(true);
                setName(category.name);
                setColor(category.color);
                setIcon(category.icon || '');
              }}
            >
              <Pencil className="w-4 h-4 text-slate-600" /> Editar
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-rose-50 flex items-center gap-2 text-rose-600"
              onClick={async ()=>{
                setPending(true);
                setError(null);
                try { await onDelete(); } catch (e: unknown) { const message = e instanceof Error ? e.message : 'No se pudo eliminar la categoría.'; setError(message); } finally { setPending(false); setMenuOpen(false); }
              }}
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
        )}
        {error && <span className="ml-2 text-xs text-rose-600" title={error ?? undefined}>{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={name} onChange={e=>setName(e.target.value)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm w-28 sm:w-40" />
      <select value={color} onChange={e=>setColor(e.target.value as CategoryColor)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm w-[96px] sm:w-[120px]">
        {Object.keys(colorTokens).map(c => <option key={c} value={c}>{colorTokens[c as CategoryColor].label}</option>)}
      </select>
      <input value={icon} onChange={e=>setIcon(e.target.value)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm w-16 sm:w-20" placeholder="Emoji" />
      <button onClick={commit} className={`h-8 px-3 rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75`} disabled={pending}>Guardar</button>
      <button
        onClick={() => {
          setEditing(false);
          setError(null);
          setName(category.name);
          setColor(category.color);
          setIcon(category.icon || '');
        }}
        className="h-8 px-2 rounded-lg bg-white/70 ring-1 ring-black/5"
        disabled={pending}
      >
        Cancelar
      </button>
  {error && <span className="text-xs text-rose-600 ml-2 max-w-[160px] truncate" title={error ?? undefined}>{error}</span>}
    </div>
  );
}

export default CategoriesAdminPanel;