import { clearAdminSession, getAdminSession } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/apiBaseUrl';
import { ApiError, apiRequest } from '@/lib/apiClient';
import type { Order } from '@/types';

export type AdminTenant = {
  id: string; name: string; slug: string; status: string; description?: string;
  logoUrl?: string; bannerUrl?: string; primaryColor?: string; secondaryColor?: string;
  deliveryFee?: number; deliveryTimeMin?: number; vendorAcceptTimeoutMinutes?: number; deliveryRadiusKm?: number; address?: string; phone?: string;
  legalName?: string; document?: string; city?: string; state?: string;
  ownerName?: string; ownerEmail?: string; ownerPhone?: string;
};
export type AdminUser = { id: string; name: string; email: string; phone?: string; role: string; tenantId?: string; active: boolean; createdAt?: string };
export type PlatformSettings = {
  paymentProposalValidityHours: number;
  orderWithoutCourierAlertMinutes: number;
  storeLinkDomain: string;
};
export type AdminAuditEntry = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  target: string;
  description?: string;
  createdAt: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = typeof window === 'undefined' ? null : getAdminSession();
  try {
    return await apiRequest<T>(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `${session.tokenType || 'Bearer'} ${session.token}` } : {}), ...init.headers },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && typeof window !== 'undefined') {
      clearAdminSession();
      if (window.location.pathname !== '/admin/login') {
        window.location.replace('/admin/login');
      }
    }
    throw error;
  }
}

export const adminApi = {
  tenants: () => request<AdminTenant[]>('/api/tenants?all=true'),
  tenant: (id: string) => request<AdminTenant>(`/api/tenants/id/${id}`),
  createTenant: (tenant: Partial<AdminTenant>) => request<AdminTenant>('/api/tenants', { method: 'POST', body: JSON.stringify(tenant) }),
  updateTenant: (id: string, tenant: Partial<AdminTenant>) => request<AdminTenant>(`/api/tenants/${id}`, { method: 'PUT', body: JSON.stringify(tenant) }),
  tenantStatus: (id: string, status: string) => request<AdminTenant>(`/api/tenants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  orders: () => request<Order[]>('/api/orders'),
  order: (id: string) => request<Order>(`/api/orders/${id}`),
  orderStatus: (id: string, status: string, courierId?: string) => request<Order>(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...(courierId ? { courierId } : {}) }) }),
  users: () => request<AdminUser[]>('/api/auth/users'),
  user: (id: string) => request<AdminUser>(`/api/auth/users/${id}`),
  updateUser: (id: string, user: Pick<AdminUser, 'name' | 'email'> & { phone?: string }) => request<AdminUser>(`/api/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  createAdminUser: (user: { name: string; email: string; password: string; phone?: string; role: string; tenantId?: string | null; active?: boolean }) => request<AdminUser>('/api/auth/admin/users', { method: 'POST', body: JSON.stringify(user) }),
  updateAdminUser: (id: string, user: { name: string; email: string; password?: string; phone?: string; role: string; tenantId?: string | null; active?: boolean }) => request<AdminUser>(`/api/auth/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  setUserActive: (id: string, active: boolean) => request<AdminUser>(`/api/auth/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  createUser: (user: { name: string; email: string; password: string; phone?: string; role: string; tenantId?: string }) => request<unknown>('/api/auth/register', { method: 'POST', body: JSON.stringify(user) }),
  linkSellerAccount: (userId: string, tenantId: string) => request<AdminUser>(`/api/auth/admin/users/${userId}/seller-link`, { method: 'POST', body: JSON.stringify({ tenantId }) }),
  createTeamMember: (user: { name: string; email: string; password: string; phone?: string }) => request<AdminUser>('/api/auth/admin/team', { method: 'POST', body: JSON.stringify({ ...user, role: 'ADMIN' }) }),
  platformSettings: () => request<PlatformSettings>('/api/auth/admin/settings'),
  updatePlatformSettings: (settings: PlatformSettings) => request<PlatformSettings>('/api/auth/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  auditEntries: () => request<AdminAuditEntry[]>('/api/auth/admin/audit'),
  createAuditEntry: (entry: Pick<AdminAuditEntry, 'action' | 'target'> & { description?: string }) => request<AdminAuditEntry>('/api/auth/admin/audit', { method: 'POST', body: JSON.stringify(entry) }),
};

export function tenantStatusLabel(status: string) { return ({ ACTIVE: 'Ativo', PENDING: 'Pendente', SUSPENDED: 'Suspenso' } as Record<string, string>)[status] || status; }
export const userRoleLabels: Record<string, string> = {
  ADMIN: 'Administrador do sistema',
  SUPPORT: 'Analista de suporte',
  SELLER: 'Vendedor',
  COURIER: 'Entregador',
  CUSTOMER: 'Cliente',
};
export function userRoleLabel(role: string) { return userRoleLabels[role] || role; }
export function orderStatusLabel(status: string) { return ({ CREATED: 'Criado', PAID: 'Pago', ACCEPTED: 'Aceito', PREPARING: 'Em preparo', READY: 'Pronto', PICKED_UP: 'A caminho', DELIVERED: 'Entregue', CANCELLED: 'Cancelado' } as Record<string, string>)[status] || status; }
