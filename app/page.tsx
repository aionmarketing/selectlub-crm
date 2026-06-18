"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Users, Kanban, Calendar, BarChart3,
  Phone, MapPin, Search, RefreshCw, X, Car, Zap,
  ChevronRight, ChevronDown, Activity,
} from "lucide-react";

const C = {
  bg:        "#080a0f",
  surface:   "#0e1117",
  card:      "#131920",
  border:    "rgba(255,255,255,0.06)",
  red:       "#e63946",
  redDim:    "rgba(230,57,70,0.15)",
  blue:      "#3b82f6",
  blueDim:   "rgba(59,130,246,0.12)",
  green:     "#22c55e",
  greenDim:  "rgba(34,197,94,0.12)",
  amber:     "#f59e0b",
  amberDim:  "rgba(245,158,11,0.12)",
  purple:    "#a78bfa",
  purpleDim: "rgba(167,139,250,0.12)",
  text:      "#f0f6fc",
  textSub:   "#94a3b8",
  textMuted: "#4b5563",
  waBg:      "#075e54",
};

const STATUS: Record<string, { label: string; color: string; dim: string }> = {
  novo:        { label: "Novo",        color: C.blue,   dim: C.blueDim   },
  em_conversa: { label: "Conversando", color: C.amber,  dim: C.amberDim  },
  agendado:    { label: "Agendado",    color: C.green,  dim: C.greenDim  },
  handoff:     { label: "Humano ⚡",   color: C.red,    dim: C.redDim    },
  concluido:   { label: "Concluído",   color: C.purple, dim: C.purpleDim },
};

const NAV = [
  { id: "dashboard", label: "Visão",    Icon: LayoutDashboard },
  { id: "leads",     label: "Leads",    Icon: Users           },
  { id: "pipeline",  label: "Pipeline", Icon: Kanban          },
  { id: "agenda",    label: "Agenda",   Icon: Calendar        },
  { id: "reports",   label: "Dados",    Icon: BarChart3       },
];

function fPhone(p = "") {
  const n = p.replace(/\D/g, "");
  if (n.length >= 12) return `+${n.slice(0,2)} (${n.slice(2,4)}) ${n.slice(4,9)}-${n.slice(9)}`;
  if (n.length === 11) return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
  return p;
}

function ago(ts: string) {
  if (!ts) return "—";
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 1)  return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const AV_COLORS = [C.red, C.blue, C.green, C.amber, C.purple];
function avatarColor(name = "") { return AV_COLORS[(name.charCodeAt(0) || 0) % AV_COLORS.length]; }

