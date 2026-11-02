export interface Lead {
  id: number;
  source: string;
  message_id: number;
  text: string;
  score: number;
  category: string;
  matched_keywords?: string;
  link?: string;
  created_at: string;
}

export interface Keyword {
  id: number;
  keyword: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  enabled: number;
  created_at: string;
}

export interface Group {
  id: number;
  username: string;
  title: string;
  type: 'public' | 'private';
  status: 'active' | 'paused' | 'pending_validation' | 'error' | 'join_required';
  lead_count: number;
  last_checked: string;
  error_message?: string;
  created_at: string;
}

export interface Source {
  id: number;
  name: string;
  type: string;
  status: string;
  enabled: number;
  lead_count: number;
  last_sync: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  type: 'lead_hot' | 'lead_warm' | 'system' | 'telegram_error';
  title: string;
  message: string;
  read: number;
  data?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface TelegramConnectionStatus {
  status: 'connected' | 'session_required' | 'credentials_missing' | 'standby';
  has_credentials: boolean;
  has_session_file: boolean;
  has_session_b64: boolean;
  message: string;
}

export interface Stats {
  total_leads: number;
  today_leads: number;
  hot_leads: number;
  warm_leads: number;
  low_leads: number;
  active_sources: number;
  active_keywords: number;
  monitored_groups: number;
  leads_timeline: {
    day: string;
    count: number;
    hot_count: number;
    warm_count?: number;
  }[];
  source_stats: {
    source: string;
    count: number;
    avg_score: number;
  }[];
  top_keywords: {
    keyword: string;
    count: number;
  }[];
  recent_leads: Lead[];
  telegram_listener_status: 'streaming' | 'standby';
  telegram_status?: TelegramConnectionStatus;
  last_sync: string;
}

export interface DashboardSettings {
  min_score: string;
  refresh_interval: string;
  notification_sound: string;
  hot_alerts: string;
  warm_alerts: string;
  theme: string;
  [key: string]: string;
}
