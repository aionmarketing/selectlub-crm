export interface Lead {
  jid: string;
  phone: string | null;
  name: string | null;
  vehicle_type: string | null;
  vehicle_model: string | null;
  service_interest: string | null;
  unit_preference: string | null;
  status: string;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
  bot_active?: boolean;
  message_count?: number;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LeadWithHistory {
  lead: Lead;
  history: HistoryMessage[];
}

export interface Stats {
  total: number;
  hoje: number;
  novo: number;
  em_conversa: number;
  agendado: number;
  concluido: number;
  sao_judas: number;
  santa_terezinha: number;
}

export interface CRMData {
  leads: Lead[];
  stats: Stats;
  at: string;
}

export interface DailyRow {
  date: string;
  leads: number;
  agendados: number;
  concluidos: number;
}

export interface ServiceRow {
  service: string;
  total: number;
}

export interface UnitRow {
  unit: string;
  total: number;
}

export interface StatusRow {
  status: string;
  total: number;
}

export interface ReportsData {
  daily: DailyRow[];
  byService: ServiceRow[];
  byUnit: UnitRow[];
  byStatus: StatusRow[];
  summary: {
    total: number;
    converted: number;
    conversion_rate: string;
  };
}
