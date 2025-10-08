"use client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfirm } from './ConfirmProvider';
import { useUserStore } from '../../state/userStore';
import ShortcutsHelpOverlay from './ShortcutsHelpOverlay';

type ShortcutContextValue = {
  registerSearchInput: (el: HTMLInputElement | null) => void;
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function useShortcuts() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error('useShortcuts must be used within ShortcutProvider');
  return ctx;
}

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (!tag) return false;
  if (el.isContentEditable) return true;
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const confirm = useConfirm();
  const { reset } = useUserStore();
  const [showHelp, setShowHelp] = useState(false);

  const registerSearchInput = useCallback((el: HTMLInputElement | null) => {
    searchInputRef.current = el;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const targetIsEditable = isEditableTarget(e.target);
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + K focuses the search input from anywhere
      if ((ctrlOrMeta && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }

      // '/' focuses search only if not typing in another input
      if (!targetIsEditable && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }

      // Global nav inside POS: s = settings, p = POS home
      if (!targetIsEditable && !ctrlOrMeta && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === '?') {
          // Some layouts report '?' as Shift + '/'; we'll handle both.
          e.preventDefault();
          setShowHelp(true);
          return;
        }
        if (!e.shiftKey && k === '/') {
          // Already handled above for focusing search; skip here.
        }
        if (k === 's') {
          e.preventDefault();
          router.push('/pos/settings');
          return;
        }
        if (k === 'p') {
          e.preventDefault();
          router.push('/pos');
          return;
        }
      }

      // Ctrl/Cmd + L: logout (ask for confirmation)
      if (ctrlOrMeta && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        (async () => {
          const ok = await confirm({
            title: 'Cerrar sesión',
            description: '¿Seguro que quieres cerrar sesión?',
            confirmText: 'Cerrar sesión',
            cancelText: 'Cancelar',
            tone: 'danger'
          });
          if (ok) {
            try { reset(); } catch {}
            router.push('/');
          }
        })();
        return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ShortcutContext.Provider value={{ registerSearchInput }}>
      {children}
      <ShortcutsHelpOverlay open={showHelp} onClose={() => setShowHelp(false)} />
    </ShortcutContext.Provider>
  );
};
