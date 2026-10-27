const STORAGE_PREFIX = 'deliveryhub.customer.orders';

/**
 * Números de pedidos feitos neste navegador, separados por loja.
 * Usados para destacar "Seu pedido" na agenda pública, que não expõe dados pessoais.
 */
function storageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}:${tenantId}`;
}

export function getMyOrderNumbers(tenantId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  } catch {
    return [];
  }
}

export function rememberOrderNumber(tenantId: string, orderNumber?: string | null): void {
  if (typeof window === 'undefined' || !orderNumber) return;
  const number = orderNumber.trim();
  if (!number) return;
  try {
    const numbers = getMyOrderNumbers(tenantId);
    if (numbers.includes(number)) return;
    const next = [...numbers, number].slice(-20);
    window.localStorage.setItem(storageKey(tenantId), JSON.stringify(next));
  } catch {
    // localStorage pode estar bloqueado (modo privado); o destaque é opcional.
  }
}
