'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginSeller, getSellerSession } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

export default function SellerLoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getSellerSession()) router.replace('/vendedor');
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await loginSeller(String(form.get('email') || ''), String(form.get('password') || ''));
      toast.success('Login realizado com sucesso.');
      router.replace('/vendedor');
    } catch (error) {
      toast.apiError(error, 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="admin-login-page">
    <section className="admin-login-form-panel">
      <form className="admin-login-main" onSubmit={submit}>
        <div><h1>Acesso do vendedor</h1><p className="admin-login-intro">Entre com o e-mail e a senha cadastrados pelo administrador da plataforma.</p></div>
        <label className="admin-login-field">E-mail<input name="email" type="email" autoComplete="username" required /></label>
        <label className="admin-login-field">Senha<input name="password" type="password" autoComplete="current-password" required /></label>
        <button className="admin-login-submit" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar na loja'}</button>
      </form>
    </section>
  </div>;
}
