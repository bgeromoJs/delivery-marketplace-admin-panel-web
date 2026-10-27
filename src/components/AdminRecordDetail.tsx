'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { adminApi, orderStatusLabel, tenantStatusLabel, type AdminTenant, type AdminUser } from '@/lib/adminApi';
import type { Order } from '@/types';
import { useToast } from '@/components/ToastProvider';
import { DetailSkeleton } from '@/components/AdminSkeleton';
import { BusinessRuleError } from '@/lib/apiClient';

const money = (n: number) => `R$ ${(n || 0).toFixed(2).replace('.', ',')}`;
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="admin-readonly-field"><span>{label}</span><strong>{children || '—'}</strong></div>; }
export function AdminRecordDetail({ kind }: { kind: 'seller' | 'courier' | 'order' }) {
  const { recordId } = useParams<{ recordId: string }>(); const [tenant, setTenant] = useState<AdminTenant | null>(null); const [courier, setCourier] = useState<AdminUser | null>(null); const [order, setOrder] = useState<Order | null>(null); const [tenants, setTenants] = useState<AdminTenant[]>([]); const [users, setUsers] = useState<AdminUser[]>([]); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [operation, setOperation] = useState({ vendorAcceptTimeoutMinutes: 10, deliveryRadiusKm: 5 });
  const [savedOperation, setSavedOperation] = useState({ vendorAcceptTimeoutMinutes: 10, deliveryRadiusKm: 5 });
  const [ownerPassword, setOwnerPassword] = useState('');
  const toast = useToast();
  const list = kind === 'seller' ? '/admin/vendedores' : kind === 'courier' ? '/admin/entregadores' : '/admin/pedidos';
  async function load() { setLoading(true); setError(''); try { if (kind === 'seller') { const [loadedTenant, allUsers] = await Promise.all([adminApi.tenant(recordId), adminApi.users()]); setTenant(loadedTenant); setUsers(allUsers); const currentOperation = { vendorAcceptTimeoutMinutes: loadedTenant.vendorAcceptTimeoutMinutes ?? 10, deliveryRadiusKm: loadedTenant.deliveryRadiusKm ?? 5 }; setOperation(currentOperation); setSavedOperation(currentOperation); } else if (kind === 'courier') { const [all, loadedTenants] = await Promise.all([adminApi.users(), adminApi.tenants()]); setUsers(all); setTenants(loadedTenants); setCourier(all.find((u) => u.id === recordId && u.role === 'COURIER') || null); } else { const [o,t,u] = await Promise.all([adminApi.order(recordId), adminApi.tenants(), adminApi.users()]); setOrder(o); setTenants(t); setUsers(u); } } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível consultar o backend.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, [kind, recordId]);
  async function changeTenantStatus(status: string) { if (!tenant) return; setBusy(true); try { setTenant(await adminApi.tenantStatus(tenant.id, status)); toast.success(status === 'ACTIVE' ? 'Loja aprovada.' : 'Loja suspensa.'); } catch (e) { toast.apiError(e, 'Falha ao atualizar loja.'); } finally { setBusy(false); } }
  async function saveTenantOperation(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!tenant) return; setBusy(true); try { const saved = await adminApi.updateTenant(tenant.id, { ...tenant, ...operation }); setTenant(saved); const persisted = { vendorAcceptTimeoutMinutes: saved.vendorAcceptTimeoutMinutes ?? operation.vendorAcceptTimeoutMinutes, deliveryRadiusKm: saved.deliveryRadiusKm ?? operation.deliveryRadiusKm }; setOperation(persisted); setSavedOperation(persisted); toast.success('Parâmetros operacionais da loja salvos.'); } catch (e) { toast.apiError(e, 'Falha ao salvar parâmetros da loja.'); } finally { setBusy(false); } }
  async function saveTenantDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenant) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const saved = await adminApi.updateTenant(tenant.id, {
        ...tenant,
        name: String(form.get('name') || '').trim(),
        slug: String(form.get('slug') || '').trim(),
        legalName: String(form.get('legalName') || '').trim(),
        document: String(form.get('document') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        address: String(form.get('address') || '').trim(),
        city: String(form.get('city') || '').trim(),
        state: String(form.get('state') || '').trim(),
        ownerName: String(form.get('ownerName') || '').trim(),
        ownerEmail: String(form.get('ownerEmail') || '').trim(),
        ownerPhone: String(form.get('ownerPhone') || '').trim(),
      });
      setTenant(saved);
      const linkedOwner = users.find((user) => user.role === 'SELLER' && user.tenantId === tenant.id);
      if (linkedOwner) {
        try {
          const updatedOwner = await adminApi.updateUser(linkedOwner.id, {
            name: saved.ownerName || saved.name,
            email: saved.ownerEmail || linkedOwner.email,
            phone: saved.ownerPhone || saved.phone,
          });
          setUsers((current) => current.map((user) => user.id === linkedOwner.id ? updatedOwner : user));
        } catch (accountError) {
          toast.success('Dados da loja atualizados.');
          toast.apiError(accountError, 'O acesso do responsável não foi sincronizado.');
          return;
        }
      }
      toast.success('Dados da loja atualizados.');
    } catch (e) {
      toast.apiError(e, 'Falha ao atualizar os dados da loja.');
    } finally {
      setBusy(false);
    }
  }
  async function createOwnerAccount(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!tenant) return; setBusy(true); try { const existingOwner = tenant.ownerEmail ? users.find((user) => user.email.toLowerCase() === tenant.ownerEmail?.toLowerCase()) : undefined; if (existingOwner?.role === 'ADMIN') throw new BusinessRuleError('Este e-mail pertence a um administrador.'); if (existingOwner?.tenantId && existingOwner.tenantId !== tenant.id) throw new BusinessRuleError('Esta conta já está vinculada a outra loja.'); if (existingOwner) await adminApi.linkSellerAccount(existingOwner.id, tenant.id); else { if (ownerPassword.length < 8) throw new BusinessRuleError('A senha inicial precisa ter pelo menos 8 caracteres.'); await adminApi.createAdminUser({ name: tenant.ownerName || tenant.name, email: tenant.ownerEmail || '', password: ownerPassword, phone: tenant.ownerPhone || tenant.phone, role: 'SELLER', tenantId: tenant.id, active: true }); } setUsers(await adminApi.users()); setOwnerPassword(''); toast.success(existingOwner ? 'Conta existente vinculada à loja. A senha atual foi mantida.' : 'Acesso do responsável criado. Ele já pode entrar em /vendedor/login.'); } catch (e) { toast.apiError(e, 'Falha ao criar acesso do responsável.'); } finally { setBusy(false); } }
  async function changeOrderStatus(status: string) { if (!order) return; setBusy(true); try { setOrder(await adminApi.orderStatus(order.id, status)); toast.success('Status do pedido atualizado.'); } catch (e) { toast.apiError(e, 'Falha ao atualizar pedido.'); } finally { setBusy(false); } }
  const heading = tenant?.name || courier?.name || (order ? `Pedido #${order.id.slice(0,8)}` : 'Registro');
  const operationChanged = operation.vendorAcceptTimeoutMinutes !== savedOperation.vendorAcceptTimeoutMinutes || operation.deliveryRadiusKm !== savedOperation.deliveryRadiusKm;
  const linkedSeller = tenant ? users.find((user) => user.role === 'SELLER' && user.tenantId === tenant.id) : undefined;
  const ownerAccount = tenant?.ownerEmail ? users.find((user) => user.email.toLowerCase() === tenant.ownerEmail?.toLowerCase()) : undefined;
  return <AdminShell><main className="admin-content"><div className="admin-breadcrumb"><Link href={list}>{kind === 'seller' ? 'Vendedores' : kind === 'courier' ? 'Entregadores' : 'Pedidos'}</Link><span>/</span><span>{heading}</span></div>{loading ? <DetailSkeleton /> : error && !tenant && !courier && !order ? <section className="admin-card"><p className="admin-login-message" role="alert">{error}</p><Link className="admin-button" href={list}>Voltar à listagem</Link></section> : <>
    {error && <p className="admin-login-message" role="alert">{error}</p>}
    {tenant && <><div className="admin-record-heading"><div><h1>{tenant.name}</h1><span className="admin-badge sample-badge">{tenantStatusLabel(tenant.status)}</span></div><div className="admin-detail-actions">{tenant.status !== 'ACTIVE' && <button className="admin-button admin-primary-link" disabled={busy} onClick={() => changeTenantStatus('ACTIVE')}>Aprovar loja</button>}{tenant.status !== 'SUSPENDED' && <button className="admin-button danger-button" disabled={busy} onClick={() => changeTenantStatus('SUSPENDED')}>Suspender</button>}</div></div><Section title="Dados da loja"><Grid><Field label="Razão social">{tenant.legalName}</Field><Field label="CNPJ">{tenant.document}</Field><Field label="Slug">{tenant.slug}</Field><Field label="Telefone">{tenant.phone}</Field><Field label="Endereço">{tenant.address}</Field><Field label="Cidade / Estado">{[tenant.city, tenant.state].filter(Boolean).join(' / ')}</Field><Field label="Responsável">{tenant.ownerName}</Field><Field label="E-mail do responsável">{tenant.ownerEmail}</Field><Field label="Telefone do responsável">{tenant.ownerPhone}</Field><Field label="Taxa de entrega">{tenant.deliveryFee != null ? money(tenant.deliveryFee) : '—'}</Field><Field label="Tempo estimado">{tenant.deliveryTimeMin != null ? `${tenant.deliveryTimeMin} min` : '—'}</Field></Grid></Section><Section title="Editar dados da loja"><form className="admin-settings-form" onSubmit={saveTenantDetails}><div className="admin-form-grid"><EditField label="Nome da loja" name="name" value={tenant.name} required/><EditField label="Razão social" name="legalName" value={tenant.legalName}/><EditField label="CNPJ" name="document" value={tenant.document}/><EditField label="Telefone da loja" name="phone" value={tenant.phone} type="tel"/><EditField label="Endereço" name="address" value={tenant.address}/><EditField label="Cidade" name="city" value={tenant.city}/><label className="admin-setting-field">Estado<select name="state" defaultValue={tenant.state || 'SP'}><option>SP</option><option>RJ</option><option>MG</option><option>PR</option></select></label><EditField label="Slug da loja" name="slug" value={tenant.slug} required/><EditField label="Nome do responsável" name="ownerName" value={tenant.ownerName}/><EditField label="E-mail do responsável" name="ownerEmail" value={tenant.ownerEmail} type="email"/><EditField label="Telefone do responsável" name="ownerPhone" value={tenant.ownerPhone} type="tel"/></div><div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Atualizar loja'}</button></div></form></Section>{linkedSeller ? <Section title="Acesso do responsável"><p className="admin-muted">Conta vinculada: {linkedSeller.email}</p></Section> : ownerAccount?.role === 'ADMIN' ? <Section title="Acesso do responsável"><p className="admin-muted">O e-mail do responsável pertence a uma conta administradora. Use outro e-mail para o acesso da loja.</p></Section> : ownerAccount?.tenantId && ownerAccount.tenantId !== tenant.id ? <Section title="Acesso do responsável"><p className="admin-muted">A conta {ownerAccount.email} já está vinculada a outra loja.</p></Section> : ownerAccount ? <Section title="Vincular conta existente"><p className="admin-muted">A conta {ownerAccount.email} já existe. Ao vinculá-la, o perfil passará a vendedor e a senha atual será mantida.</p><form className="admin-settings-form" onSubmit={createOwnerAccount}><div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={busy}>{busy ? 'Vinculando…' : 'Vincular conta à loja'}</button></div></form></Section> : <Section title="Criar acesso do responsável"><p className="admin-muted">Esta loja ainda não tem conta de acesso. Defina uma senha inicial para liberar o aplicativo do vendedor.</p><form className="admin-settings-form" onSubmit={createOwnerAccount}><div className="admin-form-grid"><label className="admin-setting-field"><span>Senha inicial</span><input type="password" minLength={8} required value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} /></label></div><div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={busy || !tenant.ownerEmail}>{busy ? 'Criando…' : 'Criar acesso'}</button></div></form></Section>}<Section title="Operação da loja"><form className="admin-settings-form" onSubmit={saveTenantOperation}><div className="admin-form-grid"><label className="admin-setting-field"><span>Prazo para aceitar pedido (minutos)</span><input type="number" min="1" step="1" required value={operation.vendorAcceptTimeoutMinutes} onChange={(event) => setOperation((current) => ({ ...current, vendorAcceptTimeoutMinutes: Number(event.target.value) }))} /></label><label className="admin-setting-field"><span>Raio de entrega (km)</span><input type="number" min="0.1" step="0.1" required value={operation.deliveryRadiusKm} onChange={(event) => setOperation((current) => ({ ...current, deliveryRadiusKm: Number(event.target.value) }))} /></label></div><div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={busy || !operationChanged}>Salvar operação</button></div></form></Section><Link className="admin-button" href={list}>Voltar à listagem</Link></>}
    {courier && <><div className="admin-record-heading"><div><h1>{courier.name}</h1><span className={`admin-badge ${courier.active ? 'admin-status-active' : 'admin-status-paused'}`}>{courier.active ? 'Conta ativa' : 'Conta inativa'}</span></div></div><Section title="Conta de entregador"><Grid><Field label="E-mail">{courier.email}</Field><Field label="Telefone">{courier.phone}</Field><Field label="Perfil">{courier.role}</Field><Field label="Loja vinculada">{tenants.find((t) => t.id === courier.tenantId)?.name}</Field></Grid><p className="admin-muted">O backend atual não armazena veículo, documentos, disponibilidade, chave de recebimento ou histórico de entregas.</p></Section><Link className="admin-button" href={list}>Voltar à listagem</Link></>}
    {order && <><div className="admin-record-heading"><div><h1>Pedido #{order.id.slice(0,8)}</h1><span className="admin-badge sample-badge">{orderStatusLabel(order.status)}</span></div><div className="admin-detail-actions"><label className="admin-setting-field">Atualizar status<select disabled={busy} value={order.status} onChange={(e) => changeOrderStatus(e.target.value)}>{['CREATED','PAID','ACCEPTED','PREPARING','READY','PICKED_UP','DELIVERED','CANCELLED'].map((s) => <option key={s} value={s}>{orderStatusLabel(s)}</option>)}</select></label></div></div><Section title="Resumo"><Grid><Field label="Loja">{tenants.find((t) => t.id === order.tenantId)?.name}</Field><Field label="Cliente">{order.customerName}</Field><Field label="Telefone">{order.customerPhone}</Field><Field label="Endereço">{order.deliveryAddress}</Field><Field label="Criado">{new Date(order.createdAt).toLocaleString('pt-BR')}</Field><Field label="Entregador">{users.find((u) => u.id === order.courierId)?.name}</Field><Field label="Pagamento">{order.paymentMethod}</Field><Field label="Subtotal">{money(order.subtotal)}</Field><Field label="Entrega">{money(order.deliveryFee)}</Field><Field label="Total">{money(order.totalAmount)}</Field></Grid></Section><Section title="Itens"><ul className="admin-order-items">{order.items?.map((i) => <li key={i.id}>{i.quantity} × {i.dishName} — {money(i.totalPrice)}</li>)}</ul>{order.notes && <p>{order.notes}</p>}</Section><Link className="admin-button" href={list}>Voltar à listagem</Link></>}
    {!tenant && !courier && !order && !loading && <section className="admin-card"><p>Registro não encontrado no backend.</p><Link className="admin-button" href={list}>Voltar à listagem</Link></section>}
  </>}</main></AdminShell>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="admin-card admin-detail-section"><h2>{title}</h2>{children}</section>; }
function Grid({ children }: { children: React.ReactNode }) { return <div className="admin-readonly-grid">{children}</div>; }
function EditField({ label, name, value, type = 'text', required = false }: { label: string; name: string; value?: string; type?: string; required?: boolean }) {
  return <label className="admin-setting-field">{label}<input name={name} type={type} defaultValue={value || ''} required={required} /></label>;
}
