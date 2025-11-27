"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PosSidebar } from '../../src/components/pos/sidebar';
import { CartProvider } from '../../src/pos/cartContext';
// Category tabs removed in favor of a compact filter button
import { ViewToggle } from '../../src/components/pos/controls/ViewToggle';
import { SearchBox } from '../../src/components/pos/controls/SearchBox';
import { ProductGrid } from '../../src/components/pos/products/ProductGrid';
import Link from 'next/link';
import CategoryFilterButton from '../../src/components/pos/controls/CategoryFilterButton';
import { KitchenBoard } from '../../src/components/pos/kitchen/KitchenBoard';
import { useKitchenBoard } from '../../src/state/kitchenBoardStore';
import { usePOSView } from '../../src/state/posViewStore';
// Categories CRUD lives on its own page
import { CartPanel } from '../../src/components/pos/cart/CartPanel';
import { TopRightInfo } from '../../src/components/pos/header/TopRightInfo';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useCategoriesStore } from '../../src/pos/categoriesStore';
import { useUserStore } from '../../src/state/userStore';
import { useBusinessStore } from '../../src/state/businessStore';
import { api } from '../../src/lib/api';
import { BusinessPickerDialog, type Business } from '../../src/components/business/BusinessPickerDialog';
// Categories store not needed here

export default function POSPage() {
  const settings = useSettingsStore();
  const [view, setView] = useState<'grid' | 'list'>(settings.defaultView);
  const [search, setSearch] = useState('');
  const { categories: storeCategories, selected, setSelected } = useCategoriesStore();
  const fetchCategories = () => useCategoriesStore.getState().fetchCategories();
  const categories = useMemo(() => storeCategories.map(c => c.name), [storeCategories]);
  const posView = usePOSView((state) => state.view);
  const setPosView = usePOSView((state) => state.setView);
  const hydrateFromAPI = useKitchenBoard((state) => state.hydrateFromAPI);
  const { user, isAuthenticated, loading } = useUserStore();
  const { activeBusiness, setActiveBusiness } = useBusinessStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get('view');
  const [needBusiness, setNeedBusiness] = useState(false);
  const [bizList, setBizList] = useState<Business[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?redirect=/pos');
    }
  }, [isAuthenticated, loading, router]);

  // Fetch categories (store handles normalization & business scoping)
  useEffect(() => {
    if (storeCategories.length === 0) {
      fetchCategories().catch(() => { });
    }
  }, [storeCategories.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (viewParam === 'kitchen') {
      setPosView('kitchen');
      router.replace('/pos', { scroll: false });
    }
  }, [viewParam, setPosView, router]);

  useEffect(() => {
    if (posView === 'kitchen') {
      void hydrateFromAPI();
    }
  }, [posView, hydrateFromAPI, activeBusiness]);

  // Guard: si es admin y no hay negocio activo, solicitar selección antes de continuar
  useEffect(() => {
    const roleName = (user as any)?.role_name || user?.role?.nombre_rol || '';
    const idRol = user?.id_rol;
    const isAdmin = roleName === 'admin' || roleName === 'superadmin' || idRol === 2;

    if (isAdmin && !activeBusiness) {
      api
        .listMyBusinesses()
        .then((list) => {
          setBizList((list || []) as Business[]);
          setNeedBusiness(true);
        })
        .catch(() => setNeedBusiness(true));
    } else {
      setNeedBusiness(false);
    }
  }, [user, activeBusiness]);

  // Keyboard: 'v' toggles view (grid/list) when not typing in input
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
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
        {/* Sidebar (collapsible) */}
        <aside className='hidden md:flex flex-col h-screen sticky top-0'>
          <PosSidebar />
        </aside>
        {/* Main content */}
        <main
          className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'
        >
          {/* Header row: Title (left) + TopRightInfo (right) */}
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
                {/* Category filter moved into header controls */}
                <section className='flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-6 pb-4 -mt-1' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)' }}>
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
                    <ProductGrid category={selected} search={search} view={view} />
                  </div>
                </section>
              </div>
              <section className='w-full lg:w-72 xl:w-80 lg:pl-4 pt-4 lg:pt-0 flex flex-col flex-shrink-0 min-h-0'>
                <div className='flex-1 rounded-t-2xl px-4 pt-4 pb-2 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0' style={{ background: 'var(--pos-summary-bg)', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
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
            onChoose={(b: Business) => {
              setActiveBusiness(b);
              setNeedBusiness(false);
            }}
            onCreateNew={() => {
              setNeedBusiness(false);
              router.push('/onboarding/negocio');
            }}
            onClose={() => {
              setNeedBusiness(false);
              if (!activeBusiness) {
                router.push('/');
              }
            }}
          />
        )}
      </div>
    </CartProvider>
  );
}
