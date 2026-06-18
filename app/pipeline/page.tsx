"use client";

import { useEffect, useState, useCallback } from "react";
import { Lead, CRMData } from "@/lib/types";
import ConversationDrawer from "@/components/ConversationDrawer";

// === FILE: app/pipeline/page.tsx ===

const STATUSES = [
  { key: "novo", label: "Novo", color: "text-zinc-400", border: "border-zinc-400/30" },
  { key: "em_conversa", label: "Em Conversa", color: "text-blue-400", border: "border-blue-400/30" },
  { key: "agendado", label: "Agendado", color: "text-emerald-400", border: "border-emerald-400/30" },
  { key: "handoff", label: "Handoff", color: "text-orange-400", border: "border-orange-400/30" },
  { key: "concluido", label: "Concluído", color: "text-green-400", border: "border-green-400/30" },
] as const;

const GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-700",
  "from-emerald-500 to-teal-700",
  "from-orange-500 to-amber-700",
  "from-pink-500 to-rose-700",
  "from-sky-500 to-indigo-700",
];

function hashJid(jid: string): number {
  let h = 0;
  for (let i = 0; i < jid.length; i++) {
    h = (Math.imul(31, h) + jid.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function avatarGradient(jid: string): string {
  return GRADIENTS[hashJid(jid) % GRADIENTS.length];
}

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  return `${Math.floor(diff / 86400)}d atrás`;
}

function unitBadge(unit: string | null): { label: string; cls: string } | null {
  if (!unit) return null;
  const u = unit.toLowerCase().replace(/\s/g, "_");
  if (u.includes("judas") || u === "sao_judas") return { label: "São Judas", cls: "text-orange-300 bg-orange-300/10 border border-orange-300/20" };
  if (u.includes("terezinha") || u === "santa_terezinha") return { label: "Santa Terezinha", cls: "text-purple-300 bg-purple-300/10 border border-purple-300/20" };
  return { label: unit, cls: "text-zinc-400 bg-zinc-800 border border-zinc-700" };
}

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const grad = avatarGradient(lead.jid);
  const badge = unitBadge(lead.unit_preference);
  const ts = lead.last_message_at ?? lead.updated_at ?? lead.created_at;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-colors group"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold select-none`}
        >
          {initials(lead.name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate leading-tight">
                {lead.name ?? "Sem nome"}
              </p>
              <p className="text-xs text-zinc-500 truncate">{fmtPhone(lead.phone)}</p>
            </div>
            {badge && (
              <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${badge.cls}`}>
                {badge.label}
              </span>
            )}
          </div>

          {lead.service_interest && (
            <p className="mt-1.5 text-xs text-zinc-400 truncate">{lead.service_interest}</p>
          )}
          {lead.vehicle_model && (
            <p className="text-[11px] text-zinc-600 truncate">{lead.vehicle_model}</p>
          )}

          <p className="mt-1.5 text-[10px] text-zinc-600 text-right">{timeAgo(ts)}</p>
        </div>
      </div>
    </button>
  );
}

export default function PipelinePage() {
  const [data, setData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: CRMData = await res.json();
      setData(json);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar leads");
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
  const byStatus = (status: string) => leads.filter((l) => l.status === status);

  const statusCounts = STATUSES.map((s) => ({
    ...s,
    count: byStatus(s.key).length,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-zinc-100">Pipeline</h1>
        <p className="mt-1 text-sm text-zinc-500">Acompanhe o progresso dos leads no funil de vendas.</p>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Status summary pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusCounts.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1"
            >
              <span className={`font-semibold ${s.color}`}>{s.label}</span>
              <span className="text-zinc-400">{s.count}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1">
            <span className="text-zinc-400">Total</span>
            <span className="text-zinc-300 font-semibold">{leads.length}</span>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <div className="px-6 pb-8 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {STATUSES.map((s) => {
            const colLeads = byStatus(s.key);
            return (
              <div
                key={s.key}
                className={`flex flex-col w-72 bg-zinc-900/50 border ${s.border} rounded-2xl overflow-hidden`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>
                    {s.label}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                    {colLeads.length}
                  </span>
                </div>

                {/* Card list */}
                <div
                  className="flex flex-col gap-2 p-3 overflow-y-auto"
                  style={{ maxHeight: "500px" }}
                >
                  {colLeads.length === 0 ? (
                    <p className="text-xs text-zinc-600 text-center py-8">Nenhum lead</p>
                  ) : (
                    colLeads.map((lead) => (
                      <LeadCard
                        key={lead.jid}
                        lead={lead}
                        onClick={() => setActiveLead(lead)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation drawer */}
      <ConversationDrawer lead={activeLead} onClose={() => setActiveLead(null)} />
    </>
  );
}
