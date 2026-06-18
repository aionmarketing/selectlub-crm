"use client";

import { useEffect, useState, useCallback } from "react";
import { Lead, CRMData } from "@/lib/types";
import ConversationDrawer from "@/components/ConversationDrawer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPhone(phone: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return phone;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(jid: string): string {
  const gradients = [
    "from-orange-500 to-red-600",
    "from-blue-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < jid.length; i++) {
    hash = (hash * 31 + jid.charCodeAt(i)) >>> 0;
  }
  return gradients[hash % gradients.length];
}

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  agendado: "Agendado",
  concluido: "Concluído",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  em_conversa: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  agendado: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  concluido: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  perdido: "bg-red-500/20 text-red-300 border border-red-500/30",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-zinc-700 text-zinc-300 border border-zinc-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [data, setData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Falha ao carregar leads");
      const json: CRMData = await res.json();
      setData(json);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    const id = setInterval(fetchLeads, 30_000);
    return () => clearInterval(id);
  }, [fetchLeads]);

  const leads = data?.leads ?? [];

  // Derive unit options from leads
  const unitOptions = Array.from(
    new Set(leads.map((l) => l.unit_preference).filter(Boolean) as string[])
  );

  const filtered = leads.filter((l) => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (filterUnit && l.unit_preference !== filterUnit) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = [
        l.name,
        l.phone,
        l.service_interest,
        l.vehicle_model,
        l.vehicle_type,
        l.unit_preference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-white">Leads</h1>
          {data && (
            <span className="text-sm text-zinc-500 bg-zinc-800 px-2.5 py-0.5 rounded-full font-medium">
              {data.leads.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Atualizar
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, telefone, serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterUnit}
          onChange={(e) => setFilterUnit(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
        >
          <option value="">Todas as unidades</option>
          {unitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && leads.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <svg className="w-8 h-8 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="ml-3 text-zinc-500">Carregando leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-14 h-14 text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-zinc-400 font-medium mb-1">Nenhum lead ainda.</p>
            <p className="text-zinc-600 text-sm">Envie /fernando no WhatsApp para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/80 sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Cliente
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Serviço / Veículo
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Unidade
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Status
                  </th>
                  <th className="text-center text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Msgs
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    Último contato
                  </th>
                  <th className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide px-4 py-3 border-b border-zinc-800">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-zinc-500">
                      Nenhum lead encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => (
                    <tr
                      key={lead.jid}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-zinc-900/60 cursor-pointer transition-colors group"
                    >
                      {/* Cliente */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(lead.jid)} flex items-center justify-center shrink-0`}
                          >
                            <span className="text-white text-xs font-bold">
                              {initials(lead.name)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-zinc-100 font-medium truncate max-w-[160px]">
                              {lead.name ?? "Sem nome"}
                            </p>
                            <p className="text-zinc-500 text-xs">{fmtPhone(lead.phone)}</p>
                          </div>
                        </div>
                      </td>
                      {/* Serviço / Veículo */}
                      <td className="px-4 py-3">
                        <p className="text-zinc-200 truncate max-w-[180px]">
                          {lead.service_interest ?? "—"}
                        </p>
                        {(lead.vehicle_type || lead.vehicle_model) && (
                          <p className="text-zinc-500 text-xs truncate max-w-[180px]">
                            {[lead.vehicle_type, lead.vehicle_model].filter(Boolean).join(" ")}
                          </p>
                        )}
                      </td>
                      {/* Unidade */}
                      <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                        {lead.unit_preference ?? "—"}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      {/* Msgs */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-zinc-400 tabular-nums">
                          {lead.message_count ?? "—"}
                        </span>
                      </td>
                      {/* Último contato */}
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {timeAgo(lead.last_message_at)}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLead(lead);
                          }}
                          className="text-xs font-medium text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100"
                        >
                          Ver conversa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversation Drawer */}
      <ConversationDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </div>
  );
}
