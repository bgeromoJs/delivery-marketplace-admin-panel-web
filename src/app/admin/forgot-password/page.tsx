'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { requestPasswordReset, resetPassword } from '@/lib/auth';
import { AdminThemeToggle } from '@/components/AdminThemeToggle';
import { useToast } from '@/components/ToastProvider';

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);
  const toast = useToast();

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setStatus('');
    try {
      const result = await requestPasswordReset(phone);
      setStatus(result.message);
      setCodeRequested(true);
      toast.success(result.message || 'Código de redefinição solicitado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível solicitar a redefinição.'); toast.apiError(e, 'Não foi possível solicitar a redefinição.'); }
    finally { setBusy(false); }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setStatus('');
    if (newPassword !== confirmation) { setError('As senhas não coincidem.'); return; }
    setBusy(true);
    try {
      await resetPassword(phone, code, newPassword);
      setStatus('Senha redefinida. Você já pode entrar com a nova senha.');
      toast.success('Senha redefinida. Você já pode entrar com a nova senha.');
      setCode(''); setNewPassword(''); setConfirmation(''); setCodeRequested(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.'); toast.apiError(e, 'Não foi possível redefinir a senha.'); }
    finally { setBusy(false); }
  }

  return <div className="admin-login-page">
    <AdminThemeToggle className="admin-login-theme-toggle" />
    <section className="admin-login-brand-panel">
      <span className="admin-login-orb login-orb-top" /><span className="admin-login-orb login-orb-bottom" />
      <div className="admin-login-brand"><span className="admin-login-mark">N</span><strong>[NOME DA PLATAFORMA]</strong></div>
      <div className="admin-login-brand-copy"><h2>Recupere o acesso à sua conta</h2><p>Vamos ajudar você a voltar ao painel.</p></div>
      <p className="admin-login-copyright">© [NOME DA PLATAFORMA]</p>
    </section>
    <section className="admin-login-form-panel">
      <main className="admin-login-main">
        <div><h1>Esqueci minha senha</h1><p className="admin-login-intro">Informe o celular cadastrado. Enviaremos um código por SMS.</p></div>
        <form className="admin-login-main" onSubmit={handleRequest}>
          <label className="admin-login-field">Celular<input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" required /></label>
          <button className="admin-login-submit" type="submit" disabled={busy}>{busy ? 'Aguarde…' : 'Solicitar redefinição'}</button>
        </form>
        {status && <p className="admin-reset-success" role="status">{status}</p>}
        {codeRequested && <form className="admin-login-main admin-reset-form" onSubmit={handleReset}>
          <label className="admin-login-field">Código recebido por SMS<input inputMode="numeric" autoComplete="one-time-code" maxLength={8} pattern="[0-9]{8}" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="8 dígitos" required /></label>
          <label className="admin-login-field">Nova senha<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} required /></label>
          <label className="admin-login-field">Confirme a nova senha<input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></label>
          <button className="admin-login-submit" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Redefinir senha'}</button>
        </form>}
        {error && <p className="admin-login-message" role="alert">{error}</p>}
        <Link className="admin-login-forgot" href="/admin/login">Voltar para entrar</Link>
      </main>
    </section>
  </div>;
}
