import React, { useState, useEffect, useCallback } from "react";
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  BarChart3, 
  Calendar, 
  Phone, 
  Clock, 
  MapPin, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  X,
  ChevronRight,
  User,
  Car,
  Settings,
  AlertCircle
} from "lucide-react";

// --- Types ---
interface Lead {
  jid: string;
  phone: string;
  name: string;
  vehicle_model: string;
  service_interest: string;
  status: string;
  last_message_at: string;
  message_count: number;
  unit_preference: string;
  preferred_day?: string;
  preferred_time?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  novo:        { label: "Novo",        color: "#3498db", bg: "rgba(52,152,219,0.12)" },
  em_conversa: { label: "Em Conversa", color: "#f39c12", bg: "rgba(243,156,18,0.12)" },
  agendado:    { label: "Agendado",    color: "#2ecc71", bg: "rgba(46,204,113,0.12)" },
  handoff:     { label: "HUMANO ⚡",   color: "#e63946", bg: "rgba(230,57,70,0.15)" },
  concluido:   { label: "Concluído",   color: "#9b59b6", bg: "rgba(155,89,182,0.12)" },
};

// --- Helpers ---
function formatPhone(p: string) {
  const clean = p.replace(/\D/g, "");
  if (clean.length === 13) return `+${clean.slice(0,2)} (${clean.slice(2,4)}) ${clean.slice(4,9)}-${clean.slice(9)}`;
  if (clean.length === 11) return `(${clean.slice(0,2)}) ${clean.slice(2,7)}-${clean.slice(7)}`;
  return p;
}

function timeAgo(ts: string) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// --- Components ---

function SidebarItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all ${active ? 'bg-[#e63946] text-white shadow-lg shadow-red-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
    >
      <Icon size={18} />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

function Badge({ children, color, bg }: any) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: bg, color }}>
      {children}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all shadow-sm">
      <div className="flex justify-between items-start">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-slate-100">{value}</div>
        <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{label}</div>
      </div>
    </div>
  );
}

// --- Views ---

