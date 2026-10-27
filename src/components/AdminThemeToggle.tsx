'use client';

import { Moon, Sun } from 'lucide-react';
import { useAdminTheme } from '@/components/AdminThemeProvider';

export function AdminThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useAdminTheme();
  const label = theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro';

  return <button className={`admin-theme-toggle ${className}`.trim()} type="button" onClick={toggleTheme} aria-label={label} title={label}>
    {theme === 'dark' ? <Sun size={18} aria-hidden="true"/> : <Moon size={18} aria-hidden="true"/>}
    <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
  </button>;
}
