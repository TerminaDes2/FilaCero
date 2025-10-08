"use client";
import { useEffect } from 'react';
import { useSettingsStore } from '../state/settingsStore';

export default function ClientSettingsApplier() {
  const { mode, density, accentTeal } = useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = mode === 'dark' || (mode === 'system' && prefersDark);
      root.classList.toggle('dark', isDark);
      root.classList.toggle('density-compact', density === 'compact');

      // Accent mapping: swap POS primary accent between teal and brand
      const styles = getComputedStyle(root);
      const teal = styles.getPropertyValue('--fc-teal-500')?.trim() || '#4cc1ad';
      const tealHover = styles.getPropertyValue('--fc-teal-600')?.trim() || '#3faf9c';
      const brand = styles.getPropertyValue('--fc-brand-600')?.trim() || '#de355f';
      const brandHover = styles.getPropertyValue('--fc-brand-700')?.trim() || '#c12249';
      root.style.setProperty('--pos-accent-green', accentTeal ? teal : brand);
      root.style.setProperty('--pos-accent-green-hover', accentTeal ? tealHover : brandHover);
    };

    apply();

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => apply();
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, [mode, density, accentTeal]);

  return null;
}
