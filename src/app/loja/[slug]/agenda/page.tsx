'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  ListOrdered,
  RefreshCw,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getMyOrderNumbers } from '@/lib/myOrders';
import { useToast } from '@/components/ToastProvider';
import { AgendaEntry, OrderStatus, TenantTheme } from '@/types';

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  CREATED: { label: 'Criado', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  PAID: { label: 'Aguardando aceite', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  ACCEPTED: { label: 'Aceito', badge: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  PREPARING: { label: 'Em preparo', badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500 animate-pulse' },
  READY: { label: 'Pronto', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  PICKED_UP: { label: 'Saiu para entrega', badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  DELIVERED: { label: 'Entregue', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayInput(): string {
  return toDateInput(new Date());
}

function shiftDate(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return toDateInput(parsed);
}

function formatDayLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  const label = parsed.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatTime(iso?: string | null): string {
  if (!iso) return '--:--';
  const time = iso.includes('T') ? iso.split('T')[1] : iso;
  return time.slice(0, 5);
}

function formatEffort(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}min`;
}

function statusMeta(status: OrderStatus | string) {
  return STATUS_META[status] ?? { label: status, badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
}

export default function StoreAgendaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const toast = useToast();

  const [tenant, setTenant] = useState<TenantTheme | null>(null);
  const [date, setDate] = useState<string>(() => todayInput());
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [myNumbers, setMyNumbers] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    async function loadTenant() {
      try {
        const loaded = await api.getTenantBySlug(slug);
        if (!active) return;
        setTenant(loaded);
        setMyNumbers(getMyOrderNumbers(loaded.tenantId));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados da loja.');
        setLoading(false);
        toast.apiError(err, 'Não foi possível carregar os dados da loja.');
      }
    }
    loadTenant();
    return () => { active = false; };
  }, [slug, toast, reloadKey]);

  useEffect(() => {
    if (!tenant) return;
    const tenantId = tenant.tenantId;
    let active = true;

    async function loadAgenda(background: boolean) {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const result = await api.getAgenda(tenantId, date);
        if (!active) return;
        setEntries(result);
        setError(null);
        setLastUpdated(new Date());
        setMyNumbers(getMyOrderNumbers(tenantId));
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Não foi possível carregar a agenda da cozinha.');
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadAgenda(false);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadAgenda(true);
    }, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [tenant, date, reloadKey]);

  const totalEffort = entries.reduce((sum, entry) => sum + (entry.effortMinutes ?? 0), 0);
  const inKitchen = entries.filter((entry) => entry.status === 'PREPARING' || entry.status === 'ACCEPTED').length;
  const ownEntries = entries.filter((entry) => entry.number && myNumbers.includes(entry.number));
  const isToday = date === todayInput();

  return (
    <div className="min-h-screen pb-20">
      <div className="bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Link
            href={`/loja/${slug}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao cardápio
          </Link>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <ChefHat className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">Agenda da cozinha</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {tenant ? tenant.name : error ? 'Loja indisponível' : 'Carregando loja…'}
                </h1>
                <p className="text-sm text-gray-300 mt-1">
                  Acompanhe a ordem de execução dos pedidos do dia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span className={`w-2 h-2 rounded-full ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              {refreshing
                ? 'Atualizando…'
                : lastUpdated
                  ? `Atualizado às ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Atualiza a cada 30 s'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        {/* Seletor de dia */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Dia selecionado</p>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-950">{formatDayLabel(date)}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDate((current) => shiftDate(current, -1))}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => event.target.value && setDate(event.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  aria-label="Escolher dia da agenda"
                />
              </div>

              <button
                type="button"
                onClick={() => setDate((current) => shiftDate(current, 1))}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {!isToday && (
                <button
                  type="button"
                  onClick={() => setDate(todayInput())}
                  className="px-3 py-2 rounded-xl bg-gray-950 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  Hoje
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <ListOrdered className="w-3.5 h-3.5" /> Pedidos
              </span>
              <strong className="block text-xl text-gray-950 mt-1">{entries.length}</strong>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Flame className="w-3.5 h-3.5" /> Na cozinha
              </span>
              <strong className="block text-xl text-gray-950 mt-1">{inKitchen}</strong>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Clock className="w-3.5 h-3.5" /> Esforço
              </span>
              <strong className="block text-xl text-gray-950 mt-1">{formatEffort(totalEffort)}</strong>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-500">
                <Sparkles className="w-3.5 h-3.5" /> Seus pedidos
              </span>
              <strong className="block text-xl text-rose-700 mt-1">{ownEntries.length}</strong>
            </div>
          </div>
        </div>

        {/* Erro de carregamento */}
        {error && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            <div className="flex items-start gap-2 flex-1">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Lista da agenda */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-3" aria-label="Carregando agenda">
              {[0, 1, 2].map((index) => (
                <div key={index} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100" />
                    <div className="h-4 w-32 rounded bg-gray-100" />
                    <div className="h-5 w-24 rounded-full bg-gray-100 ml-auto" />
                  </div>
                  <div className="h-3 w-2/3 rounded bg-gray-100 mt-4" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 && !error ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
                <UtensilsCrossed className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-950">Nenhum pedido em produção</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Não há pedidos agendados para {isToday ? 'hoje' : formatDayLabel(date).toLowerCase()}.
                Escolha outro dia ou acompanhe a loja pelo cardápio.
              </p>
              <Link
                href={`/loja/${slug}`}
                className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                <Store className="w-4 h-4" />
                Ver cardápio
              </Link>
            </div>
          ) : (
            <ol className="relative space-y-3">
              {entries.map((entry) => {
                const meta = statusMeta(entry.status);
                const own = Boolean(entry.number && myNumbers.includes(entry.number));
                const itemsSummary = entry.items
                  .map((item) => `${item.qty}× ${item.name}`)
                  .join(' · ');

                return (
                  <li
                    key={`${entry.position}-${entry.number ?? entry.start ?? 'pedido'}`}
                    className={`relative rounded-2xl border p-4 sm:p-5 transition-colors ${
                      own
                        ? 'bg-white border-rose-300 ring-2 ring-rose-100'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:w-14 shrink-0">
                        <span className="w-9 h-9 rounded-full bg-gray-950 text-white text-sm font-black flex items-center justify-center">
                          {entry.position}º
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:mt-1">
                          na fila
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-extrabold text-gray-950">
                            Pedido #{entry.number ?? '—'}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                          {own && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                              <Sparkles className="w-3 h-3" />
                              Seu pedido
                            </span>
                          )}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                            {entry.origin === 'COUNTER' ? 'Balcão' : 'App'}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {formatTime(entry.start)} – {formatTime(entry.end)}
                          </span>
                          {entry.window && (
                            <span>Janela {entry.window}</span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            {formatEffort(entry.effortMinutes ?? 0)} de cozinha
                          </span>
                        </div>

                        {itemsSummary && (
                          <p className="mt-2 text-sm text-gray-700">
                            {itemsSummary}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          A agenda mostra apenas número, status, horários e itens dos pedidos. Nome, telefone,
          endereço e valores não são exibidos.
        </p>
      </div>
    </div>
  );
}
