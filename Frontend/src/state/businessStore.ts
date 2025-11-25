import { create } from "zustand";
import { api } from "../lib/api";
import * as BusinessClientModule from "./businessStoreClient";

// Tipo real del negocio según tu API
export interface Business {
  id_negocio: number | null;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  logo_url: string | null;
  hero_image_url: string | null;
}

interface BusinessState {
  business: Business | null;
  setBusiness: (data: Partial<Business>) => void;
  loadBusinessForCurrentUser: () => Promise<void>;
  saveBusiness: () => Promise<void>;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  business: null,

  setBusiness: (data: Partial<Business>) =>
    set((state) => ({
      business: { ...(state.business ?? ({} as Business)), ...data } as Business,
    })),

  loadBusinessForCurrentUser: async () => {
    try {
      const list = await api.listMyBusinesses?.();
      if (list && list.length > 0) {
        const b = list[0];
        set({
          business: {
            id_negocio: b.id_negocio ?? null,
            nombre: b.nombre ?? "",
            direccion: b.direccion ?? "",
            telefono: b.telefono ?? "",
            correo: b.correo ?? b.email ?? "",
            logo_url: b.logo_url ?? b.logo ?? null,
            hero_image_url: b.hero_image_url ?? b.hero_image ?? null,
          },
        });
        console.debug("Negocio cargado:", b);
        return;
      }

      if (typeof window !== "undefined") {
        const id = window.localStorage.getItem("active_business_id");
        if (id) {
          const b = await api.getBusinessById?.(id);
          if (b) {
            set({
              business: {
                id_negocio: b.id_negocio ?? null,
                nombre: b.nombre ?? "",
                direccion: b.direccion ?? "",
                telefono: b.telefono ?? "",
                correo: b.correo ?? b.email ?? "",
                logo_url: b.logo_url ?? b.logo ?? null,
                hero_image_url: b.hero_image_url ?? b.hero_image ?? null,
              },
            });
            console.debug("Negocio cargado por fallback id:", id);
            return;
          }
        }
      }

      console.debug("El usuario no tiene negocios registrados o no se pudo obtenerlos.");
    } catch (err) {
      console.error("Error cargando negocio:", err);
      throw err;
    }
  },

  saveBusiness: async () => {
    const b = get().business;
    if (!b || b.id_negocio == null) {
      console.warn("⚠ No hay negocio activo para guardar.");
      return;
    }
    try {
      // Mapear a los campos que espera tu API
      const payload: any = {
        nombre: b.nombre ?? null,
        direccion: b.direccion ?? null,
        telefono: b.telefono ?? null,
        correo: b.correo ?? null,
        logo: b.logo_url ?? null,
        hero_image_url: b.hero_image_url ?? null,
      };

      // Limpiar null/undefined/empty para evitar validaciones 400
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined && v !== "")
      );

      // Usar el wrapper api (usa apiFetch interno y respeta NEXT_PUBLIC_API_BASE)
      const updated = await api.updateBusiness?.(String(b.id_negocio), cleanPayload);

      // Si la API devuelve el objeto actualizado, usarlo; si no, recargar con getBusinessById
      if (updated && typeof updated === "object") {
        const json = updated;
        const newBiz = {
          id_negocio: json.id_negocio ?? b.id_negocio,
          nombre: json.nombre ?? json.name ?? b.nombre,
          direccion: json.direccion ?? b.direccion,
          telefono: json.telefono ?? b.telefono,
          correo: json.correo ?? json.email ?? b.correo,
          logo_url: json.logo_url ?? json.logo ?? b.logo_url ?? null,
          hero_image_url: json.hero_image_url ?? json.hero_image ?? b.hero_image_url ?? null,
        };
        set({ business: newBiz });
      } else {
        // fallback: intentar recargar desde la API si wrapper no devuelve el recurso
        try {
          const fresh = await api.getBusinessById?.(String(b.id_negocio));
          if (fresh) {
            set({
              business: {
                id_negocio: fresh.id_negocio ?? b.id_negocio,
                nombre: fresh.nombre ?? "",
                direccion: fresh.direccion ?? "",
                telefono: fresh.telefono ?? "",
                correo: fresh.correo ?? fresh.email ?? "",
                logo_url: fresh.logo_url ?? fresh.logo ?? null,
                hero_image_url: fresh.hero_image_url ?? fresh.hero_image ?? null,
              },
            });
          }
        } catch (e) {
          console.warn("No se pudo recargar negocio tras guardar:", e);
        }
      }

      console.log("✅ Negocio guardado:", b.id_negocio);
    } catch (err: any) {
      // Mejor detalle de error para depuración en cliente
      console.error("❌ Error guardando negocio:", err);
      // intentar extraer mensaje de error del wrapper / fetch
      const msg = (err && err.message) ? err.message : String(err);
      throw new Error(msg);
    }
  },
}));

// Exports explícitos y fiables para evitar "is not a function"
export function setActiveBusiness(b: any) {
  const client = (BusinessClientModule as any);
  if (client && typeof client.setActiveBusiness === "function") {
    return client.setActiveBusiness(b);
  }
  try {
    if (typeof window !== "undefined") {
      if (b?.id_negocio) window.localStorage.setItem("active_business_id", String(b.id_negocio));
      else window.localStorage.removeItem("active_business_id");
    }
  } catch (e) {
    console.debug("setActiveBusiness fallback failed", e);
  }
}

export function getActiveBusiness() {
  const client = (BusinessClientModule as any);
  if (client && typeof client.getActiveBusiness === "function") {
    return client.getActiveBusiness();
  }
  try {
    if (typeof window === "undefined") return null;
    const id = window.localStorage.getItem("active_business_id");
    return id ? { id_negocio: Number(id) } : null;
  } catch (e) {
    console.debug("getActiveBusiness fallback failed", e);
    return null;
  }
}
