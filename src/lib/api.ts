import { AgendaEntry, Dish, Order, OrderAvailability, TenantTheme } from '@/types';
import { API_BASE_URL } from './apiBaseUrl';
import { apiRequest } from './apiClient';

export const api = {
  // Tenant
  async getTenants(): Promise<TenantTheme[]> {
    return apiRequest<TenantTheme[]>(`${API_BASE_URL}/api/tenants`, { cache: 'no-store' });
  },

  async getTenantBySlug(slug: string): Promise<TenantTheme> {
    return apiRequest<TenantTheme>(`${API_BASE_URL}/api/tenants/${encodeURIComponent(slug)}`, { cache: 'no-store' });
  },

  async getTenantById(tenantId: string): Promise<TenantTheme> {
    const tenant = await apiRequest<Record<string, unknown> & { id: string }>(`${API_BASE_URL}/api/tenants/id/${tenantId}`, { cache: 'no-store' });
    return { ...tenant, tenantId: tenant.id } as unknown as TenantTheme;
  },

  // Catalog
  async getDishes(tenantId: string): Promise<Dish[]> {
    return apiRequest<Dish[]>(`${API_BASE_URL}/api/catalog/tenants/${tenantId}/dishes`, { cache: 'no-store' });
  },

  async updateStoreDish(
    dishId: string,
    data: { effortMinutes?: number; active?: boolean; name?: string; price?: number },
  ): Promise<void> {
    await apiRequest(`${API_BASE_URL}/api/store/me/dishes/${dishId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Orders
  async getOrdersByTenant(tenantId: string): Promise<Order[]> {
    return apiRequest<Order[]>(`${API_BASE_URL}/api/orders/tenant/${tenantId}`, { cache: 'no-store' });
  },

  /** Agenda pública de produção do dia, na ordem de execução. */
  async getAgenda(tenantId: string, date?: string): Promise<AgendaEntry[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiRequest<AgendaEntry[]>(
      `${API_BASE_URL}/api/orders/tenant/${tenantId}/agenda${query}`,
      { cache: 'no-store' },
    );
  },

  async getAvailableDeliveries(): Promise<Order[]> {
    return apiRequest<Order[]>(`${API_BASE_URL}/api/orders/available-deliveries`, { cache: 'no-store' });
  },

  async createOrder(data: {
    tenantId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    paymentMethod: 'PIX' | 'CREDIT_CARD';
    notes?: string;
    deliveryFee: number;
    scheduledDate?: string;
    scheduledWindow?: string;
    items: {
      dishId: string;
      dishName: string;
      quantity: number;
      unitPrice: number;
      optionsJson?: string;
      effortMinutes?: number;
    }[];
  }): Promise<Order> {
    return apiRequest<Order>(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async getOrderAvailability(data: {
    tenantId: string;
    items: { dishId: string; quantity: number; effortMinutes?: number }[];
  }): Promise<OrderAvailability> {
    return apiRequest<OrderAvailability>(`${API_BASE_URL}/api/orders/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateOrderStatus(orderId: string, status: string, courierId?: string): Promise<Order> {
    return apiRequest<Order>(`${API_BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(courierId ? { courierId } : {}) }),
    });
  },
};
