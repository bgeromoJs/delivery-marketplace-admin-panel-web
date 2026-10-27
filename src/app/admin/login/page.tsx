'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSession, login } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';
import { AdminThemeToggle } from '@/components/AdminThemeToggle';

export default function AdminLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (getAdminSession()) router.replace('/admin');
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await login(String(form.get('email') || ''), String(form.get('password') || ''));
      toast.success('Login realizado com sucesso.');
      router.replace('/admin');
    } catch (error) {
      toast.apiError(error, 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-login-page">
      <AdminThemeToggle className="admin-login-theme-toggle" />
      <section className="admin-login-brand-panel">
        <span className="admin-login-orb login-orb-top" /><span className="admin-login-orb login-orb-bottom" />
        <div className="admin-login-brand"><span className="admin-login-mark">N</span><strong>[NOME DA PLATAFORMA]</strong></div>
        <div className="admin-login-brand-copy"><h2>Lojas, entregas e pedidos em um só lugar</h2><p>Painel de suporte e administração.</p></div>
        <p className="admin-login-copyright">© [NOME DA PLATAFORMA]</p>
      </section>
      <section className="admin-login-form-panel">
        <form className="admin-login-main" onSubmit={handleSubmit}>
          <div><h1>Entrar</h1><p className="admin-login-intro">Acesse com seu e-mail e senha.</p></div>
          <label className="admin-login-field">E-mail<input type="email" name="email" autoComplete="username" placeholder="voce@[dominio]" required /></label>
          <label className="admin-login-field">Senha<input type="password" name="password" autoComplete="current-password" placeholder="Sua senha" required /></label>
          <Link className="admin-login-forgot" href="/admin/forgot-password">Esqueci minha senha</Link>
          <button className="admin-login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button>
          <p className="admin-login-help">Problemas para acessar? Fale com um administrador.</p>
          <Link className="admin-login-forgot" href="/vendedor/login">Acesso do vendedor</Link>
        </form>
      </section>
    </div>
  );
}
