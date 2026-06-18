"use client";

import { useEffect, useState } from "react";
import { Lead, HistoryMessage } from "@/lib/types";

interface Props {
  lead: Lead | null;
  onClose: () => void;
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
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

const STATUS_OPTIONS = ["novo", "em_conversa", "agendado", "concluido", "perdido"] as const;

export default function ConversationDrawer({ lead, onClose }: Props) {
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const isOpen = lead !== null;

  useEffect(() => {
    if (!lead) {
      setHistory([]);
      setCurrentStatus("");
      return;
    }
    setCurrentStatus(lead.status);
    setStatusError(null);
    setLoading(true);
    fetch(`/api/history?jid=${encodeURIComponent(lead.jid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHistory(data);
        } else if (Array.isArray(data?.history)) {
          setHistory(data.history);
        } else {
          setHistory([]);
        }
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [lead?.jid]);

  async function handleStatusChange(newStatus: string) {
    if (!lead || newStatus === currentStatus) return;
    setUpdating(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/leads?jid=${encodeURIComponent(lead.jid)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status");
      setCurrentStatus(newStatus);
    } catch {
      setStatusError("Erro ao atualizar status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-96 z-50 bg-zinc-950 border-l border-zinc-800 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-zinc-800 shrink-0">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="text-base font-semibold text-white truncate">
                  {lead.name ?? "Sem nome"}
                </h2>
                <p className="text-sm text-zinc-400 mt-0.5">{fmtPhone(lead.phone)}</p>
              </div>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-white transition-colors shrink-0 w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-800"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Status + details */}
            <div className="p-5 border-b border-zinc-800 space-y-4 shrink-0">
              {/* Status badge + dropdown */}
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={currentStatus} />
                <div className="flex items-center gap-2">
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                    className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="" disabled>
                      Mudar status
                    </option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {updating && (
                    <svg className="w-4 h-4 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                </div>
              </div>
              {statusError && <p className="text-xs text-red-400">{statusError}</p>}

              {/* Lead details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Veículo</p>
                  <p className="text-zinc-200 font-medium">
                    {[lead.vehicle_type, lead.vehicle_model].filter(Boolean).join(" — ") || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Serviço</p>
                  <p className="text-zinc-200 font-medium">{lead.service_interest ?? "—"}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Unidade</p>
                  <p className="text-zinc-200 font-medium">{lead.unit_preference ?? "—"}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-1">Último contato</p>
                  <p className="text-zinc-200 font-medium">{timeAgo(lead.last_message_at)}</p>
                </div>
              </div>
            </div>

            {/* Conversation history */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                Histórico de conversa
              </h3>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-6 h-6 animate-spin text-zinc-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="ml-2 text-sm text-zinc-500">Carregando...</span>
                </div>
              )}

              {!loading && history.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <svg className="w-10 h-10 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.862 9.862 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-sm text-zinc-500">Sem histórico de conversa ainda</p>
                </div>
              )}

              {!loading &&
                history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "assistant" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-zinc-800 text-zinc-100 rounded-tl-sm"
                          : "bg-orange-950/50 text-orange-100 border border-orange-900/50 rounded-tr-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
