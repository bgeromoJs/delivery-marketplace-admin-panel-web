'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Store, Bike, ShoppingBag, Users, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { clearAdminSession, getAdminSession, type AuthSession } from '@/lib/auth';
import { AdminThemeToggle } from '@/components/AdminThemeToggle';

const navigation = [
  { label: 'Painel', href: '/admin', Icon: LayoutDashboard, adminOnly: false },
  { label: 'Vendedores', href: '/admin/vendedores', Icon: Store, adminOnly: false },
  { label: 'Entregadores', href: '/admin/entregadores', Icon: Bike, adminOnly: false },
  { label: 'Pedidos', href: '/admin/pedidos', Icon: ShoppingBag, adminOnly: false },
  { label: 'Usuários', href: '/admin/usuarios', Icon: Users, adminOnly: true },
  { label: 'Configurações', href: '/admin/configuracoes', Icon: Settings, adminOnly: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem('deliveryhub.admin.sidebar-collapsed') === 'true');
    const currentSession = getAdminSession();
    if (!currentSession) {
      router.replace('/admin/login');
      return;
    }
    setSession(currentSession);
    setIsAuthorized(true);
    const onSessionUpdated = () => setSession(getAdminSession());
    const onSessionExpired = () => router.replace('/admin/login');
    window.addEventListener('deliveryhub:session-updated', onSessionUpdated);
    window.addEventListener('deliveryhub:session-expired', onSessionExpired);
    return () => {
      window.removeEventListener('deliveryhub:session-updated', onSessionUpdated);
      window.removeEventListener('deliveryhub:session-expired', onSessionExpired);
    };
  }, [router]);

  function logout() {
    clearAdminSession();
    router.replace('/admin/login');
  }

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => {
      const next = !collapsed;
      window.localStorage.setItem('deliveryhub.admin.sidebar-collapsed', String(next));
      return next;
    });
  }

  if (!isAuthorized) return null;

  return (
    <div className={`admin-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar-heading"><button className="admin-brand admin-brand-toggle" type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'} title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}><span className="admin-brand-mark">N</span><span className="admin-brand-copy"><strong>[NOME DA PLATAFORMA]</strong><small>Painel de administração</small></span>{sidebarCollapsed ? <ChevronRight className="admin-brand-chevron" size={15} aria-hidden="true"/> : <ChevronLeft className="admin-brand-chevron" size={15} aria-hidden="true"/>}</button></div>
        <span className="admin-menu-label">Menu</span>
        <nav aria-label="Administração" className="admin-menu">
          {navigation.filter((item) => !item.adminOnly || session?.user.role === 'ADMIN').map((item) => {
            const active = item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.Icon;
            return <Link key={item.href} href={item.href} className={active ? 'selected' : ''} aria-current={active ? 'page' : undefined} aria-label={item.label} title={sidebarCollapsed ? item.label : undefined}><Icon aria-hidden="true" /><span className="admin-menu-item-label">{item.label}</span></Link>;
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="admin-logout" onClick={logout} type="button" aria-label="Sair" title={sidebarCollapsed ? 'Sair' : undefined}><LogOut size={17} aria-hidden="true"/><span>Sair</span></button>
        </div>
      </aside>
      <div className={`admin-main-column ${pathname === '/admin' ? 'support-main-column' : ''}`}>
        <header className="admin-topbar">
          <input className="admin-global-search" type="search" placeholder="Buscar lojas, pedidos ou entregadores" aria-label="Buscar" />
          <div className="admin-topbar-actions">
            <div className="admin-topbar-user"><span className="admin-user-avatar">{session?.user.name.slice(0, 2).toUpperCase() || 'AD'}</span><span><strong>{session?.user.name || 'Administrador'}</strong><small>{session?.user.email}</small></span></div>
            <AdminThemeToggle className="admin-topbar-theme-toggle" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
