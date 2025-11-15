"use client";
import React, { useMemo } from 'react'; // <-- Imports simplificados
import { POSProduct } from '../../../pos/cartContext';
import { ProductCard } from './ProductCard';
// import { api } from '../../../lib/api'; // <-- Eliminado, la página principal lo maneja

// interface ApiProduct { ... } // <-- Eliminada, la página principal maneja el mapeo

// --- PROPS ACTUALIZADAS ---
interface ProductGridProps {
  category: string;
  search: string;
  view: 'grid' | 'list';
  
  // Props que vienen de la página principal (pos/page.tsx)
  products: POSProduct[];
  loading: boolean;
  error: string | null;
}
// --- FIN DE LA ACTUALIZACIÓN ---

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  category, 
  search, 
  view,
  // Recibimos las nuevas props
  products: allProducts, // Renombramos 'products' a 'allProducts' para que el filtro useMemo siga funcionando
  loading,
  error 
}) => {
  
  // --- LÓGICA INTERNA DE FETCHING ELIMINADA ---
  // const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [showEmptyDelay, setShowEmptyDelay] = useState(false);
  // const [error, setError] = useState<string | null>(null);
  // El useEffect(fetchAndAdaptProducts) también se eliminó.
  // --- FIN DE LA ELIMINACIÓN ---

  // El filtrado por categoría y búsqueda ahora usa las props
  const filtered = useMemo(() => {
    let categoryFiltered: POSProduct[];
    
    // 1. Filtrar por categoría
    if (!category || category === 'all') {
      categoryFiltered = allProducts;
    } else {
      const normalized = category.trim().toLowerCase();
      if (normalized === 'uncategorized') {
        categoryFiltered = allProducts.filter(p => !p.category || p.category.toLowerCase() === 'sin categoría');
      } else {
        // Tu 'POSProduct' usa 'category' como string
        categoryFiltered = allProducts.filter(p => p.category && p.category.trim().toLowerCase() === normalized);
      }
    }
    
    // 2. Filtrar por búsqueda
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return categoryFiltered; // No hay búsqueda, devolver filtrado por categoría
    }
    
    return categoryFiltered.filter(p => 
      p.name.toLowerCase().includes(normalizedSearch)
      // (Si quieres buscar por SKU, el 'POSProduct' necesita el campo 'codigo_barras')
      // || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(normalizedSearch))
    );

  }, [allProducts, category, search]); // Depende de las props

  // Los estados de Carga, Error y Vacío ahora usan las props
  if (loading) {
    return <div className='text-center py-10 text-[var(--pos-text-muted)] text-sm'>Cargando productos…</div>;
  }
  if (error) return <div className='text-center py-24 text-red-500'>{error}</div>;
  if (filtered.length === 0) {
    return (
      <div className='text-center py-16 px-4'>
        <svg viewBox='0 0 24 24' className='w-12 h-12 mx-auto text-slate-300' fill='none' stroke='currentColor' strokeWidth='1.4'>
          <circle cx='12' cy='12' r='7' />
          <path d='M8 12h8' />
        </svg>
        <p className='text-sm font-medium text-slate-600 mt-3'>No hay resultados</p>
        <p className='text-[12px] text-slate-500 mt-1'>Ajusta filtros o agrega nuevos elementos.</p>
      </div>
    );
  }

  // El renderizado de la cuadrícula (sin cambios)
  return (
    <div className={view === 'grid' ? 'grid gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
      {filtered.map(p => (
        // Asumimos que POSProduct tiene 'id' como string
        <ProductCard key={p.id} product={p} view={view} /> 
      ))}
    </div>
  );
};