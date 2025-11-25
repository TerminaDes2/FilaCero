"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Business {
  id_negocio: string;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
}

interface BusinessState {
  activeBusiness: Business | null;
  setActiveBusiness: (business: Business | null) => void;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set) => ({
      activeBusiness: null,
      setActiveBusiness: (business) => {
        try {
          if (typeof window !== 'undefined') {
            if (business?.id_negocio) {
              window.localStorage.setItem('active_business_id', String(business.id_negocio));
            } else {
              window.localStorage.removeItem('active_business_id');
            }
          }
        } catch {}
        set({ activeBusiness: business });
      },
      clearBusiness: () => {
        try { if (typeof window !== 'undefined') window.localStorage.removeItem('active_business_id'); } catch {}
        set({ activeBusiness: null });
      },
    }),
    {
      name: 'active-business-storage',
    }
  )
);

// helpers para llamadas externas que esperan funciones
export const setActiveBusiness = (b: Business | null) => {
  const s: any = useBusinessStore;
  if (s && typeof s.getState === "function" && typeof s.getState().setActiveBusiness === "function") {
    return s.getState().setActiveBusiness(b);
  }
  // fallback: intentar llamar hook directamente (menos seguro)
  try {
    useBusinessStore.getState().setActiveBusiness(b);
  } catch (e) {
    console.warn("setActiveBusiness: no disponible", e);
  }
};

export const getActiveBusiness = () => {
  try {
    return useBusinessStore.getState().activeBusiness;
  } catch {
    return null;
  }
};
