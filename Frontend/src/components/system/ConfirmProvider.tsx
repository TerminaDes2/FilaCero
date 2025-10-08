"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Visual tone for the confirm button */
  tone?: 'accent' | 'danger' | 'neutral';
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback((options: ConfirmOptions) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const onCancel = useCallback(() => {
    close();
    resolver.current?.(false);
  }, [close]);

  const onConfirm = useCallback(() => {
    close();
    resolver.current?.(true);
  }, [close]);

  const value = useMemo(() => ({ confirm }), [confirm]);

  // Basic styles leveraging existing CSS variables for POS
  const accentBg = 'var(--pos-accent-green)';
  const accentBgHover = 'var(--pos-accent-green-hover)';

  const confirmBg = opts.tone === 'danger' ? '#dc2626' : opts.tone === 'neutral' ? 'rgba(0,0,0,0.75)' : accentBg;
  const confirmBgHover = opts.tone === 'danger' ? '#b91c1c' : opts.tone === 'neutral' ? 'rgba(0,0,0,0.85)' : accentBgHover;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && (
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-[100]" style={{ display: open ? 'block' : 'none' }}>
          <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl shadow-lg ring-1" style={{ background: 'var(--pos-card-bg)', borderColor: 'var(--pos-card-border)' }}>
              <div className="p-5">
                {opts.title && <h2 className="text-base font-semibold text-gray-900">{opts.title}</h2>}
                {opts.description && <p className="mt-1.5 text-sm text-gray-600">{opts.description}</p>}
              </div>
              <div className="px-5 pb-5 flex items-center justify-end gap-2">
                <button onClick={onCancel} className="h-10 px-4 rounded-lg text-sm font-semibold bg-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.1)] focus:outline-none focus-visible:ring-2" style={{ color: 'var(--pos-text)' }}>
                  {opts.cancelText ?? 'Cancelar'}
                </button>
                <button onClick={onConfirm} className="h-10 px-4 rounded-lg text-sm font-semibold text-white focus:outline-none focus-visible:ring-2" style={{ background: confirmBg }} onMouseDown={(e)=>{
                  // allow hover visual on mousedown in some browsers
                }} onMouseEnter={(e)=>{
                  (e.currentTarget as HTMLButtonElement).style.background = confirmBgHover;
                }} onMouseLeave={(e)=>{
                  (e.currentTarget as HTMLButtonElement).style.background = confirmBg;
                }}>
                  {opts.confirmText ?? 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
