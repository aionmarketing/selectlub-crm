"use client";

import { useEffect, useState } from "react";
import { ReportsData, DailyRow, ServiceRow, UnitRow, StatusRow } from "@/lib/types";

// === FILE: app/reports/page.tsx ===

function fmtDate(dateStr: string): string {
  // Expects YYYY-MM-DD → DD/MM
  const parts = dateStr.split("-");
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

function fmtUnit(unit: string): string {
  const u = unit.toLowerCase().replace(/\s/g, "_");
  if (u === "sao_judas" || u.includes("judas")) return "São Judas";
  if (u === "santa_terezinha" || u.includes("terezinha")) return "Santa Terezinha";
  return unit;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  novo: { label: "Novo", color: "bg-zinc-500", bg: "bg-zinc-500/20" },
  em_conversa: { label: "Em Conversa", color: "bg-blue-500", bg: "bg-blue-500/20" },
  agendado: { label: "Agendado", color: "bg-emerald-500", bg: "bg-emerald-500/20" },
  handoff: { label: "Handoff", color: "bg-orange-500", bg: "bg-orange-500/20" },
  concluido: { label: "Concluído", color: "bg-green-500", bg: "bg-green-500/20" },
  perdido: { label: "Perdido", color: "bg-red-500", bg: "bg-red-500/20" },
};

// ─── Summary Card ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function SummaryCard({ label, value, sub }: SummaryCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

// ─── Daily Bar Chart ────────────────────────────────────────────────────────────

interface TooltipState {
  x: number;
  y: number;
  date: string;
  count: number;
}

function DailyChart({ data }: { data: DailyRow[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-600 text-center py-8">Nenhum dado nos últimos 30 dias</p>
    );
  }

  const max = Math.max(...data.map((d) => d.leads), 1);
  const CHART_H = 160;

  return (
    <div className="relative">
      <div
        className="flex items-end gap-1 overflow-x-auto pb-6"
        style={{ height: `${CHART_H + 28}px` }}
        onMouseLeave={() => setTooltip(null)}
      >
        {data.map((row) => {
          const pct = (row.leads / max) * 100;
          const barH = Math.max(4, Math.round((row.leads / max) * CHART_H));
          return (
            <div
              key={row.date}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              style={{ width: "28px" }}
            >
              <div
                className="w-full rounded-t-sm bg-orange-500/70 hover:bg-orange-500 transition-colors cursor-default"
                style={{ height: `${barH}px` }}
                onMouseEnter={(e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const parentRect = (e.target as HTMLElement)
                    .closest(".relative")!
                    .getBoundingClientRect();
                  setTooltip({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top - 8,
                    date: row.date,
                    count: row.leads,
                  });
                }}
                title={`${fmtDate(row.date)}: ${row.leads}`}
                aria-label={`${fmtDate(row.date)}: ${row.leads} leads`}
              />
              <span
                className="text-[9px] text-zinc-600 rotate-45 origin-left whitespace-nowrap"
                style={{ marginTop: "2px" }}
              >
                {fmtDate(row.date)}
              </span>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 shadow-xl whitespace-nowrap"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-semibold">{fmtDate(tooltip.date)}</span>
          <span className="text-zinc-400 ml-1">— {tooltip.count} leads</span>
        </div>
      )}
    </div>
  );
}

// ─── Horizontal Bar List ────────────────────────────────────────────────────────

function HBarList({
  rows,
  labelFn,
  accentColor = "bg-orange-500",
  trackColor = "bg-orange-500/20",
}: {
  rows: { label: string; count: number }[];
  labelFn?: (v: string) => string;
  accentColor?: string;
  trackColor?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-600 text-center py-6">Nenhum dado</p>;
  }
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const pct = (row.count / max) * 100;
        const display = labelFn ? labelFn(row.label) : row.label;
        return (
          <div key={row.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 truncate max-w-[70%]">{display}</span>
              <span className="text-zinc-500 font-medium">{row.count}</span>
            </div>
            <div className={`w-full rounded-full h-2 ${trackColor}`}>
              <div
                className={`h-2 rounded-full ${accentColor} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Funnel Status Bar ──────────────────────────────────────────────────────────

function FunnelBar({ statuses }: { statuses: StatusRow[] }) {
  const total = statuses.reduce((s, r) => s + r.total, 0);
  if (total === 0) {
    return <p className="text-sm text-zinc-600 text-center py-4">Nenhum dado</p>;
  }

  const ordered = ["novo", "em_conversa", "agendado", "handoff", "concluido", "perdido"];
  const sorted = [...statuses].sort(
    (a, b) => ordered.indexOf(a.status) - ordered.indexOf(b.status)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Stacked bar */}
      <div className="flex w-full h-7 rounded-lg overflow-hidden">
        {sorted.map((row) => {
          if (row.total === 0) return null;
          const pct = (row.total / total) * 100;
          const cfg = STATUS_CONFIG[row.status] ?? {
            label: row.status,
            color: "bg-zinc-600",
            bg: "bg-zinc-600/20",
          };
          return (
            <div
              key={row.status}
              className={`${cfg.color} transition-all`}
              style={{ width: `${pct}%` }}
              title={`${cfg.label}: ${row.total} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {sorted.map((row) => {
          const cfg = STATUS_CONFIG[row.status] ?? {
            label: row.status,
            color: "bg-zinc-600",
            bg: "bg-zinc-600/20",
          };
          const pct = ((row.total / total) * 100).toFixed(1);
          return (
            <div key={row.status} className="flex items-center gap-2 text-xs">
              <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${cfg.color}`} />
              <span className="text-zinc-400">{cfg.label}</span>
              <span className="text-zinc-300 font-semibold">{row.total}</span>
              <span className="text-zinc-600">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ReportsData = await res.json();
        setData(json);
        setFetchedAt(new Date().toLocaleTimeString("pt-BR"));
        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro ao carregar relatórios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-6 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <span>⚠</span>
        <span>{error}</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-600 text-sm">
        Nenhum dado disponível ainda.
      </div>
    );
  }

  const { summary, daily, byService, byUnit, byStatus } = data;
  const last30 = daily.slice(-30);

  const totalLastMonth = last30.reduce((s, d) => s + d.leads, 0);

  const serviceRows = byService.map((r) => ({ label: r.service, count: r.total }));
  const unitRows = byUnit.map((r) => ({ label: r.unit, count: r.total }));

  return (
    <div className="px-6 pt-6 pb-12 space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Relatórios</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Análise de desempenho e volume de leads.
        </p>
        {fetchedAt && (
          <p className="mt-1 text-xs text-zinc-600">Atualizado às {fetchedAt}</p>
        )}
      </div>

      {/* 1. Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total de leads" value={summary.total} sub="desde o início" />
        <SummaryCard
          label="Convertidos"
          value={summary.converted}
          sub="agendado + concluído"
        />
        <SummaryCard
          label="Taxa de conversão"
          value={`${summary.conversion_rate}%`}
          sub="sobre total de leads"
        />
        <SummaryCard
          label="Leads (30 dias)"
          value={totalLastMonth}
          sub="últimos 30 dias"
        />
      </div>

      {/* 2. Daily volume */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Volume diário</h2>
        <DailyChart data={last30} />
      </section>

      {/* 3. By service + by unit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Por serviço</h2>
          <HBarList rows={serviceRows} />
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">Por unidade</h2>
          <HBarList rows={unitRows} labelFn={fmtUnit} />
        </section>
      </div>

      {/* 4. Funnel status bar */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Status do funil</h2>
        <FunnelBar statuses={byStatus} />
      </section>
    </div>
  );
}
