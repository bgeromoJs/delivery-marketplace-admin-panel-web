'use client';

import { type FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/AdminShell';
import { adminApi, type AdminTenant } from '@/lib/adminApi';
import { useToast } from '@/components/ToastProvider';
import { BusinessRuleError } from '@/lib/apiClient';

export function AdminRecordForm({ kind }: { kind: 'seller' | 'courier' }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const isSeller = kind === 'seller';
  const listPath = isSeller ? '/admin/vendedores' : '/admin/entregadores';
  const toast = useToast();

  useEffect(() => { if (!isSeller) adminApi.tenants().then(setTenants).catch((e: unknown) => toast.apiError(e, 'Não foi possível carregar lojas.')); }, [isSeller, toast]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      if (isSeller) {
        const ownerName = String(form.get('owner') || '').trim();
        const ownerEmail = String(form.get('email') || '').trim();
        const ownerPhone = String(form.get('ownerPhone') || '').trim();
        const ownerPassword = String(form.get('ownerPassword') || '');
        const existingOwner = (await adminApi.users()).find((user) => user.email.toLowerCase() === ownerEmail.toLowerCase());
        if (existingOwner?.role === 'ADMIN') throw new BusinessRuleError('Este e-mail pertence a um administrador. Use outro e-mail para o responsável da loja.');
        if (existingOwner?.tenantId) throw new BusinessRuleError('Esta conta já está vinculada a outra loja. Use outro e-mail para o responsável.');
        if (!existingOwner && ownerPassword.length < 8) throw new BusinessRuleError('Defina uma senha inicial com pelo menos 8 caracteres para criar o acesso do responsável.');

        const tenant = await adminApi.createTenant({
        name: String(form.get('name') || '').trim(), slug: String(form.get('slug') || '').trim(),
        legalName: String(form.get('legalName') || '').trim(), document: String(form.get('document') || '').trim(),
        phone: String(form.get('phone') || '').trim(), address: String(form.get('address') || '').trim(),
        city: String(form.get('city') || '').trim(), state: String(form.get('state') || 'SP'),
        ownerName, ownerEmail,
        ownerPhone, status: 'PENDING',
        vendorAcceptTimeoutMinutes: Number(form.get('vendorAcceptTimeoutMinutes') || 10),
        deliveryRadiusKm: Number(form.get('deliveryRadiusKm') || 5),
        });
        try {
          if (existingOwner) await adminApi.linkSellerAccount(existingOwner.id, tenant.id);
          else await adminApi.createAdminUser({ name: ownerName, email: ownerEmail, password: ownerPassword, phone: ownerPhone, role: 'SELLER', tenantId: tenant.id, active: true });
        } catch (accountError) {
          throw new Error(`A loja foi criada, mas não foi possível criar o acesso do responsável: ${accountError instanceof Error ? accountError.message : 'erro inesperado'}. A loja ficou sem conta vinculada.`);
        }
      } else await adminApi.createAdminUser({
        name: String(form.get('name') || '').trim(), email: String(form.get('email') || '').trim(),
        password: String(form.get('password') || ''), phone: String(form.get('phone') || '').trim(), role: 'COURIER',
        tenantId: String(form.get('store') || '') || undefined, active: true,
      });
        toast.success(isSeller ? 'Vendedor cadastrado.' : 'Entregador cadastrado.');
      router.push(listPath);
    } catch (e) { toast.apiError(e, 'Não foi possível salvar no backend.'); }
    finally { setSaving(false); }
  }

  return <AdminShell><main className="admin-content">
    <div className="admin-breadcrumb"><Link href={listPath}>{isSeller ? 'Vendedores' : 'Entregadores'}</Link><span>/</span><span>Novo {isSeller ? 'vendedor' : 'entregador'}</span></div>
    <div className="admin-title-row"><h1>Novo {isSeller ? 'vendedor' : 'entregador'}</h1></div>
    <form className="admin-record-form" onSubmit={submit}>
      {isSeller ? <>
        <section className="admin-card admin-form-section"><h2>Dados da loja</h2><p className="admin-muted">A loja é criada como Pendente e só aparece para clientes depois de aprovada.</p><div className="admin-form-grid"><Field label="Nome da loja" name="name" required/><Field label="Razão social" name="legalName" required/><Field label="CNPJ" name="document" required/><Field label="Telefone" name="phone" type="tel" required/><Field label="Endereço" name="address" required/><Field label="Cidade" name="city" required/><label className="admin-setting-field">Estado<select name="state"><option>SP</option><option>RJ</option><option>MG</option><option>PR</option></select></label><div className="admin-setting-field"><label htmlFor="seller-slug">Link da loja (slug)</label><div className="admin-slug-field"><span>/l/</span><input id="seller-slug" name="slug" required minLength={3} maxLength={40} pattern="[a-z0-9-]+" placeholder="minha-loja" title="Use de 3 a 40 caracteres: letras minúsculas, números e hífen." /></div><small>3 a 40 caracteres: letras minúsculas, números e hífen. Depois de divulgado, não deve mudar.</small></div></div></section>
        <section className="admin-card admin-form-section"><h2>Acesso do responsável</h2><p className="admin-muted">Se o e-mail ainda não tiver conta, será criada uma conta de vendedor com a senha inicial. Se já existir, ela será vinculada à loja, passará ao perfil vendedor e manterá a senha atual.</p><div className="admin-form-grid"><Field label="Nome do responsável" name="owner" required/><Field label="E-mail de acesso" name="email" type="email" required/><Field label="Telefone" name="ownerPhone" type="tel" required/><Field label="Senha inicial (para conta nova)" name="ownerPassword" type="password" min="8"/></div></section>
        <section className="admin-card admin-form-section"><h2>Operação da loja</h2><p className="admin-muted">Informe os parâmetros operacionais definidos pelo vendedor. Eles podem ser ajustados no cadastro da loja.</p><div className="admin-form-grid"><Field label="Prazo para aceitar pedido (minutos)" name="vendorAcceptTimeoutMinutes" type="number" required min={1} step="1"/><Field label="Raio de entrega (km)" name="deliveryRadiusKm" type="number" required min={0.1} step="0.1"/></div></section>
        <section className="admin-card admin-form-section"><h2>Pagamentos e tema</h2><p className="admin-muted">Configurados depois, na tela da loja. Meios de pagamento (Pix, cartão, dinheiro) são propostos pelo suporte e confirmados pelo vendedor no app. Logo, banner e cores também podem ser ajustados pelo vendedor.</p></section>
      </> : <>
        <section className="admin-card admin-form-section"><h2>Conta do entregador</h2><p className="admin-muted">A conta será gravada no serviço de identidade. O backend atual ainda não guarda documentos ou dados do veículo.</p><div className="admin-form-grid"><Field label="Nome completo" name="name" required/><Field label="Telefone" name="phone" type="tel" required/><Field label="E-mail de acesso" name="email" type="email" required/><Field label="Senha inicial" name="password" type="password" required min="8"/></div></section>
        <section className="admin-card admin-form-section"><h2>Vínculo inicial com uma loja (opcional)</h2><div className="admin-form-grid"><label className="admin-setting-field">Loja<select name="store"><option value="">Nenhuma</option>{tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}</select></label></div></section>
      </>}
      <div className="admin-form-actions"><Link className="admin-button" href={listPath}>Cancelar</Link><button className="admin-button admin-save-button" type="submit" disabled={saving}>{saving ? 'Salvando…' : isSeller ? 'Criar loja' : 'Cadastrar entregador'}</button></div>
    </form>
  </main></AdminShell>;
}

function Field({ label, name, type = 'text', required, min, max, step }: { label: string; name: string; type?: string; required?: boolean; min?: string | number; max?: string | number; step?: string }) {
  return <label className="admin-setting-field">{label}<input name={name} type={type} required={required} min={min} max={max} step={step} accept={type === 'file' ? 'image/png,image/jpeg' : undefined}/></label>;
}
