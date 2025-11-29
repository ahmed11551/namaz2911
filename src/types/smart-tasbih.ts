// Типы для модуля "Умный Тасбих и Трекер Зикров"

export type Category = 
  | "general" 
  | "surah" 
  | "ayah" 
  | "dua" 
  | "azkar" 
  | "names99" 
  | "salawat" 
  | "kalimat";

export type GoalType = "recite" | "learn";

export type PrayerSegment = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "none";

export type EventType = 
  | "tap" 
  | "bulk" 
  | "repeat" 
  | "learn_mark" 
  | "goal_completed" 
  | "auto_reset";

export interface Item {
  id: string;
  category: Category;
  slug: string;
  title_ru?: string;
  title_en?: string;
  title_ar?: string;
  meta_json?: {
    surah_number?: number;
    ayah_count?: number;
    text?: string;
    arabic?: string;
    transcription?: string;
    translation?: string;
    audio_url?: string;
    [key: string]: unknown;
  };
  created_at: Date;
  updated_at: Date;
}

export interface TasbihGoal {
  id: string;
  user_id: string;
  category: Category;
  item_id?: string;
  goal_type: GoalType;
  target_count: number;
  progress: number;
  status: "active" | "completed" | "archived";
  prayer_segment: PrayerSegment;
  created_at: Date;
  completed_at?: Date;
  updated_at: Date;
}

export interface TasbihSession {
  id: string;
  user_id: string;
  goal_id?: string;
  prayer_segment: PrayerSegment;
  started_at: Date;
  ended_at?: Date;
}

export interface DhikrLog {
  id: string;
  user_id: string;
  session_id?: string;
  goal_id?: string;
  category?: Category;
  item_id?: string;
  event_type: EventType;
  delta: number;
  value_after: number;
  prayer_segment: PrayerSegment;
  at_ts: Date;
  tz: string;
  offline_id?: string;
  suspected?: boolean;
}

export interface DailyAzkar {
  user_id: string;
  date_local: string; // YYYY-MM-DD
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  total: number;
  is_complete: boolean;
  updated_at: Date;
}

export interface BootstrapResponse {
  user: {
    id: string;
    telegram_user_id?: string;
    locale: string;
    madhab: string;
    tz: string;
  };
  active_goal?: TasbihGoal;
  daily_azkar?: DailyAzkar;
  recent_items: Item[];
}

export interface CounterTapRequest {
  session_id: string;
  delta: number;
  event_type: EventType;
  offline_id?: string;
  prayer_segment?: PrayerSegment;
}

export interface CounterTapResponse {
  value_after: number;
  goal_progress?: {
    goal_id: string;
    progress: number;
    is_completed: boolean;
  };
  daily_azkar?: DailyAzkar;
}

export interface OfflineEvent {
  id: string;
  offline_id: string;
  type: "tap" | "learn_mark" | "session_start" | "session_end";
  data: Record<string, unknown>;
  timestamp: Date;
  synced: boolean;
}

export type FocusMood = "calm" | "gratitude" | "energy" | "healing" | "repentance";

export type FocusRitualStepType = "dhikr" | "breath" | "reflection";

export interface FocusRitualStep {
  id: string;
  type: FocusRitualStepType;
  title: string;
  instructions: string;
  target_count?: number;
  breath_pattern?: string;
  duration_sec?: number;
}

export interface FocusRitual {
  id: string;
  title: string;
  intent: string;
  mood: FocusMood;
  color?: string;
  auto_tempo?: number;
  steps: FocusRitualStep[];
  is_custom?: boolean;
}

export interface FocusSessionEntry {
  id: string;
  ritual_id?: string;
  ritual_title?: string;
  mood: FocusMood;
  reflections?: string;
  total_count?: number;
  created_at: string; // ISO
}

