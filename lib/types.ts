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
  last_message_at: string | null;
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
