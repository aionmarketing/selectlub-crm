"use client";

import { useEffect, useState, useCallback } from "react";
import type { Lead, Stats, CRMData } from "@/lib/types";

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

function waLink(phone: string | null): string {
  if (!phone) return "#";
  const clean = phone.replace(/\D/g, "");
  const num = clean.startsWith("55") ? clean : `55${clean}`;
  return `https://wa.me/${num}`;
}

// ─── status & unit config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  novo: {
    label: "Novo",
    color: "text-zinc-300",
    bg: "bg-zinc-800",
    dot: "bg-zinc-400",
  },
  em_conversa: {
    label: "Em conversa",
    color: "text-blue-300",
    bg: "bg-blue-950/60",
    dot: "bg-blue-400",
  },
  agendado: {
    label: "Agendado",
    color: "text-emerald-300",
    bg: "bg-emerald-950/60",
    dot: "bg-emerald-400",
  },
  concluido: {
    label: "Concluído",
    color: "text-green-300",
    bg: "bg-green-950/60",
    dot: "bg-green-500",
  },
  perdido: {
    label: "Perdido",
    color: "text-red-300",
    bg: "bg-red-950/40",
    dot: "bg-red-400",
  },
};

const UNIT_CONFIG: Record<string, { label: string; color: string }> = {
  sao_judas: { label: "São Judas", color: "text-orange-300" },
  santa_terezinha: { label: "Sta. Terezinha", color: "text-purple-300" },
};

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

