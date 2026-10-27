export type ApiErrorBody = Record<string, unknown> | string | null;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: ApiErrorBody = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

function meaningfulText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || /^(bad request|internal server error|service unavailable|not found|forbidden|unauthorized)$/i.test(text)) return null;
  return text;
}

function validationMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === 'string') return [item.trim()].filter(Boolean);
      if (!item || typeof item !== 'object') return [];
      const field = meaningfulText((item as Record<string, unknown>).field || (item as Record<string, unknown>).property);
      const message = meaningfulText((item as Record<string, unknown>).defaultMessage || (item as Record<string, unknown>).message || (item as Record<string, unknown>).reason);
      return message ? [field ? `${field}: ${message}` : message] : [];
    });
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([field, message]) => {
      const text = meaningfulText(message);
      return text ? [`${field}: ${text}`] : [];
    });
  }
  return [];
}

function statusFallback(status: number): string {
  if (status === 400) return 'Confira os campos informados e tente novamente.';
  if (status === 401) return 'Sua sessão expirou ou as credenciais são inválidas.';
  if (status === 403) return 'Você não tem permissão para realizar esta ação.';
  if (status === 404) return 'O registro ou serviço solicitado não foi encontrado.';
  if (status === 409) return 'Esta ação entrou em conflito com os dados atuais.';
  if (status === 422) return 'Os dados enviados não passaram pela validação.';
  if (status === 429) return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  if (status >= 500) return 'O servidor está com problemas para processar sua solicitação. Tente novamente.';
  return `Não foi possível concluir a solicitação (HTTP ${status}).`;
}

async function readBody(response: Response): Promise<ApiErrorBody> {
  const text = await response.text().catch(() => '');
  if (!text.trim()) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    // Some services return a plain text diagnostic.
  }
  return text;
}

export function messageFromApiBody(body: ApiErrorBody, status: number): string {
  if (typeof body === 'string') return meaningfulText(body) || statusFallback(status);
  if (body) {
    const record = body as Record<string, unknown>;
    const messages = [
      meaningfulText(record.message),
      meaningfulText(record.detail),
      meaningfulText(record.title),
      meaningfulText(record.error),
      ...validationMessages(record.errors),
      ...validationMessages(record.violations),
    ].filter((message): message is string => Boolean(message));
    if (messages.length) return [...new Set(messages)].join(' · ');
  }
  return statusFallback(status);
}

export async function apiRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique se o gateway e os serviços estão ativos.');
  }

  if (!response.ok) {
    const body = await readBody(response);
    throw new ApiError(response.status, messageFromApiBody(body, response.status), body);
  }
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text.trim()) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(response.status, 'O servidor retornou uma resposta inválida.');
  }
}

export function getApiErrorFeedback(error: unknown, fallback = 'Não foi possível concluir a solicitação.') {
  const warning = error instanceof BusinessRuleError || (error instanceof ApiError && [400, 409, 422].includes(error.status));
  return { kind: warning ? 'warning' as const : 'error' as const, message: error instanceof Error ? error.message : fallback };
}
