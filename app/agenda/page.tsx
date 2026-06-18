"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CRMData, Lead } from "@/lib/types";
import ConversationDrawer from "@/components/ConversationDrawer";

function fmtPhone(phone: string | null): string {
  if (!phone) return "Sem telefone";
  const d = phone.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

function fmtUnit(unit: string | null): string {
  if (!unit) return "Sem unidade";
  if (unit === "sao_judas" || unit.toLowerCase().includes("judas")) return "São Judas";
  if (unit === "santa_terezinha" || unit.toLowerCase().includes("terezinha")) return "Santa Terezinha";
  return unit;
}

function scheduleLabel(lead: Lead): string {
  const value = [lead.preferred_day, lead.preferred_time].filter(Boolean).join(" · ");
  return value || "Horário a combinar";
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-left transition hover:border-orange-500/40 hover:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{lead.name || "Sem nome"}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{fmtPhone(lead.phone)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          lead.handoff_requested ? "bg-orange-500/15 text-orange-300" : "bg-emerald-500/15 text-emerald-300"
        }`}>
          {lead.handoff_requested ? "humano" : "bot"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-600">Serviço</p>
          <p className="mt-0.5 truncate font-medium text-zinc-200">{lead.service_interest || "—"}</p>
        </div>
        <div>
          <p className="text-zinc-600">Veículo</p>
          <p className="mt-0.5 truncate font-medium text-zinc-200">{lead.vehicle_model || "—"}</p>
        </div>
        <div>
          <p className="text-zinc-600">Unidade</p>
          <p className="mt-0.5 font-medium text-zinc-200">{fmtUnit(lead.unit_preference)}</p>
        </div>
        <div>
          <p className="text-zinc-600">Preferência</p>
          <p className="mt-0.5 font-medium text-zinc-200">{scheduleLabel(lead)}</p>
        </div>
      </div>
    </button>
  );
}

function Column({ title, subtitle, leads, onSelect }: { title: string; subtitle: string; leads: Lead[]; onSelect: (lead: Lead) => void }) {
  return (
    <section className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-950/60">
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
          </div>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">{leads.length}</span>
        </div>
      </div>
      <div className="space-y-3 p-3">
        {leads.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-600">Nenhum lead aqui.</p>
        ) : (
          leads.map((lead) => <LeadCard key={lead.jid} lead={lead} onClick={() => onSelect(lead)} />)
        )}
      </div>
    </section>
  );
}

export default function AgendaPage() {
  const [data, setData] = useState<CRMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    const json: CRMData = await res.json();
    setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    const timer = setInterval(fetchLeads, 30_000);
    return () => clearInterval(timer);
  }, [fetchLeads]);

  const leads = data?.leads ?? [];
  const { ready, handoff, missing } = useMemo(() => {
    return {
      ready: leads.filter((l) => !l.handoff_requested && (l.preferred_day || l.preferred_time)),
      handoff: leads.filter((l) => l.handoff_requested || l.status === "handoff"),
      missing: leads.filter((l) => !l.handoff_requested && !l.preferred_day && !l.preferred_time),
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-orange-500" />
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Agenda</h1>
            <p className="mt-1 text-sm text-zinc-500">Preferências de horário coletadas pelo Dr. Óleo e handoffs para a equipe.</p>
          </div>
          <button
            onClick={fetchLeads}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Atualizar
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Column title="Prontos para confirmar" subtitle="Tem unidade e preferência de horário" leads={ready} onSelect={setSelectedLead} />
          <Column title="Pedir humano" subtitle="Cliente quer atendimento da equipe" leads={handoff} onSelect={setSelectedLead} />
          <Column title="Falta horário" subtitle="Continuar conversa antes de confirmar" leads={missing} onSelect={setSelectedLead} />
        </div>
      </div>
      <ConversationDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </>
  );
}
