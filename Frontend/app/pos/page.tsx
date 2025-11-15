"use client";
import React, { useEffect, useMemo, useState, useCallback } from 'react'; // <-- Añadido useCallback
import { PosSidebar } from '../../src/components/pos/sidebar';
import { CartProvider } from '../../src/pos/cartContext';
import { ViewToggle } from '../../src/components/pos/controls/ViewToggle';
import { SearchBox } from '../../src/components/pos/controls/SearchBox';
import { ProductGrid } from '../../src/components/pos/products/ProductGrid';
import Link from 'next/link';
import CategoryFilterButton from '../../src/components/pos/controls/CategoryFilterButton';
import { usePOSView } from '../../src/state/posViewStore';
import { KitchenBoard } from '../../src/components/pos/kitchen/KitchenBoard';
import { useKitchenBoard } from '../../src/state/kitchenBoardStore';
import { CartPanel } from '../../src/components/pos/cart/CartPanel';
import { TopRightInfo } from '../../src/components/pos/header/TopRightInfo';
import type { POSProduct } from '../../src/pos/cartContext';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useCategoriesStore } from '../../src/pos/categoriesStore';
import { useUserStore } from '../../src/state/userStore';
import { useBusinessStore } from '../../src/state/businessStore';
import { api, activeBusiness } from '../../src/lib/api'; // <-- Importar 'api' y 'activeBusiness'
import { BusinessPickerDialog } from '../../src/components/business/BusinessPickerDialog';

// --- MOCK_PRODUCTS ELIMINADOS ---
// const MOCK_PRODUCTS: POSProduct[] = [ ... ];

