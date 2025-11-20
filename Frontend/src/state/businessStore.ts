"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BusinessData {
  name: string;
  slogan: string;
  rfc: string;
  razonSocial: string;
  direccionFiscal: string;
  telefono: string;
  email: string;
  website: string;
  horario1: string;
  horario2: string;
  horario3: string;
  logo: string | null;
}

interface BusinessState {
  business: BusinessData;
  setBusiness: (partial: Partial<BusinessData>) => void;
  reset: () => void;
}

const defaultBusiness: BusinessData = {
  name: "",
  slogan: "",
  rfc: "",
  razonSocial: "",
  direccionFiscal: "",
  telefono: "",
  email: "",
  website: "",
  horario1: "",
  horario2: "",
  horario3: "",
  logo: null,
};

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      business: defaultBusiness,

      setBusiness: (partial) =>
        set({
          business: { ...get().business, ...partial },
        }),

      reset: () => set({ business: defaultBusiness }),
    }),
    { name: "posBusiness" }
  )
);
