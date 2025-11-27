'use client';

import React from 'react';
import { UserProvider } from '../state/userStore';
import ClientSettingsApplier from './ClientSettingsApplier';
import LanguageInitializer from './LanguageInitializer';
import ThemeApplier from './ThemeApplier';
import { ConfirmProvider } from './system/ConfirmProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <LanguageInitializer />
      <ThemeApplier />
      <ClientSettingsApplier />
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </UserProvider>
  );
}
