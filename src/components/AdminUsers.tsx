'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { adminApi, userRoleLabel, userRoleLabels, type AdminTenant, type AdminUser } from '@/lib/adminApi';
import { getAdminSession } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import { TableSkeleton } from '@/components/AdminSkeleton';
import { BusinessRuleError } from '@/lib/apiClient';

const roles = ['CUSTOMER', 'COURIER', 'SELLER', 'SUPPORT', 'ADMIN'];
const platformRoles = ['ADMIN', 'SUPPORT'];

type UserForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  tenantId: string;
  active: boolean;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER',
  tenantId: '',
  active: true,
};

function displayDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [tenantFilter, setTenantFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const toast = useToast();
  const currentUser = getAdminSession()?.user;

  useEffect(() => {
    let active = true;
    Promise.all([adminApi.users(), adminApi.tenants()])
      .then(([loadedUsers, loadedTenants]) => {
        if (!active) return;
        setUsers(loadedUsers);
        setTenants(loadedTenants);
      })
      .catch((cause: unknown) => {
        if (active) toast.apiError(cause, 'Não foi possível carregar os usuários.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [toast]);

  const tenantName = useMemo(() => new Map(tenants.map((tenant) => [tenant.id, tenant.name])), [tenants]);
  const filtered = users.filter((user) => {
    const haystack = `${user.name} ${user.email} ${user.phone || ''} ${tenantName.get(user.tenantId || '') || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase())
      && (roleFilter === 'Todos' || userRoleLabel(user.role) === roleFilter)
      && (tenantFilter === 'Todos' || (tenantFilter === 'Sem loja' ? !user.tenantId : user.tenantId === tenantFilter))
      && (statusFilter === 'Todos' || (statusFilter === 'Ativos' ? user.active : !user.active));
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      tenantId: user.tenantId || '',
      active: user.active,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function changeRole(role: string) {
    setForm((current) => ({
      ...current,
      role,
      tenantId: platformRoles.includes(role) ? '' : current.tenantId,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('form');
    try {
      if (!form.name.trim()) throw new BusinessRuleError('Informe o nome do usuário.');
      if (!form.email.trim()) throw new BusinessRuleError('Informe o e-mail de acesso.');
      if (form.password && form.password.length < 8) throw new BusinessRuleError('A senha deve ter pelo menos 8 caracteres.');
      if (!editing && !form.password) throw new BusinessRuleError('Defina a senha inicial do usuário.');
      if (form.role === 'SELLER' && !form.tenantId) throw new BusinessRuleError('Selecione a loja do vendedor.');
      if (platformRoles.includes(form.role) && form.tenantId) throw new BusinessRuleError('Administrador e suporte não são vinculados a uma loja.');

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        tenantId: platformRoles.includes(form.role) ? null : form.tenantId || null,
        active: form.active,
        ...(form.password ? { password: form.password } : {}),
      };

      if (editing) {
        const saved = await adminApi.updateAdminUser(editing.id, payload);
        setUsers((current) => current.map((user) => user.id === saved.id ? saved : user));
        toast.success('Usuário atualizado.');
      } else {
        const created = await adminApi.createAdminUser({ ...payload, password: form.password });
        setUsers((current) => [created, ...current]);
        toast.success('Usuário cadastrado.');
      }
      closeForm();
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível salvar o usuário.');
    } finally {
      setBusy('');
    }
  }

  async function toggleActive(user: AdminUser) {
    setBusy(user.id);
    try {
      const saved = await adminApi.setUserActive(user.id, !user.active);
      setUsers((current) => current.map((item) => item.id === saved.id ? saved : item));
      toast.success(saved.active ? 'Usuário ativado.' : 'Usuário desativado.');
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível alterar a situação do usuário.');
    } finally {
      setBusy('');
    }
  }

  const requiresTenant = form.role === 'SELLER';
  const tenantAllowed = !platformRoles.includes(form.role);

  return <AdminShell><main className="admin-content">
    <div className="admin-title-row">
      <div>
        <h1>Usuários</h1>
        <p className="admin-page-subtitle">Cadastre acessos e defina o perfil, a loja e a situação de cada pessoa.</p>
      </div>
      <button className="admin-button admin-primary-link" type="button" onClick={formOpen ? closeForm : openCreate}>
        {formOpen ? 'Fechar cadastro' : 'Novo usuário'}
      </button>
    </div>

    {formOpen && <section className="admin-card admin-form-section">
      <h2>{editing ? `Editar ${editing.name}` : 'Novo usuário'}</h2>
      <p className="admin-muted">
        Cliente e entregador podem ficar sem loja. Vendedor exige uma loja. Administrador e analista de suporte são contas da plataforma.
      </p>
      <form className="admin-settings-form" onSubmit={submit}>
        <div className="admin-form-grid">
          <label className="admin-setting-field">Perfil
            <select value={form.role} onChange={(event) => changeRole(event.target.value)} required>
              {roles.map((role) => <option key={role} value={role}>{userRoleLabels[role]}</option>)}
            </select>
          </label>
          <label className="admin-setting-field">Loja {requiresTenant ? '(obrigatória)' : '(opcional)'}
            <select
              value={form.tenantId}
              onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
              required={requiresTenant}
              disabled={!tenantAllowed}
            >
              <option value="">{tenantAllowed ? 'Sem loja' : 'Conta da plataforma'}</option>
              {tenantAllowed && tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
          <label className="admin-setting-field">Nome
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="admin-setting-field">E-mail de acesso
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>
          <label className="admin-setting-field">Telefone
            <input type="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label className="admin-setting-field">{editing ? 'Nova senha (opcional)' : 'Senha inicial'}
            <input type="password" minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required={!editing} />
          </label>
          <label className="admin-setting-field">Situação
            <select value={form.active ? 'Ativo' : 'Inativo'} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'Ativo' }))}>
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </label>
        </div>
        <div className="admin-form-actions">
          <button className="admin-button" type="button" onClick={closeForm}>Cancelar</button>
          <button className="admin-button admin-save-button" type="submit" disabled={busy !== ''}>{busy === 'form' ? 'Salvando…' : editing ? 'Salvar usuário' : 'Cadastrar usuário'}</button>
        </div>
      </form>
    </section>}

    <div className="admin-filters admin-filters-wrap">
      <label className="admin-search">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail, telefone ou loja" /></label>
      <label>Perfil<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option>Todos</option>{roles.map((role) => <option key={role}>{userRoleLabels[role]}</option>)}</select></label>
      <label>Loja<select value={tenantFilter} onChange={(event) => setTenantFilter(event.target.value)}><option>Todos</option><option>Sem loja</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label>
      <label>Situação<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option><option>Ativos</option><option>Inativos</option></select></label>
    </div>

    {loading ? <TableSkeleton columns={6} /> : <section className="admin-card admin-list-card">
      {filtered.length ? <div className="approval-table-wrap">
        <table className="approval-table">
          <thead><tr><th>Usuário</th><th>Perfil</th><th>Loja</th><th>Situação</th><th>Criado em</th><th /></tr></thead>
          <tbody>{filtered.map((user) => {
            const isSelf = currentUser?.id === user.id;
            return <tr key={user.id}>
              <td><div className="admin-list-identity"><span className="admin-list-avatar">{user.name.slice(0, 2).toUpperCase()}</span><span><strong>{user.name}{isSelf ? ' (você)' : ''}</strong><span className="admin-muted">{user.email}{user.phone ? ` · ${user.phone}` : ''}</span></span></div></td>
              <td><span className="admin-badge sample-badge">{userRoleLabel(user.role)}</span></td>
              <td>{user.tenantId ? tenantName.get(user.tenantId) || 'Loja não encontrada' : '—'}</td>
              <td><span className={`admin-badge ${user.active ? 'admin-status-active' : 'admin-status-paused'}`}>{user.active ? 'Ativo' : 'Inativo'}</span></td>
              <td>{displayDate(user.createdAt)}</td>
              <td className="admin-row-actions">
                <button className="admin-view-link admin-settings-edit" type="button" onClick={() => openEdit(user)}>Editar</button>
                <button className="admin-view-link" type="button" disabled={busy !== '' || isSelf} title={isSelf ? 'Você não pode desativar o próprio acesso' : undefined} onClick={() => toggleActive(user)}>
                  {user.active ? 'Desativar' : 'Ativar'}
                </button>
              </td>
            </tr>;
          })}</tbody>
        </table>
      </div> : <div className="admin-empty-list-message">{users.length ? 'Nenhum usuário corresponde aos filtros aplicados.' : 'Nenhum usuário cadastrado ainda. Use “Novo usuário” para criar o primeiro.'}</div>}
    </section>}

    <p className="admin-muted admin-list-footnote">O cadastro público cria apenas clientes. Vendedor, entregador, analista de suporte e administrador são criados nesta tela por um administrador do sistema.</p>
  </main></AdminShell>;
}