function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const color = avatarColor(name);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `${color}22`, border: `1.5px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: size * 0.4, color, flexShrink: 0, textTransform: "uppercase" }}>
      {name ? name[0] : "?"}
    </div>
  );
}

function Chip({ label, color, dim }: { label: string; color: string; dim: string }) {
  return <span style={{ background: dim, color, fontSize: 9, fontWeight: 900, padding: "3px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{label}</span>;
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS[status] || { label: status, color: C.textMuted, dim: "rgba(75,85,99,0.2)" };
  return <Chip label={s.label} color={s.color} dim={s.dim} />;
}

function DashboardView({ stats, leads, onLead }: any) {
  const recent = [...leads].sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()).slice(0, 6);
  const unitTotal = (stats?.sao_judas || 0) + (stats?.santa_terezinha || 0) || 1;
  const statItems = [
    { label: "Total",   value: stats?.total || 0,    color: C.blue  },
    { label: "Hoje",    value: stats?.hoje || 0,     color: C.green },
    { label: "Ativos",  value: (stats?.em_conversa || 0) + (stats?.novo || 0), color: C.amber },
    { label: "Handoff", value: stats?.handoff || 0,  color: C.red   },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
        {statItems.map(({ label, value, color }) => (
          <div key={label} style={{ background: C.card, borderRadius: 16, padding: "16px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.text, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>
      {(stats?.total || 0) > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Por Unidade</div>
          {[{ label: "São Judas", val: stats?.sao_judas || 0, color: C.red }, { label: "Sta. Terezinha", val: stats?.santa_terezinha || 0, color: C.blue }].map(u => {
            const pct = Math.round((u.val / unitTotal) * 100);
            return (
              <div key={u.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
                  <span>{u.label}</span>
                  <span style={{ color: u.color }}>{u.val} <span style={{ color: C.textMuted, fontWeight: 500, fontSize: 11 }}>({pct}%)</span></span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 6 }}>
                  <div style={{ background: u.color, height: "100%", width: `${pct}%`, borderRadius: 99, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>Atividade Recente</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
            <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>Live</span>
          </div>
        </div>
        {recent.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Activity size={32} color={C.textMuted} style={{ margin: "0 auto 12px", display: "block" }} />
            <div style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>Aguardando primeiro contato</div>
            <div style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>Mande /fernando no WhatsApp</div>
          </div>
        ) : recent.map((l: any) => (
          <div key={l.jid} onClick={() => onLead(l)} style={{ padding: "13px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <Avatar name={l.name || "?"} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name || "Cliente"}</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.vehicle_model || l.service_interest || "Novo contato"}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <StatusChip status={l.status} />
              <div style={{ fontSize: 10, color: C.textMuted, marginTop: 5 }}>{ago(l.last_message_at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadsView({ leads, onLead }: any) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("todos");
  const filtered = leads.filter((l: any) => {
    const m = q.toLowerCase();
    return (!q || (l.name || "").toLowerCase().includes(m) || (l.phone || "").includes(q) || (l.vehicle_model || "").toLowerCase().includes(m)) && (filter === "todos" || l.status === filter);
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "0 14px", marginBottom: 12 }}>
        <Search size={15} color={C.textMuted} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, telefone ou veículo..." style={{ background: "transparent", border: "none", outline: "none", color: C.text, fontSize: 14, fontWeight: 500, flex: 1, padding: "13px 0" }} />
        {q && <X size={15} color={C.textMuted} onClick={() => setQ("")} style={{ cursor: "pointer", flexShrink: 0 }} />}
      </div>
      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" }}>
        {[["todos", "Todos"], ...Object.entries(STATUS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "7px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: filter === k ? C.red : C.card, color: filter === k ? "#fff" : C.textSub }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}><Users size={32} color={C.textMuted} style={{ margin: "0 auto 12px", display: "block" }} /><div style={{ color: C.textMuted, fontSize: 13, fontWeight: 600 }}>Nenhum lead encontrado</div></div>
        ) : filtered.map((l: any) => (
          <div key={l.jid} onClick={() => onLead(l)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "15px 16px", display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
            <Avatar name={l.name || "?"} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{l.name || "Cliente"}</span>
                <StatusChip status={l.status} />
              </div>
              <div style={{ fontSize: 12, color: C.textSub, fontWeight: 500, marginBottom: 4 }}>{fPhone(l.phone || "")}</div>
              {(l.vehicle_model || l.service_interest) && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: C.textMuted }}>
                  {l.vehicle_model && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Car size={10} /> {l.vehicle_model}</span>}
                  {l.service_interest && <span>· {l.service_interest}</span>}
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600, marginBottom: 6 }}>{ago(l.last_message_at)}</div>
              <ChevronRight size={15} color={C.textMuted} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelineView({ leads, onLead }: any) {
  const [open, setOpen] = useState<Record<string, boolean>>({ novo: true, em_conversa: true, handoff: true });
  const cols = Object.entries(STATUS).map(([key, s]) => ({ key, ...s, items: leads.filter((l: any) => l.status === key) }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {cols.map(col => {
        const isOpen = open[col.key] !== false;
        return (
          <div key={col.key} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div onClick={() => setOpen(o => ({ ...o, [col.key]: !isOpen }))} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: isOpen && col.items.length > 0 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, flex: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col.label}</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: col.color, background: col.dim, padding: "3px 10px", borderRadius: 99 }}>{col.items.length}</span>
              <ChevronDown size={15} color={C.textMuted} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0 }} />
            </div>
            {isOpen && col.items.length > 0 && col.items.map((l: any, i: number) => (
              <div key={l.jid} onClick={() => onLead(l)} style={{ padding: "13px 16px", borderBottom: i < col.items.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <Avatar name={l.name || "?"} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{l.name || "Cliente"}</div>
                  <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{l.vehicle_model ? `${l.vehicle_model}${l.service_interest ? " · " + l.service_interest : ""}` : (l.service_interest || fPhone(l.phone || ""))}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{ago(l.last_message_at)}</div>
                  {l.unit_preference && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><MapPin size={9} /> {l.unit_preference === "sao_judas" ? "S.Judas" : "Sta.Tere"}</div>}
                </div>
              </div>
            ))}
            {isOpen && col.items.length === 0 && <div style={{ padding: "16px", textAlign: "center", color: C.textMuted, fontSize: 12, fontWeight: 600 }}>Vazio</div>}
          </div>
        );
      })}
    </div>
  );
}

function AgendaView({ leads }: any) {
  const scheduled = leads.filter((l: any) => l.status === "agendado" || l.preferred_day);
  if (scheduled.length === 0) {
    return (
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <Calendar size={44} color={C.textMuted} style={{ margin: "0 auto 16px", display: "block" }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: C.textSub }}>Nenhum agendamento</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 8, maxWidth: 220, margin: "8px auto 0" }}>Quando o Dr. Óleo marcar uma visita, aparece aqui.</div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {scheduled.map((l: any) => (
        <div key={l.jid} style={{ background: C.card, border: `1px solid ${C.greenDim}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 46, height: 46, background: C.greenDim, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Calendar size={22} color={C.green} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{l.name || "Cliente"}</div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{fPhone(l.phone || "")}</div>
            </div>
            <a href={`https://wa.me/${(l.phone || "").replace(/\D/g, "")}`} target="_blank" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: C.waBg, borderRadius: 12, flexShrink: 0 }}>
              <Phone size={16} color="#fff" />
            </a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {l.preferred_day  && <span style={{ fontSize: 12, color: C.green, background: C.greenDim, padding: "5px 12px", borderRadius: 99, fontWeight: 700 }}>📅 {l.preferred_day}</span>}
            {l.preferred_time && <span style={{ fontSize: 12, color: C.blue,  background: C.blueDim,  padding: "5px 12px", borderRadius: 99, fontWeight: 700 }}>🕐 {l.preferred_time}</span>}
            {l.unit_preference && <span style={{ fontSize: 12, color: C.textSub, background: C.border, padding: "5px 12px", borderRadius: 99, fontWeight: 700 }}>📍 {l.unit_preference === "sao_judas" ? "São Judas" : "Sta. Terezinha"}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsView({ leads, stats }: any) {
  const total = stats?.total || 0;
  const svcMap: Record<string, number> = {};
  leads.forEach((l: any) => { const s = l.service_interest || "Não informado"; svcMap[s] = (svcMap[s] || 0) + 1; });
  const svcs = Object.entries(svcMap).sort((a, b) => b[1] - a[1]);
  const funnel = [
    { label: "Contatos",    val: total,                   color: C.blue   },
    { label: "Conversando", val: stats?.em_conversa || 0, color: C.amber  },
    { label: "Agendados",   val: stats?.agendado || 0,    color: C.green  },
    { label: "Handoff",     val: stats?.handoff || 0,     color: C.red    },
    { label: "Concluídos",  val: stats?.concluido || 0,   color: C.purple },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16 }}>Funil de Conversão</div>
        {funnel.map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5 }}>
              <span>{f.label}</span>
              <span style={{ color: f.color }}>{f.val} <span style={{ color: C.textMuted, fontSize: 10, fontWeight: 500 }}>({Math.round((f.val / (total || 1)) * 100)}%)</span></span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 7 }}>
              <div style={{ background: f.color, height: "100%", width: `${Math.round((f.val / (total || 1)) * 100)}%`, borderRadius: 99, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[{ label: "São Judas", val: stats?.sao_judas || 0, color: C.red, dim: C.redDim }, { label: "Sta. Terezinha", val: stats?.santa_terezinha || 0, color: C.blue, dim: C.blueDim }].map(u => (
          <div key={u.label} style={{ background: C.card, border: `1px solid ${u.dim}`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: u.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{u.label}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: C.text, lineHeight: 1 }}>{u.val}</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>leads</div>
          </div>
        ))}
      </div>
      {svcs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Serviços Solicitados</div>
          {svcs.map(([s, c], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: C.redDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: C.red, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 99, height: 5 }}>
                  <div style={{ background: C.red, height: "100%", width: `${Math.round((c / leads.length) * 100)}%`, borderRadius: 99 }} />
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 900, color: C.text, flexShrink: 0 }}>{c}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Drawer({ lead, onClose, onUpdateStatus }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chat" | "info">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lead) return;
    setLoading(true); setHistory([]); setTab("chat");
    fetch(`/api/selectlub/history?jid=${encodeURIComponent(lead.jid)}`, { headers: { Accept: "application/json" } })
      .then(r => r.json()).then(d => { setHistory(d.history || []); setLoading(false); }).catch(() => setLoading(false));
  }, [lead?.jid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  if (!lead) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", background: C.surface, width: "100%", maxHeight: "92dvh", borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 -24px 80px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div style={{ padding: "8px 16px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={lead.name || "?"} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>{lead.name || "Cliente"}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{fPhone(lead.phone || "")}</div>
            <div style={{ marginTop: 6 }}><StatusChip status={lead.status} /></div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={17} color={C.textMuted} />
          </button>
        </div>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 9 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <select value={lead.status} onChange={e => { onUpdateStatus(lead.jid, e.target.value); lead.status = e.target.value; }} style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 32px 11px 14px", color: C.text, fontSize: 12, fontWeight: 700, outline: "none", appearance: "none", cursor: "pointer" }}>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown size={13} color={C.textMuted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
          <a href={`https://wa.me/${(lead.phone || "").replace(/\D/g, "")}`} target="_blank" style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", background: C.waBg, borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0 }}>
            <Phone size={14} /> Chamar
          </a>
        </div>
        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
          {(["chat", "info"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", color: tab === id ? C.red : C.textMuted, borderBottom: tab === id ? `2px solid ${C.red}` : "2px solid transparent" }}>
              {id === "chat" ? "Conversa" : "Detalhes"}
            </button>
          ))}
        </div>
        {tab === "chat" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 6px", background: "#07090f", display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}><RefreshCw size={22} color={C.red} style={{ animation: "spin 1s linear infinite" }} /></div>
              : history.length === 0 ? <div style={{ textAlign: "center", padding: "48px 24px", color: C.textMuted, fontSize: 13, fontWeight: 600 }}>Sem histórico</div>
              : history.map((msg: any, i: number) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-start" : "flex-end" }}>
                  <div style={{ maxWidth: "84%", background: msg.role === "user" ? C.card : "#054d45", borderRadius: msg.role === "user" ? "4px 18px 18px 18px" : "18px 4px 18px 18px", padding: "10px 13px", fontSize: 13, lineHeight: 1.55, color: C.text, border: `1px solid ${msg.role === "user" ? C.border : "transparent"}` }}>
                    {msg.content}
                    {msg.timestamp && <div style={{ fontSize: 9, opacity: 0.4, marginTop: 4, textAlign: "right", fontWeight: 600 }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
                  </div>
                </div>
              ))}
            <div ref={bottomRef} />
          </div>
        )}
        {tab === "info" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {[
              { lbl: "Veículo",  val: lead.vehicle_model },
              { lbl: "Serviço",  val: lead.service_interest },
              { lbl: "Unidade",  val: lead.unit_preference === "sao_judas" ? "São Judas" : lead.unit_preference === "santa_terezinha" ? "Sta. Terezinha" : lead.unit_preference },
              { lbl: "Dia",      val: lead.preferred_day },
              { lbl: "Horário",  val: lead.preferred_time },
              { lbl: "Telefone", val: fPhone(lead.phone || "") },
            ].filter(x => x.val).map(({ lbl, val }) => (
              <div key={lbl} style={{ padding: "14px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted }}>{lbl}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CRM() {
  const [view, setView]         = useState("dashboard");
  const [leads, setLeads]       = useState<any[]>([]);
  const [stats, setStats]       = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  const load = useCallback(async () => {
    try {
      const [lR, sR] = await Promise.all([
        fetch("/api/selectlub/leads", { headers: { Accept: "application/json" } }),
        fetch("/api/selectlub/stats", { headers: { Accept: "application/json" } }),
      ]);
      setLeads((await lR.json()).leads || []);
      setStats(await sR.json());
    } catch {}
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const updateStatus = async (jid: string, status: string) => {
    try {
      await fetch("/api/selectlub/lead-update", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ jid, status }) });
      load();
    } catch {}
  };

  const handoffCount = leads.filter(l => l.status === "handoff").length;
  const vp = { leads, stats, onLead: setSelected, onUpdateStatus: updateStatus };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.surface, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, background: C.red, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 18px ${C.red}55` }}><Zap size={18} color="#fff" fill="#fff" /></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>Select<span style={{ color: C.red }}>Lub</span></div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em" }}>CRM · Dr. Óleo</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {handoffCount > 0 && <div style={{ background: C.red, color: "#fff", fontSize: 11, fontWeight: 900, padding: "5px 12px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5 }}><Zap size={10} fill="#fff" /> {handoffCount} handoff</div>}
          <button onClick={load} style={{ width: 36, height: 36, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <RefreshCw size={14} color={loadingData ? C.red : C.textMuted} style={loadingData ? { animation: "spin 1s linear infinite" } : {}} />
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: C.text, lineHeight: 1 }}>{NAV.find(n => n.id === view)?.label}</h1>
          <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>{leads.length} lead{leads.length !== 1 ? "s" : ""}<span style={{ color: C.green, marginLeft: 6 }}>● live</span></div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 96px" }}>
        {loadingData && leads.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><RefreshCw size={28} color={C.red} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : (
          <>
            {view === "dashboard" && <DashboardView {...vp} />}
            {view === "leads"     && <LeadsView     {...vp} />}
            {view === "pipeline"  && <PipelineView  {...vp} />}
            {view === "agenda"    && <AgendaView    leads={leads} />}
            {view === "reports"   && <ReportsView   {...vp} />}
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = view === id;
          const badge  = id === "leads" ? handoffCount : 0;
          return (
            <button key={id} onClick={() => setView(id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px 6px", background: "none", border: "none", cursor: "pointer", position: "relative", color: active ? C.red : C.textMuted }}>
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: active ? 800 : 600, letterSpacing: "0.03em" }}>{label}</span>
              {badge > 0 && <div style={{ position: "absolute", top: 6, right: "calc(50% - 18px)", width: 16, height: 16, background: C.red, borderRadius: "50%", fontSize: 9, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{badge}</div>}
              {active && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 16, height: 2, borderRadius: 99, background: C.red }} />}
            </button>
          );
        })}
      </div>

      <Drawer lead={selected} onClose={() => setSelected(null)} onUpdateStatus={updateStatus} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; height: 0; }
        input::placeholder { color: #4b5563; }
        select option { background: #131920; }
      `}</style>
    </div>
  );
}
