import type { Metadata } from 'next';
import Script from 'next/script';
import 'react-loading-skeleton/dist/skeleton.css';
import './globals.css';
import { HeaderNav } from '@/components/HeaderNav';
import { ToastProvider } from '@/components/ToastProvider';
import { AdminThemeProvider } from '@/components/AdminThemeProvider';

export const metadata: Metadata = {
  title: 'Delivery Marketplace Multi-tenant',
  description: 'Plataforma unificada com App Cliente, Vendedor, Entregador e Painel Admin',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full" suppressHydrationWarning>
      <head>
        <Script id="admin-theme-init" strategy="beforeInteractive">
          {`try { document.documentElement.dataset.adminTheme = localStorage.getItem('deliveryhub.admin.theme') === 'dark' ? 'dark' : 'light'; } catch { document.documentElement.dataset.adminTheme = 'light'; }`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 font-sans antialiased">
        <AdminThemeProvider>
          <ToastProvider>
            <HeaderNav />
            <main className="flex-1">{children}</main>
          </ToastProvider>
        </AdminThemeProvider>
      </body>
    </html>
  );
}
