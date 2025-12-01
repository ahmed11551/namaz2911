// Типы данных для функции "Пропущенные намазы (Каза)" согласно ТЗ

export type Gender = "male" | "female";
export type Madhab = "hanafi" | "shafii";
export type CalculationMethod = "manual" | "calculator";

export interface TravelPeriod {
  start_date: Date;
  end_date: Date;
  days_count: number;
}

export interface PersonalData {
  birth_date: Date;
  gender: Gender;
  bulugh_age: number; // возраст совершеннолетия (по умолчанию 15)
  bulugh_date: Date; // рассчитано автоматически по хиджре
  prayer_start_date: Date;
  today_as_start: boolean;
}

export interface WomenData {
  haid_days_per_month: number; // по умолчанию 7
  childbirth_count: number;
  nifas_days_per_childbirth: number; // по умолчанию 40
}

export interface TravelData {
  total_travel_days: number;
  travel_periods: TravelPeriod[];
}

export interface MissedPrayers {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export interface TravelPrayers {
  dhuhr_safar: number;
  asr_safar: number;
  isha_safar: number;
}

export interface CompletedPrayers {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  witr: number;
}

export interface DebtCalculation {
  period: { start: Date; end: Date };
  total_days: number;
  excluded_days: number;
  effective_days: number;
  missed_prayers: MissedPrayers;
  travel_prayers: TravelPrayers;
}

export interface RepaymentProgress {
  completed_prayers: CompletedPrayers;
  last_updated: Date;
}

export interface UserPrayerDebt {
  user_id: string;
  calc_version: string;
  madhab: Madhab;
  calculation_method: CalculationMethod;
  personal_data: PersonalData;
  women_data?: WomenData;
  travel_data: TravelData;
  debt_calculation: DebtCalculation;
  repayment_progress: RepaymentProgress;
}

export interface DebtSnapshot {
  user_id: string;
  debt_calculation: DebtCalculation;
  repayment_progress: RepaymentProgress;
  overall_progress_percent: number;
  remaining_prayers: MissedPrayers;
  estimated_completion_date?: Date;
}

export interface CalculationRequest {
  calculation_method: CalculationMethod;
  personal_data?: Omit<PersonalData, "bulugh_date">;
  women_data?: WomenData;
  travel_data?: TravelData;
  missed_prayers?: MissedPrayers;
  travel_prayers?: TravelPrayers;
}

export interface ProgressUpdateRequest {
  entries: Array<{
    type: keyof CompletedPrayers | keyof TravelPrayers;
    amount: number;
  }>;
}

export interface Term {
  term: string;
  definition: string;
  transliteration?: string;
}

