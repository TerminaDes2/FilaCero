"use client";
import { create } from 'zustand';

export type POSView = 'sell' | 'kitchen';

interface POSViewState {
  view: POSView;
  setView: (v: POSView) => void;
}

export const usePOSView = create<POSViewState>((set) => ({
  view: 'sell',
  setView: (v) => set({ view: v }),
}));