// --- NUEVO HOOK PARA OBTENER PRODUCTOS ---
function useProducts() {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar/refrescar los productos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    const businessId = activeBusiness.get(); // Obtiene el negocio activo

    if (!businessId) {
      setError("No hay un negocio activo seleccionado.");
      setLoading(false);
      setProducts([]); // Asegura que no haya productos si no hay negocio
      return;
    }

    try {
      // Llamamos a la API real
      const prods = await api.getProducts({ id_negocio: businessId });
      
      // Mapeamos la respuesta de la API al tipo POSProduct
      const mappedProducts = prods.map((p: any): POSProduct => ({
        id: p.id_producto, // <-- Tu cartContext usa 'id'
        name: p.nombre,
        category: p.category || 'Otros',
        description: p.descripcion,
        price: p.precio,
        stock: p.stock ?? 0,
        image: p.imagen_url || p.media?.[0]?.url, // <-- El campo 'image' que usa tu cartContext
        imagen_url: p.imagen_url,
        media: p.media,
      }));
      setProducts(mappedProducts);
    } catch (err: any) {
      setError(err.message || "Error al cargar productos.");
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- ¡ESTA ES LA SOLUCIÓN DE STOCK EN TIEMPO REAL! ---
  // Escucha el evento 'sale-completed'
  useEffect(() => {
    const handleSaleCompleted = () => {
      console.log('Venta completada detectada. Refrescando stock...');
      fetchProducts(); // Vuelve a cargar los productos
    };

    window.addEventListener('sale-completed', handleSaleCompleted);

    return () => {
      window.removeEventListener('sale-completed', handleSaleCompleted);
    };
  }, [fetchProducts]);
  // --- FIN DE LA SOLUCIÓN ---

  return { products, loading, error, refetch: fetchProducts };
}
// --- FIN DEL NUEVO HOOK ---


export default function POSPage() {
  const settings = useSettingsStore();
  const [view, setView] = useState<'grid'|'list'>(settings.defaultView);
  const [search, setSearch] = useState('');
  const { categories: storeCategories, selected, setSelected } = useCategoriesStore();
  const fetchCategories = () => useCategoriesStore.getState().fetchCategories();
  const categories = useMemo(() => storeCategories.map(c => c.name), [storeCategories]);
  const { view: posView } = usePOSView();
  const { hydrateFromAPI } = useKitchenBoard();
  const { user } = useUserStore();
  const { activeBusiness: activeBusinessFromStore, setActiveBusiness } = useBusinessStore(); // Renombrado para evitar colisión
  const [needBusiness, setNeedBusiness] = useState(false);
  const [bizList, setBizList] = useState<any[]>([]);
  
  // --- OBTENER PRODUCTOS REALES ---
  const { products, loading: productsLoading, error: productsError } = useProducts();

  // Fetch categories (tu lógica original, sin cambios)
  useEffect(() => {
    if (storeCategories.length === 0) {
      fetchCategories().catch(() => {});
    }
  }, [storeCategories.length]);
  
  // Re-fetch when returning to POS sell view
  useEffect(() => {
    if (posView === 'sell' && storeCategories.length === 0) {
      fetchCategories().catch(() => {});
    }
  }, [posView, storeCategories.length]);
  
  // Hydrate when switching into kitchen view
  useEffect(() => {
    if (posView === 'kitchen') {
      void hydrateFromAPI();
    }
  }, [posView, hydrateFromAPI, activeBusinessFromStore]); // Usar el del store

  // Guard: if admin and no active business...
  useEffect(() => {
    const roleName = (user as any)?.role_name || user?.role?.nombre_rol || '';
    const idRol = user?.id_rol;
    const isAdmin = roleName === 'admin' || roleName === 'superadmin' || idRol === 2;
    if (isAdmin && !activeBusinessFromStore) { // Usar el del store
      api.listMyBusinesses()
        .then((list) => {
          setBizList(list || []);
          setNeedBusiness(true);
        })
        .catch(() => setNeedBusiness(true));
    }
  }, [user, activeBusinessFromStore]); // Usar el del store
  
  // Keyboard: 'v' toggles view
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      // ... (sin cambios)
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return !!(el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setView(v => v === 'grid' ? 'list' : 'grid');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <CartProvider>
      <div className='h-screen flex pos-pattern overflow-hidden'>
        {/* Sidebar */}
        <aside className='hidden md:flex flex-col h-screen sticky top-0'>
          <PosSidebar />
        </aside>
        
        {/* Main content */}
        <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
          {/* Header row */}
          <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
            <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </h1>
            <TopRightInfo showLogout />
          </div>
          
          {/* Dynamic content wrapper */}
          {posView === 'kitchen' ? (
            <div className='flex-1 flex flex-col gap-5 overflow-hidden min-h-0 px-5'>
              <KitchenBoard />
            </div>
          ) : (
            <div className='flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0'>
              {/* Products section */}
              <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
                <section className='flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-6 pb-4 -mt-1' style={{background:'var(--pos-bg-sand)', boxShadow:'0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)'}}>
                  <header className='space-y-3 mb-3 flex-none'>
                    <div className='flex flex-col md:flex-row md:items-center gap-3'>
                      <SearchBox value={search} onChange={setSearch} />
                      <div className='flex items-center gap-2'>
                        <CategoryFilterButton
                          categories={categories}
                          value={selected}
                          onChange={setSelected}
                        />
                        <ViewToggle value={view} onChange={setView} />
                      </div>
                    </div>
                  </header>
                  <div className='flex-1 min-h-0 overflow-y-auto py-4 pr-1 custom-scroll-area'>
                    
                    {/* --- PASAR PRODUCTOS REALES AL GRID --- */}
                    <ProductGrid 
                      products={products} // <-- Pasa los productos de la API
                      loading={productsLoading}
                      error={productsError}
                      category={selected} 
                      search={search} 
                      view={view} 
                    />
                    {/* --- FIN DE LA MODIFICACIÓN --- */}

                  </div>
                </section>
              </div>
              
              {/* Cart section */}
              <section className='w-full lg:w-72 xl:w-80 lg:pl-4 pt-4 lg:pt-0 flex flex-col flex-shrink-0 min-h-0'>
                <div className='flex-1 rounded-t-2xl px-4 pt-4 pb-2 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0' style={{background:'var(--pos-summary-bg)', boxShadow:'0 2px 4px rgba(0,0,0,0.06)'}}>
                  <CartPanel />
                </div>
              </section>
            </div>
          )}
        </main>
        
        {needBusiness && (
          <BusinessPickerDialog
            open={needBusiness}
            businesses={bizList}
            onChoose={(b)=>{
              setActiveBusiness(b);
              setNeedBusiness(false);
            }}
            onClose={()=>{
              setNeedBusiness(false);
              window.location.href = '/';
            }}
          />
        )}
      </div>
    </CartProvider>
  );
}