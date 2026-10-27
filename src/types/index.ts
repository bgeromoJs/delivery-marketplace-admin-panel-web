export type Role = 'ADMIN' | 'SELLER' | 'COURIER' | 'CUSTOMER';

export type OrderStatus =
  | 'CREATED'
  | 'PAID'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TenantTheme {
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl: string;
  primaryColor: string;
  secondaryColor: string;
  deliveryFee: number;
  deliveryTimeMin: number;
  address: string;
  phone: string;
  rating: number;
  description?: string;
  status?: string;
}

export interface Dish {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  preparationTimeMin: number;
  /** Esforço de cozinha por unidade, em minutos. */
  effortMinutes: number;
}

export interface AvailabilityWindow {
  date: string;
  window: string;
  start: string;
  end: string;
  availableStart?: string | null;
  availableEnd?: string | null;
  remainingMinutes: number;
  available: boolean;
  recommended: boolean;
}

export interface OrderAvailability {
  effortMinutes: number;
  windows: AvailabilityWindow[];
}

/** Pedido na agenda pública de produção, sem dados pessoais. */
export interface AgendaEntry {
  /** Posição na fila do dia, começando em 1. */
  position: number;
  /** Número curto do pedido. */
  number?: string | null;
  status: OrderStatus;
  origin: 'APP' | 'COUNTER' | string;
  /** Janela reservada, por exemplo 18:00-23:00. */
  window?: string | null;
  start?: string | null;
  end?: string | null;
  effortMinutes: number;
  items: AgendaItem[];
}

export interface AgendaItem {
  name: string;
  qty: number;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  optionsJson?: string;
  effortMinutes?: number;
}

export interface Order {
  id: string;
  /** Número curto exibido ao cliente e usado na agenda pública. */
  orderNumber?: string | null;
  tenantId: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  courierId?: string;
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  /** Início da fila de preparo (ISO-8601); null enquanto o pedido não entrou. */
  preparingAt?: string | null;
  /** Janela reservada na agenda, por exemplo 18:00-23:00. */
  scheduledWindow?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  reservedEffortMinutes?: number | null;
}
