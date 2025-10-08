"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useCategoriesStore, CategoryItem, CategoryColor } from '../../../pos/categoriesStore';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
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
      {/* Header & quick add */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <h2 className="text-base font-semibold text-[var(--pos-text-heading)]">Categorías</h2>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <SearchBox value={query} onChange={setQuery} />
          </div>
          <button
            onClick={onNewCategory}
            className="h-9 px-3 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--pos-accent-green)', textShadow: '0 1px 0 rgba(0,0,0,0.25)' }}
          >
            Nueva categoría
          </button>
        </div>
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
            <div key={c.id} className={`group rounded-xl p-3 ring-1 ${t.ring} ${t.bg} transition shadow-sm flex items-center justify-between`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`inline-flex w-2 h-2 rounded-full ${t.dot}`} />
                <div className="truncate">
                  <div className={`text-sm font-medium truncate ${t.fg}`}>{c.icon ? `${c.icon} ${c.name}` : c.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <button onClick={()=>moveUp(c.id)} className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center" title="Subir"><ChevronUp className="w-4 h-4"/></button>
                <button onClick={()=>moveDown(c.id)} className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center" title="Bajar"><ChevronDown className="w-4 h-4"/></button>
                <InlineEdit category={c} onSave={(patch)=>update(c.id, patch)} onDelete={()=>remove(c.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// La sub-función InlineEdit no necesita cambios
function InlineEdit({ category, onSave, onDelete }:{ category: CategoryItem, onSave:(patch: Partial<Pick<CategoryItem,'name'|'color'|'icon'>>) => void, onDelete:()=>void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState<CategoryColor>(category.color);
  const [icon, setIcon] = useState(category.icon || '');
  const t = colorTokens[color];

  const commit = () => {
    const patch: Partial<Pick<CategoryItem,'name'|'color'|'icon'>> = {};
    if (name.trim() && name.trim() !== category.name) patch.name = name.trim();
    if (icon.trim() !== (category.icon || '')) patch.icon = icon.trim() || undefined;
    if (color !== category.color) patch.color = color;
    if (Object.keys(patch).length) onSave(patch);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <button onClick={()=>setEditing(true)} className="h-8 px-2 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center gap-1" title="Editar"><Pencil className="w-4 h-4"/>Editar</button>
        <button onClick={onDelete} className="h-8 w-8 rounded-lg bg-white/70 ring-1 ring-black/5 inline-flex items-center justify-center text-red-600" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <input value={name} onChange={e=>setName(e.target.value)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm" />
      <select value={color} onChange={e=>setColor(e.target.value as CategoryColor)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm">
        {Object.keys(colorTokens).map(c => <option key={c} value={c}>{colorTokens[c as CategoryColor].label}</option>)}
      </select>
      <input value={icon} onChange={e=>setIcon(e.target.value)} className="h-8 px-2 rounded-lg bg-white/80 ring-1 ring-black/5 text-sm w-20" placeholder="Emoji" />
      <button onClick={commit} className={`h-8 px-3 rounded-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75`}>Guardar</button>
      <button onClick={()=>setEditing(false)} className="h-8 px-2 rounded-lg bg-white/70 ring-1 ring-black/5">Cancelar</button>
    </div>
  );
}

export default CategoriesAdminPanel;