function DashboardView({ stats, recentLeads, onSelectLead }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Leads" value={stats?.total || 0} icon={Users} color="#e63946" />
        <StatCard label="Novos (Hoje)" value={stats?.hoje || 0} icon={Clock} color="#3498db" />
        <StatCard label="Aguardando Humano" value={stats?.handoff || 0} icon={AlertCircle} color="#f39c12" />
        <StatCard label="Agendados" value={stats?.agendado || 0} icon={Calendar} color="#2ecc71" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <RefreshCw size={14} /> Atividade Recente
          </h3>
          <div className="space-y-2">
            {recentLeads?.slice(0, 6).map((lead: any) => (
              <div 
                key={lead.jid} 
                onClick={() => onSelectLead(lead)}
                className="flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User size={14} className="text-slate-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{lead.name || lead.phone || "Cliente"}</div>
                    <div className="text-[10px] text-slate-500">{lead.service_interest || "Dúvida geral"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge {...(STATUS_MAP[lead.status] || { color: '#8b949e', bg: 'rgba(255,255,255,0.05)', label: lead.status })}>
                    {(STATUS_MAP[lead.status]?.label || lead.status)}
                  </Badge>
                  <div className="text-[10px] text-slate-600 mt-1 font-medium">{timeAgo(lead.last_message_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
            <MapPin size={14} /> Distribuição por Unidade
          </h3>
          <div className="space-y-6 pt-4">
            <UnitProgress label="Unidade São Judas" value={stats?.sao_judas || 0} total={stats?.total || 1} color="#e63946" />
            <UnitProgress label="Unidade Santa Terezinha" value={stats?.santa_terezinha || 0} total={stats?.total || 1} color="#3498db" />
          </div>
          <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
             <div className="text-[10px] text-red-500 font-black uppercase mb-1 flex items-center gap-1">
               <AlertCircle size={12} /> Dica de Atendimento
             </div>
             <p className="text-xs text-slate-500 leading-relaxed">
               Leads com status <span className="text-red-400 font-bold">HUMANO ⚡</span> pediram para falar com uma pessoa real. Priorize o contato direto via WhatsApp.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitProgress({ label, value, total, color }: any) {
  const pct = Math.round((value / total) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="text-slate-500 font-bold">{value} ({pct}%)</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function LeadListView({ leads, onSelectLead }: any) {
  const [search, setSearch] = useState("");
  const filtered = leads.filter((l: any) => 
    (l.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (l.phone || "").includes(search) ||
    (l.vehicle_model || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <Search size={18} className="text-slate-500 ml-2" />
        <input 
          type="text" 
          placeholder="Buscar por nome, telefone ou carro..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-600"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-6 py-4">Lead / Contato</th>
              <th className="px-6 py-4">Veículo</th>
              <th className="px-6 py-4">Interesse</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.map((lead: any) => (
              <tr key={lead.jid} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onSelectLead(lead)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-red-500">
                      {lead.name ? lead.name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200">{lead.name || "—"}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{formatPhone(lead.phone || "")}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-slate-500" />
                    <span className="text-slate-300">{lead.vehicle_model || "—"}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 inline-block">
                    {lead.service_interest || "—"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge {...(STATUS_MAP[lead.status] || { color: '#8b949e', bg: 'rgba(255,255,255,0.05)', label: lead.status })}>
                    {(STATUS_MAP[lead.status]?.label || lead.status)}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <ChevronRight size={18} className="inline text-slate-700 group-hover:text-red-500 transition-colors" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineView({ leads }: any) {
  const columns = ["novo", "em_conversa", "agendado", "handoff", "concluido"];
  
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map(status => (
        <div key={status} className="flex-shrink-0 w-72 bg-slate-900/50 rounded-xl border border-slate-800/50 flex flex-col h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: STATUS_MAP[status].color }}>
              {STATUS_MAP[status].label}
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
              {leads.filter((l: any) => l.status === status).length}
            </span>
          </div>
          <div className="p-3 flex-1 overflow-y-auto space-y-3">
            {leads.filter((l: any) => l.status === status).map((lead: any) => (
              <div 
                key={lead.jid}
                className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-red-500/50 transition-all cursor-pointer shadow-sm group"
              >
                <div className="font-bold text-xs text-slate-200 mb-1 group-hover:text-red-400">{lead.name || lead.phone || "Cliente"}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{lead.vehicle_model || "Veículo não inf."}</div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                   <div className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">{timeAgo(lead.last_message_at)}</div>
                   <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold">
                      <MessageSquare size={10} /> {lead.message_count || 0}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleView({ leads }: any) {
  const scheduled = leads.filter((l: any) => l.status === 'agendado' || l.preferred_day);
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
       <h2 className="text-lg font-bold flex items-center gap-2 mb-8">
         <Calendar size={20} className="text-red-500" /> Agenda de Visitas
       </h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {scheduled.map((lead: any) => (
           <div key={lead.jid} className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3">
                <Badge {...STATUS_MAP[lead.status]}>{STATUS_MAP[lead.status].label}</Badge>
             </div>
             
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="font-bold text-slate-100">{lead.name || "—"}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{formatPhone(lead.phone || "")}</div>
                </div>
             </div>
             
             <div className="space-y-3 mb-6">
               <div className="flex items-center gap-3 text-xs bg-orange-500/5 p-3 rounded-lg border border-orange-500/10">
                 <Clock size={14} className="text-orange-400" />
                 <span className="font-black text-orange-400 uppercase tracking-tighter text-sm">{lead.preferred_day || "A definir"} {lead.preferred_time || ""}</span>
               </div>
               <div className="px-3 flex items-center gap-3 text-[11px] text-slate-400">
                 <MapPin size={14} className="text-slate-600" />
                 <span>Unidade: <strong className="text-slate-200">{lead.unit_preference === 'sao_judas' ? 'São Judas' : lead.unit_preference === 'santa_terezinha' ? 'Sta Terezinha' : lead.unit_preference || '—'}</strong></span>
               </div>
               <div className="px-3 flex items-center gap-3 text-[11px] text-slate-400">
                 <Car size={14} className="text-slate-600" />
                 <span>Serviço: <strong className="text-slate-200">{lead.service_interest || '—'}</strong></span>
               </div>
             </div>

             <button 
                onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
                className="w-full py-3 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-green-900/10"
             >
               <Phone size={14} /> WhatsApp
             </button>
           </div>
         ))}
       </div>
    </div>
  );
}

function ReportsView({ reports }: any) {
  if (!reports) return <div className="p-8 text-center text-slate-500">Gerando relatórios técnicos...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-sm">
           <div className="text-4xl font-black text-red-500 mb-1">{reports.summary?.total || 0}</div>
           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Contatos Captados</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-sm">
           <div className="text-4xl font-black text-green-500 mb-1">{reports.summary?.converted || 0}</div>
           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Agendamentos</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-sm">
           <div className="text-4xl font-black text-blue-500 mb-1">{reports.summary?.conversion_rate || 0}%</div>
           <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Eficiência Bot</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-8 tracking-widest flex items-center gap-2">
              <Phone size={14} /> Volume por Especialidade
            </h3>
            <div className="space-y-5">
              {reports.byService?.map((s: any) => (
                <div key={s.service}>
                  <div className="flex justify-between text-[11px] mb-2 font-bold uppercase tracking-tight">
                    <span className="text-slate-500">{s.service}</span>
                    <span className="text-slate-200">{s.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 opacity-60 rounded-full" style={{ width: `${(s.total / reports.summary.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
         </div>

         <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-8 tracking-widest flex items-center gap-2">
              <MapPin size={14} /> Performance Regional
            </h3>
            <div className="space-y-6">
              {reports.byUnit?.map((u: any) => (
                <div key={u.unit} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
                    <div className="text-xs font-black text-red-500">{Math.round((u.total / reports.summary.total) * 100)}%</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-200">{u.unit === 'sao_judas' ? 'São Judas' : u.unit === 'santa_terezinha' ? 'Sta Terezinha' : u.unit}</div>
                    <div className="text-[11px] text-slate-500 font-medium uppercase tracking-tighter">{u.total} interações captadas</div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );
}

// --- Drawer ---

function ConversationDrawer({ lead, isOpen, onClose, onUpdateStatus }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      setLoading(true);
      fetch(`/api/history?jid=${encodeURIComponent(lead.jid)}`, { headers: { Accept: "application/json" } })
        .then(res => res.json())
        .then(data => setHistory(data.history || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, lead]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-900/40">
              {lead.name ? lead.name[0].toUpperCase() : "?"}
            </div>
            <div>
              <div className="font-bold text-lg text-slate-100">{lead.name || "Cliente"}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{formatPhone(lead.phone || "")}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 bg-slate-900 border-b border-slate-800 flex gap-3">
           <div className="flex-1">
             <select 
               value={lead.status} 
               onChange={(e) => onUpdateStatus(lead.jid, e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-200 outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
             >
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
             </select>
           </div>
           <button 
             onClick={() => window.open(`https://wa.me/${lead.phone}`, '_blank')}
             className="px-6 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 shadow-lg shadow-green-900/20"
           >
             <Phone size={16} /> WhatsApp
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs font-bold uppercase tracking-widest">Sincronizando mensagens...</div>
          ) : (
            history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] shadow-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none' 
                    : 'bg-red-600 text-white rounded-tr-none font-medium'
                }`}>
                  {msg.content}
                  <div className={`text-[9px] mt-2 text-right opacity-60 font-bold uppercase tracking-tighter`}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800">
           <div className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-4">Ficha Técnica do Lead</div>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Veículo</div>
                 <div className="text-xs font-bold text-slate-200">{lead.vehicle_model || "—"}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Serviço</div>
                 <div className="text-xs font-bold text-slate-200">{lead.service_interest || "—"}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Unidade</div>
                 <div className="text-xs font-bold text-slate-200">{lead.unit_preference === 'sao_judas' ? 'São Judas' : lead.unit_preference === 'santa_terezinha' ? 'Sta Terezinha' : lead.unit_preference || '—'}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Previsão</div>
                 <div className="text-xs font-bold text-slate-200">{lead.preferred_day || "—"} {lead.preferred_time || ""}</div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- App ---

export default function CRM() {
  const [view, setView] = useState("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());

  const API_BASE = "/api"; // No Zo Space, as rotas est\u00e3o em /api/...

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, statsRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/selectlub/leads`, { headers: { Accept: "application/json" } }),
        fetch(`${API_BASE}/selectlub/stats`, { headers: { Accept: "application/json" } }),
        fetch(`${API_BASE}/selectlub/reports`, { headers: { Accept: "application/json" } }),
      ]);
      
      const leadsData = await leadsRes.json();
      const statsData = await statsRes.json();
      const reportsData = await reportsRes.json();
      
      setLeads(leadsData.leads || []);
      setStats(statsData);
      setReports(reportsData);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleUpdateStatus = async (jid: string, status: string) => {
    try {
      await fetch(`${API_BASE}/selectlub/lead-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ jid, status }),
      });
      fetchData();
      if (selectedLead?.jid === jid) {
        setSelectedLead((prev: any) => ({ ...prev, status }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#080a0f] text-[#f0f6fc] font-sans overflow-hidden">
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-red-500 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/30">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-100">Select<span className="text-red-500">Lub</span></span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={Users} label="Leads WhatsApp" active={view === 'leads'} onClick={() => setView('leads')} />
          <SidebarItem icon={Kanban} label="Funil / Pipeline" active={view === 'pipeline'} onClick={() => setView('pipeline')} />
          <SidebarItem icon={Calendar} label="Agenda de Visitas" active={view === 'schedule'} onClick={() => setView('schedule')} />
          <SidebarItem icon={BarChart3} label="Relatórios" active={view === 'reports'} onClick={() => setView('reports')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 mb-6">
             <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dr. Óleo Online</span>
             </div>
             <div className="text-[11px] font-bold text-slate-300">Sincronizado via AION</div>
          </div>
          <div className="flex items-center gap-4 px-2">
             <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-500">AM</div>
             <div className="flex-1 overflow-hidden">
                <div className="text-sm font-bold truncate">Aion Marketing</div>
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Admin Console</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-10">
           <h1 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
             {view === 'dashboard' ? 'Business Overview' : view === 'leads' ? 'Lead Management' : view === 'pipeline' ? 'Sales Pipeline' : view === 'schedule' ? 'Appointments' : 'Analytics & Data'}
           </h1>
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <RefreshCw size={14} className={loading ? 'animate-spin text-red-500' : ''} />
                <span>Last Sync: {lastSync.toLocaleTimeString()}</span>
              </div>
              <button className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all">
                <Settings size={20} />
              </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 bg-slate-950/20">
          {view === 'dashboard' && <DashboardView stats={stats} recentLeads={leads} onSelectLead={setSelectedLead} />}
          {view === 'leads' && <LeadListView leads={leads} onSelectLead={setSelectedLead} />}
          {view === 'pipeline' && <PipelineView leads={leads} />}
          {view === 'schedule' && <ScheduleView leads={leads} />}
          {view === 'reports' && <ReportsView reports={reports} />}
        </main>
      </div>

      <ConversationDrawer 
        lead={selectedLead} 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
