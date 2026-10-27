'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { adminApi, type AdminAuditEntry, type AdminUser, type PlatformSettings } from '@/lib/adminApi';
import { getAdminSession, updateAdminSessionUser } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import { SettingsSkeleton } from '@/components/AdminSkeleton';

const initialSettings: PlatformSettings = {
  paymentProposalValidityHours: 24,
  orderWithoutCourierAlertMinutes: 12,
  storeLinkDomain: 'deliveryhub.com.br',
};

type AccountForm = { id: string; name: string; email: string; phone: string };
type TeamForm = { name: string; email: string; phone: string; password: string };
const emptyTeamForm: TeamForm = { name: '', email: '', phone: '', password: '' };

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR');
}

export function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<PlatformSettings | null>(null);
  const [settingsTouched, setSettingsTouched] = useState(false);
  const [account, setAccount] = useState<AccountForm>({ id: '', name: '', email: '', phone: '' });
  const [savedAccount, setSavedAccount] = useState<AccountForm | null>(null);
  const [accountTouched, setAccountTouched] = useState(false);
  const [team, setTeam] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const [newMember, setNewMember] = useState<TeamForm>(emptyTeamForm);
  const [editingMember, setEditingMember] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [memberEditTouched, setMemberEditTouched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const toast = useToast();

  useEffect(() => {
    let active = true;
    const session = getAdminSession();
    if (!session) {
      toast.error('Sua sessão expirou. Entre novamente para acessar as configurações.');
      setLoading(false);
      return () => { active = false; };
    }

    Promise.all([
      adminApi.platformSettings(),
      adminApi.user(session.user.id),
      adminApi.users(),
      adminApi.auditEntries(),
    ]).then(([platform, currentUser, users, events]) => {
      if (!active) return;
      setSettings(platform);
      setSavedSettings(platform);
      setSettingsTouched(false);
      const accountData = { id: currentUser.id, name: currentUser.name, email: currentUser.email, phone: currentUser.phone || '' };
      setAccount(accountData);
      setSavedAccount(accountData);
      setAccountTouched(false);
      setTeam(users.filter((user) => user.role === 'ADMIN'));
      setAudit(events);
    }).catch((cause: unknown) => {
      if (active) toast.apiError(cause, 'Não foi possível carregar as configurações.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [toast]);

  async function reloadAudit() {
    setAudit(await adminApi.auditEntries());
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('settings');
    try {
      const saved = await adminApi.updatePlatformSettings(settings);
      setSettings(saved);
      setSavedSettings(saved);
      setSettingsTouched(false);
      await reloadAudit();
      toast.success('Regras da plataforma salvas.');
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível salvar as regras.');
    } finally {
      setSaving('');
    }
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('account');
    try {
      const saved = await adminApi.updateUser(account.id, { name: account.name, email: account.email, phone: account.phone });
      const accountData = { id: saved.id, name: saved.name, email: saved.email, phone: saved.phone || '' };
      setAccount(accountData);
      setSavedAccount(accountData);
      setAccountTouched(false);
      updateAdminSessionUser({ id: saved.id, name: saved.name, email: saved.email, role: 'ADMIN' });
      await reloadAudit();
      toast.success('Dados da conta atualizados.');
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível atualizar a conta.');
    } finally {
      setSaving('');
    }
  }

  async function createMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving('create-member');
    try {
      await adminApi.createTeamMember(newMember);
      setNewMember(emptyTeamForm);
      const [users, events] = await Promise.all([adminApi.users(), adminApi.auditEntries()]);
      setTeam(users.filter((user) => user.role === 'ADMIN'));
      setAudit(events);
      toast.success('Membro da equipe criado.');
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível criar o membro da equipe.');
    } finally {
      setSaving('');
    }
  }

  function startEditing(user: AdminUser) {
    setEditingMember(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setMemberEditTouched(false);
  }

  async function saveMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMember) return;
    setSaving('edit-member');
    try {
      await adminApi.updateUser(editingMember.id, editForm);
      const [users, events] = await Promise.all([adminApi.users(), adminApi.auditEntries()]);
      setTeam(users.filter((user) => user.role === 'ADMIN'));
      setAudit(events);
      setEditingMember(null);
      setMemberEditTouched(false);
      toast.success('Membro da equipe atualizado.');
    } catch (cause) {
      toast.apiError(cause, 'Não foi possível atualizar o membro da equipe.');
    } finally {
      setSaving('');
    }
  }

  const field = (label: string, value: string | number, onChange: (value: string) => void, options: { type?: string; min?: number; minLength?: number; step?: number; required?: boolean } = {}) => (
    <label className="admin-setting-field">
      <span>{label}</span>
      <input type={options.type || 'text'} value={value} min={options.min} minLength={options.minLength} step={options.step} required={options.required ?? true} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
  const settingsChanged = settingsTouched && (savedSettings === null || JSON.stringify(settings) !== JSON.stringify(savedSettings));
  const accountChanged = accountTouched && (savedAccount === null || account.name !== savedAccount.name || account.email !== savedAccount.email || account.phone !== savedAccount.phone);
  const teamFormReady = Boolean(newMember.name.trim() && newMember.email.trim() && newMember.password.length >= 8);
  const editChanged = Boolean(editingMember && memberEditTouched && (editForm.name !== editingMember.name || editForm.email !== editingMember.email || editForm.phone !== (editingMember.phone || '')));

  return <>
    <div className="admin-title-row"><div><h1>Configurações</h1><p className="admin-page-subtitle">Gerencie políticas globais da plataforma, os acessos e a atividade administrativa.</p></div></div>
    {loading && <SettingsSkeleton />}

    {!loading && <>
    <section className="admin-card admin-settings-card admin-settings-wide">
      <div><h2>Políticas globais</h2><p className="admin-muted">Regras compartilhadas entre as lojas. Prazo de aceite e raio de entrega são definidos no cadastro de cada loja.</p></div>
      <form className="admin-settings-form" onSubmit={saveSettings}>
        <div className="admin-form-grid">
          {field('Validade da proposta de pagamento (horas)', settings.paymentProposalValidityHours, (value) => { setSettings((current) => ({ ...current, paymentProposalValidityHours: Number(value) })); setSettingsTouched(true); }, { type: 'number', min: 1 })}
          {field('Alerta de pedido sem entregador (minutos)', settings.orderWithoutCourierAlertMinutes, (value) => { setSettings((current) => ({ ...current, orderWithoutCourierAlertMinutes: Number(value) })); setSettingsTouched(true); }, { type: 'number', min: 1 })}
          {field('Domínio-base dos links das lojas', settings.storeLinkDomain, (value) => { setSettings((current) => ({ ...current, storeLinkDomain: value })); setSettingsTouched(true); })}
        </div>
        <div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={loading || saving !== '' || !settingsChanged} title={!settingsChanged ? 'Altere uma regra para habilitar o salvamento' : undefined}>{saving === 'settings' ? 'Salvando…' : 'Salvar regras'}</button></div>
      </form>
    </section>

    <div className="admin-settings-grid">
      <section className="admin-card admin-settings-card admin-settings-wide">
        <div><h2>Minha conta</h2><p className="admin-muted">Atualize seus dados de acesso ao painel.</p></div>
        <form className="admin-settings-form" onSubmit={saveAccount}>
          <div className="admin-form-grid">
            {field('Nome', account.name, (value) => { setAccount((current) => ({ ...current, name: value })); setAccountTouched(true); })}
            {field('E-mail', account.email, (value) => { setAccount((current) => ({ ...current, email: value })); setAccountTouched(true); }, { type: 'email' })}
            {field('Telefone', account.phone, (value) => { setAccount((current) => ({ ...current, phone: value })); setAccountTouched(true); }, { required: false })}
          </div>
          <div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={loading || saving !== '' || !accountChanged} title={!accountChanged ? 'Altere um dado para habilitar o salvamento' : undefined}>{saving === 'account' ? 'Salvando…' : 'Salvar conta'}</button></div>
        </form>
      </section>

      <section className="admin-card admin-settings-card admin-settings-wide">
        <div><h2>Equipe do painel</h2><p className="admin-muted">Contas com acesso administrativo ao painel.</p></div>
        <form className="admin-settings-form admin-team-create" onSubmit={createMember}>
          <div className="admin-form-grid">
            {field('Nome do membro', newMember.name, (value) => setNewMember({ ...newMember, name: value }))}
            {field('E-mail', newMember.email, (value) => setNewMember({ ...newMember, email: value }), { type: 'email' })}
            {field('Telefone', newMember.phone, (value) => setNewMember({ ...newMember, phone: value }), { required: false })}
            {field('Senha inicial', newMember.password, (value) => setNewMember({ ...newMember, password: value }), { type: 'password', minLength: 8 })}
          </div>
          <div className="admin-settings-actions"><button className="admin-button admin-save-button" type="submit" disabled={loading || saving !== '' || !teamFormReady} title={!teamFormReady ? 'Preencha nome, e-mail e senha de pelo menos 8 caracteres' : undefined}>{saving === 'create-member' ? 'Criando…' : 'Adicionar membro'}</button></div>
        </form>
        <div className="approval-table-wrap">
          <table className="approval-table admin-settings-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Perfil</th><th>Ação</th></tr></thead>
            <tbody>{team.map((member) => <tr key={member.id}><td><strong>{member.name}</strong></td><td>{member.email}</td><td>{member.phone || '—'}</td><td>Administrador</td><td><button className="admin-view-link admin-settings-edit" type="button" onClick={() => startEditing(member)}>Editar</button></td></tr>)}
              {!team.length && <tr><td colSpan={5} className="admin-settings-empty">{loading ? 'Carregando equipe…' : 'Nenhum administrador encontrado.'}</td></tr>}
            </tbody>
          </table>
        </div>
        {editingMember && <form className="admin-settings-form admin-team-edit" onSubmit={saveMember}>
          <h3>Editar {editingMember.name}</h3>
          <div className="admin-form-grid">
            {field('Nome', editForm.name, (value) => { setEditForm((current) => ({ ...current, name: value })); setMemberEditTouched(true); })}
            {field('E-mail', editForm.email, (value) => { setEditForm((current) => ({ ...current, email: value })); setMemberEditTouched(true); }, { type: 'email' })}
            {field('Telefone', editForm.phone, (value) => { setEditForm((current) => ({ ...current, phone: value })); setMemberEditTouched(true); }, { required: false })}
          </div>
          <div className="admin-settings-actions"><button className="admin-button" type="button" onClick={() => setEditingMember(null)}>Cancelar</button><button className="admin-button admin-save-button" type="submit" disabled={saving !== '' || !editChanged} title={!editChanged ? 'Altere um dado para habilitar o salvamento' : undefined}>{saving === 'edit-member' ? 'Salvando…' : 'Salvar membro'}</button></div>
        </form>}
      </section>
    </div>

    <section className="admin-card admin-settings-card admin-settings-wide">
      <div><h2>Auditoria</h2><p className="admin-muted">Registro das alterações administrativas mais recentes.</p></div>
      <div className="approval-table-wrap">
        <table className="approval-table admin-settings-table"><thead><tr><th>Data</th><th>Responsável</th><th>Ação</th><th>Alvo</th><th>Detalhes</th></tr></thead>
          <tbody>{audit.map((entry) => <tr key={entry.id}><td>{displayDate(entry.createdAt)}</td><td>{entry.actorEmail}</td><td>{entry.action.replace(/_/g, ' ').toLowerCase()}</td><td>{entry.target}</td><td>{entry.description || '—'}</td></tr>)}
            {!audit.length && <tr><td colSpan={5} className="admin-settings-empty">{loading ? 'Carregando auditoria…' : 'Nenhuma atividade registrada.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
    </>}
  </>;
}
