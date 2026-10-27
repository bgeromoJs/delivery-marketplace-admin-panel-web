'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type AdminTheme = 'light' | 'dark';
type AdminThemeContextValue = { theme: AdminTheme; toggleTheme: () => void };

const STORAGE_KEY = 'deliveryhub.admin.theme';
const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function applyTheme(theme: AdminTheme) {
  document.documentElement.dataset.adminTheme = theme;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>('light');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme: AdminTheme = saved === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const value = useMemo<AdminThemeContextValue>(() => ({
    theme,
    toggleTheme: () => {
      setTheme((current) => {
        const next = current === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
        return next;
      });
    },
  }), [theme]);

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) throw new Error('useAdminTheme deve ser usado dentro de AdminThemeProvider.');
  return context;
}