// ─── sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  accent,
}: {
  value: number | string;
  label: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
      <p className={`text-3xl font-bold tracking-tight ${accent ?? "text-white"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.novo;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const grad = avatarColor(lead.jid);
  const unit = lead.unit_preference ? UNIT_CONFIG[lead.unit_preference] : null;
  const vehicle = [lead.vehicle_model, lead.vehicle_type]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr className="group border-b border-zinc-800/50 transition-colors hover:bg-zinc-900/60">
      {/* avatar + name */}
      <td className="py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${grad}`}
          >
            {initials(lead.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {lead.name ?? <span className="italic text-zinc-500">Desconhecido</span>}
            </p>
            <p className="text-xs text-zinc-500">{fmtPhone(lead.phone)}</p>
          </div>
        </div>
      </td>

      {/* service */}
      <td className="px-3 py-3">
        <p className="text-sm text-zinc-200">
          {lead.service_interest ?? (
            <span className="text-zinc-600">—</span>
          )}
        </p>
        {vehicle && <p className="text-xs text-zinc-500">{vehicle}</p>}
      </td>

      {/* unit */}
      <td className="px-3 py-3">
        {unit ? (
          <span className={`text-xs font-medium ${unit.color}`}>
            {unit.label}
          </span>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
      </td>

      {/* status */}
      <td className="px-3 py-3">
        <StatusBadge status={lead.status} />
      </td>

      {/* time */}
      <td className="px-3 py-3 text-right text-xs text-zinc-500">
        {timeAgo(lead.last_message_at ?? lead.created_at)}
      </td>

      {/* actions */}
      <td className="py-3 pl-3 pr-4 text-right">
        <a
          href={waLink(lead.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 opacity-0 transition-all hover:border-emerald-600 hover:bg-emerald-950/60 hover:text-emerald-300 group-hover:opacity-100"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          Chamar
        </a>
      </td>
    </tr>
  );
}

// ─── pipeline kanban ──────────────────────────────────────────────────────────

function PipelineCol({
  title,
  statusKey,
  leads,
  accent,
}: {
  title: string;
  statusKey: string;
  leads: Lead[];
  accent: string;
}) {
  const filtered = leads.filter((l) => l.status === statusKey);
  return (
    <div className="flex min-w-[220px] flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>
          {title}
        </span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-300">
          {filtered.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto p-3" style={{ maxHeight: 420 }}>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-zinc-600">Nenhum lead</p>
        )}
        {filtered.map((lead) => {
          const grad = avatarColor(lead.jid);
          const unit = lead.unit_preference ? UNIT_CONFIG[lead.unit_preference] : null;
          return (
            <a
              key={lead.jid}
              href={waLink(lead.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border border-zinc-800 bg-zinc-900 p-3 transition-all hover:border-zinc-600 hover:bg-zinc-800"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white ${grad}`}
                >
                  {initials(lead.name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-zinc-100">
                    {lead.name ?? "Desconhecido"}
                  </p>
                  <p className="text-[10px] text-zinc-500">{fmtPhone(lead.phone)}</p>
                </div>
              </div>
              {lead.service_interest && (
                <p className="mt-2 text-[11px] text-zinc-400">{lead.service_interest}</p>
              )}
              {lead.vehicle_model && (
                <p className="text-[11px] text-zinc-500">{lead.vehicle_model}</p>
              )}
              {unit && (
                <p className={`mt-1 text-[10px] font-medium ${unit.color}`}>
                  {unit.label}
                </p>
              )}
              <p className="mt-2 text-right text-[10px] text-zinc-600">
                {timeAgo(lead.last_message_at ?? lead.created_at)}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [data, setData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [view, setView] = useState<"list" | "pipeline">("list");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterUnit, setFilterUnit] = useState("todos");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json: CRMData = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(tick);
  }, []);

  const filteredLeads = (data?.leads ?? []).filter((l) => {
    if (filterStatus !== "todos" && l.status !== filterStatus) return false;
    if (filterUnit !== "todos" && l.unit_preference !== filterUnit) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.service_interest?.toLowerCase().includes(q) ||
        l.vehicle_model?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const s = data?.stats;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      {/* ── header ── */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-sm font-black text-white">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Select Lub</h1>
              <p className="text-[10px] text-zinc-500">CRM · WhatsApp Leads</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* live indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs text-zinc-500">
                Ao vivo · {countdown}s
              </span>
            </div>

            <button
              onClick={fetchData}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
            >
              ↻ Atualizar
            </button>

            {/* view toggle */}
            <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
              {(["list", "pipeline"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    view === v
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {v === "list" ? "Lista" : "Pipeline"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* ── stats ── */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <StatCard
            value={s?.total ?? "—"}
            label="Total de leads"
            accent="text-white"
          />
          <StatCard
            value={s?.hoje ?? "—"}
            label="Hoje"
            accent="text-orange-400"
          />
          <StatCard
            value={s?.novo ?? "—"}
            label="Novos"
            accent="text-zinc-300"
          />
          <StatCard
            value={s?.em_conversa ?? "—"}
            label="Em conversa"
            accent="text-blue-400"
          />
          <StatCard
            value={s?.agendado ?? "—"}
            label="Agendados"
            accent="text-emerald-400"
          />
          <StatCard
            value={s?.concluido ?? "—"}
            label="Concluídos"
            accent="text-green-400"
          />
        </div>

        {/* ── units split ── */}
        {s && (s.sao_judas > 0 || s.santa_terezinha > 0) && (
          <div className="mb-6 flex gap-3">
            <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-300">São Judas</span>
                <span className="text-xl font-bold text-white">{s.sao_judas}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                Rua Saldanha Marinho, 1651 · (19) 3374-2923
              </p>
            </div>
            <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-300">Sta. Terezinha</span>
                <span className="text-xl font-bold text-white">{s.santa_terezinha}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                Rua Nossa Sra. do Carmo, 670 · (19) 98910-3633
              </p>
            </div>
          </div>
        )}

        {/* ── error / loading ── */}
        {loading && (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
            Erro ao carregar dados: {error}
          </div>
        )}

        {!loading && data && (
          <>
            {/* ── filters ── */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                type="search"
                placeholder="Buscar por nome, telefone, serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-500"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-zinc-500"
              >
                <option value="todos">Todos os status</option>
                <option value="novo">Novo</option>
                <option value="em_conversa">Em conversa</option>
                <option value="agendado">Agendado</option>
                <option value="concluido">Concluído</option>
                <option value="perdido">Perdido</option>
              </select>

              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="h-9 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-200 outline-none focus:border-zinc-500"
              >
                <option value="todos">Todas as unidades</option>
                <option value="sao_judas">São Judas</option>
                <option value="santa_terezinha">Santa Terezinha</option>
              </select>

              <span className="ml-auto text-xs text-zinc-600">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* ── pipeline view ── */}
            {view === "pipeline" && (
              <div className="flex gap-3 overflow-x-auto pb-4">
                <PipelineCol
                  title="Novos"
                  statusKey="novo"
                  leads={filteredLeads}
                  accent="text-zinc-400"
                />
                <PipelineCol
                  title="Em Conversa"
                  statusKey="em_conversa"
                  leads={filteredLeads}
                  accent="text-blue-400"
                />
                <PipelineCol
                  title="Agendado"
                  statusKey="agendado"
                  leads={filteredLeads}
                  accent="text-emerald-400"
                />
                <PipelineCol
                  title="Concluído"
                  statusKey="concluido"
                  leads={filteredLeads}
                  accent="text-green-400"
                />
              </div>
            )}

            {/* ── list view ── */}
            {view === "list" && (
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/80">
                      <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Cliente
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Serviço / Veículo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Unidade
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Status
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Último contato
                      </th>
                      <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-16 text-center text-sm text-zinc-600"
                        >
                          Nenhum lead encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <LeadRow key={lead.jid} lead={lead} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── footer ── */}
            <p className="mt-4 text-center text-xs text-zinc-700">
              Atualizado {data.at ? new Date(data.at).toLocaleTimeString("pt-BR") : "—"} ·
              Próxima atualização em {countdown}s
            </p>
          </>
        )}
      </main>
    </div>
  );
}
