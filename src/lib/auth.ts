import { API_BASE_URL } from '@/lib/apiBaseUrl';
import { apiRequest, BusinessRuleError } from '@/lib/apiClient';

// All browser API calls use the gateway so CORS is configured in one place.
const ADMIN_SESSION_KEY = 'deliveryhub.admin.session';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPPORT' | 'SELLER' | 'COURIER' | 'CUSTOMER';
  tenantId?: string;
};

export type AuthSession = {
  token: string;
  tokenType: string;
  user: AuthUser;
};

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await authenticate(email, password);
  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPPORT') throw new BusinessRuleError('Esta conta não tem permissão para acessar o painel administrativo.');
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

const SELLER_SESSION_KEY = 'deliveryhub.seller.session';

export async function loginSeller(email: string, password: string): Promise<AuthSession> {
  const session = await authenticate(email, password);
  if (session.user.role !== 'SELLER' || !session.user.tenantId) {
    throw new BusinessRuleError('Esta conta não está vinculada a uma loja.');
  }
  window.localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session));
  return session;
}

async function authenticate(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!session?.token || !session.user?.role) throw new Error('O servidor retornou uma resposta de autenticação inválida.');
  return session;
}

function getValidSession(key: string, requiredRole: AuthUser['role']): AuthSession | null {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    const parts = session.token?.split('.');
    if (!parts || parts.length !== 3 || session.user?.role !== requiredRole || (requiredRole === 'SELLER' && !session.user.tenantId)) {
      window.localStorage.removeItem(key);
      return null;
    }
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');
    const payload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }
    return session;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

export function getSellerSession(): AuthSession | null {
  return getValidSession(SELLER_SESSION_KEY, 'SELLER');
}

export function clearSellerSession() {
  window.localStorage.removeItem(SELLER_SESSION_KEY);
}

export type PasswordResetRequestResult = { message: string };

export async function requestPasswordReset(phone: string): Promise<PasswordResetRequestResult> {
  return apiRequest<PasswordResetRequestResult>(`${API_BASE_URL}/api/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
}

export async function resetPassword(phone: string, code: string, password: string): Promise<void> {
  await apiRequest<void>(`${API_BASE_URL}/api/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code, password }),
  });
}

export function getAdminSession(): AuthSession | null {
  try {
    const value = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!value) return null;
    const session = JSON.parse(value) as AuthSession;
    const parts = session.token?.split('.');
    if (!parts || parts.length !== 3 || (session.user?.role !== 'ADMIN' && session.user?.role !== 'SUPPORT')) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    const base64Payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = base64Payload.padEnd(Math.ceil(base64Payload.length / 4) * 4, '=');
    const payload = JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event('deliveryhub:session-expired'));
}

export function updateAdminSessionUser(user: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'>) {
  const session = getAdminSession();
  if (!session || session.user.id !== user.id) return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ...session, user }));
  window.dispatchEvent(new Event('deliveryhub:session-updated'));
}
