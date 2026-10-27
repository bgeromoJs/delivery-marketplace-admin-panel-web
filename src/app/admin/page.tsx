'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi, orderStatusLabel, type AdminTenant } from '@/lib/adminApi';
import type { Order } from '@/types';
import { useToast } from '@/components/ToastProvider';
import { DashboardSkeleton } from '@/components/AdminSkeleton';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]); const [tenants, setTenants] = useState<AdminTenant[]>([]); const [selected, setSelected] = useState(''); const [loading, setLoading] = useState(true);
  const toast = useToast();
  useEffect(() => { Promise.all([adminApi.orders(), adminApi.tenants()]).then(([o,t]) => { setOrders(o); setTenants(t); }).catch((e: unknown) => toast.apiError(e, 'Falha ao carregar a fila.')).finally(() => setLoading(false)); }, [toast]);
  const tasks = useMemo(() => [
    ...orders.filter((o) => o.status === 'READY' && !o.courierId).map((o) => ({ id: o.id, title: 'Pedido pronto sem entregador', detail: `Pedido #${o.id.slice(0,8)} · ${tenants.find((t) => t.id === o.tenantId)?.name || 'Loja'}`, type: 'Pedido sem entregador', situation: 'Pronto para coleta', created: o.createdAt, order: o })),
    ...tenants.filter((t) => t.status === 'PENDING').map((t) => ({ id: t.id, title: 'Loja aguardando aprovação', detail: `${t.name} · ${t.slug}`, type: 'Loja pendente', situation: 'Cadastro aguardando aprovação', created: '', tenant: t })),
  ], [orders, tenants]);
  const active = tasks.find((t) => t.id === selected) || tasks[0];
  async function resolve() { if (!active) return; try { if ('order' in active && active.order) { const updated = await adminApi.orderStatus(active.order.id, 'CANCELLED'); setOrders((current) => current.map((o) => o.id === updated.id ? updated : o)); toast.success('Pedido cancelado.'); } else if ('tenant' in active && active.tenant) { const updated = await adminApi.tenantStatus(active.tenant.id, 'ACTIVE'); setTenants((current) => current.map((t) => t.id === updated.id ? updated : t)); toast.success('Loja aprovada.'); } } catch (e) { toast.apiError(e, 'Não foi possível atualizar o registro.'); } }
  return <AdminShell><main className="admin-content support-dashboard"><header className="support-heading"><div><h1>Fila do suporte</h1><p className="admin-page-subtitle">Pendências derivadas de pedidos e lojas cadastrados no backend.</p></div></header>
    {loading && <DashboardSkeleton />}
    {!loading && <><section className="support-stats"><span className="support-kpi"><b>{tasks.filter((t) => t.type === 'Pedido sem entregador').length}</b> pedidos sem entregador</span><span className="support-kpi"><b>{tasks.filter((t) => t.type === 'Loja pendente').length}</b> lojas pendentes</span></section><section className="admin-card support-queue"><div className="support-workspace"><div className="support-task-list">{tasks.map((task) => <article key={task.id} className={`support-task ${active?.id === task.id ? 'selected' : ''}`} onClick={() => setSelected(task.id)}><span className="support-priority-mark attention"/><div className="support-task-copy"><div className="support-task-title"><strong>{task.title}</strong><span className="support-priority attention">Atenção</span></div><p>{task.detail}</p><div className="support-task-meta"><b>{task.type}</b><span>Dados do backend</span></div></div><button className="admin-button" onClick={(e) => {e.stopPropagation();setSelected(task.id);}}>Abrir</button></article>)}{tasks.length === 0 && <p className="support-empty">Nenhuma pendência encontrada.</p>}</div>{active && <aside className="admin-card support-detail"><div className="support-detail-heading"><div><h2>{active.title}</h2><p className="admin-muted">{active.detail}</p></div></div><dl className="support-detail-fields"><div><dt>Tipo</dt><dd>{active.type}</dd></div><div><dt>Situação</dt><dd>{active.situation}</dd></div>{'order' in active && active.order && <><div><dt>Cliente</dt><dd>{active.order.customerName || '—'}</dd></div><div><dt>Total</dt><dd>{`R$ ${active.order.totalAmount.toFixed(2).replace('.', ',')}`}</dd></div><div><dt>Status atual</dt><dd>{orderStatusLabel(active.order.status)}</dd></div></>}</dl><div className="support-detail-actions"><button className="admin-button admin-primary-link" onClick={resolve}>{'order' in active && active.order ? 'Cancelar pedido' : 'Aprovar loja'}</button></div></aside>}</div></section></>}
  </main></AdminShell>;
}
