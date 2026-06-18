"use client";

import { useEffect, useState, useCallback } from "react";
import type { Lead, Stats, CRMData, ReportsData, ServiceRow } from "@/lib/types";

const REFRESH_INTERVAL = 30;

// ─── helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function fmtPhone(phone: string | null): string {
  if (!phone) return "—";
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "from-orange-500 to-red-600",
  "from-blue-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

function avatarColor(jid: string): string {
  let hash = 0;
  for (let i = 0; i < jid.length; i++) hash = jid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  novo: {
    label: "Novo",
    color: "text-zinc-300",
    bg: "bg-zinc-800",
  },
  em_conversa: {
    label: "Em conversa",
    color: "text-blue-300",
    bg: "bg-blue-950/60",
  },
  agendado: {
    label: "Agendado",
    color: "text-emerald-300",
    bg: "bg-emerald-950/60",
  },
  handoff: {
    label: "Handoff",
    color: "text-orange-300",
    bg: "bg-orange-950/60",
  },
  concluido: {
    label: "Concluído",
    color: "text-green-400",
    bg: "bg-green-950/60",
  },
  perdido: {
    label: "Perdido",
    color: "text-red-400",
    bg: "bg-red-950/40",
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.novo;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [crmData, setCrmData] = useState<CRMData | null>(null);
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  const fetchAll = useCallback(async () => {
    try {
      const [leadsRes, reportsRes] = await Promise.all([
        fetch("/api/leads", { cache: "no-store" }),
        fetch("/api/reports", { cache: "no-store" }),
      ]);
      if (!leadsRes.ok) throw new Error(`Leads API: ${leadsRes.status}`);
      if (!reportsRes.ok) throw new Error(`Reports API: ${reportsRes.status}`);
      const [leadsJson, reportsJson] = await Promise.all([
        leadsRes.json() as Promise<CRMData>,
        reportsRes.json() as Promise<ReportsData>,
      ]);
      setCrmData(leadsJson);
      setReports(reportsJson);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? "Erro desconhecido");
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  // initial fetch + auto-refresh
  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // countdown ticker
  useEffect(() => {
    const tick = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : REFRESH_INTERVAL)),
      1000
    );
    return () => clearInterval(tick);
  }, []);

  const s = crmData?.stats;
  const leads = crmData?.leads ?? [];
  const recentLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.last_message_at ?? b.created_at).getTime() -
        new Date(a.last_message_at ?? a.created_at).getTime()
    )
    .slice(0, 5);

  const byService: ServiceRow[] = reports?.byService ?? [];
  const maxService = byService.reduce((m, r) => Math.max(m, r.total), 0);

  // ── loading ──
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      {/* ── 1. Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Visão geral dos leads WhatsApp</p>
        </div>

        <div className="flex items-center gap-4">
          {/* live indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-zinc-400">
              Ao vivo &middot; {countdown}s
            </span>
          </div>

          {/* last updated */}
          {crmData?.at && (
            <span className="text-xs text-zinc-600">
              Atualizado{" "}
              {new Date(crmData.at).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* ── error banner ──────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* ── 2. Stats grid ─────────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {/* Total */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-white">
            {s?.total ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Total leads</p>
        </div>

        {/* Hoje */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-orange-400">
            {s?.hoje ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Hoje</p>
        </div>

        {/* Novos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-zinc-300">
            {s?.novo ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Novos</p>
        </div>

        {/* Em conversa */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-blue-400">
            {s?.em_conversa ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Em conversa</p>
        </div>

        {/* Agendados */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-emerald-400">
            {s?.agendado ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Agendados</p>
        </div>

        {/* Concluídos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-orange-400">
            {s?.handoff ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Handoff</p>
        </div>

        {/* Concluídos */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
          <p className="text-3xl font-bold tracking-tight text-green-400">
            {s?.concluido ?? "—"}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-400">Concluídos</p>
        </div>
      </div>

      {/* ── 3. Two-column section ─────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Últimos leads */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Últimos leads</h2>
            <p className="mt-0.5 text-xs text-zinc-500">5 contatos mais recentes</p>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {leads.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-zinc-500">
                  Nenhum lead ainda. Envie{" "}
                  <span className="font-mono font-semibold text-orange-400">/fernando</span>{" "}
                  no WhatsApp para iniciar.
                </p>
              </div>
            ) : (
              recentLeads.map((lead) => {
                const grad = avatarColor(lead.jid);
                return (
                  <div
                    key={lead.jid}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    {/* avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${grad}`}
                    >
                      {initials(lead.name)}
                    </div>

                    {/* info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-100">
                        {lead.name ?? (
                          <span className="italic text-zinc-500">Desconhecido</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {fmtPhone(lead.phone)}
                        {lead.service_interest && (
                          <span className="ml-2 text-zinc-600">
                            · {lead.service_interest}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* status + time */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={lead.status} />
                      <span className="text-xs text-zinc-600">
                        {timeAgo(lead.last_message_at ?? lead.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Por serviço */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="border-b border-zinc-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-100">Por serviço</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Distribuição de interesse</p>
          </div>

          <div className="space-y-3 px-5 py-4">
            {byService.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">
                Sem dados de serviço ainda.
              </p>
            ) : (
              byService.map((row) => {
                const pct =
                  maxService > 0
                    ? Math.round((row.total / maxService) * 100)
                    : 0;
                return (
                  <div key={row.service}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-300">
                        {row.service}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">
                        {row.total}
                      </span>
                    </div>
                    {/* bar track */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-orange-500/20">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Units split ────────────────────────────────────────────────── */}
      {s && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* São Judas */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-orange-300">São Judas</p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Rua Saldanha Marinho, 1651 · (19) 3374-2923
                </p>
              </div>
              <span className="text-4xl font-bold tracking-tight text-white">
                {s.sao_judas}
              </span>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-orange-500/70 transition-all duration-500"
                style={{
                  width:
                    s.total > 0
                      ? `${Math.round((s.sao_judas / s.total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-zinc-600">
              {s.total > 0
                ? `${Math.round((s.sao_judas / s.total) * 100)}% do total`
                : "—"}
            </p>
          </div>

          {/* Santa Terezinha */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-purple-300">Santa Terezinha</p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Rua Nossa Sra. do Carmo, 670 · (19) 98910-3633
                </p>
              </div>
              <span className="text-4xl font-bold tracking-tight text-white">
                {s.santa_terezinha}
              </span>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-purple-500/70 transition-all duration-500"
                style={{
                  width:
                    s.total > 0
                      ? `${Math.round((s.santa_terezinha / s.total) * 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-1 text-right text-xs text-zinc-600">
              {s.total > 0
                ? `${Math.round((s.santa_terezinha / s.total) * 100)}% do total`
                : "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
