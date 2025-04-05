
export type TransactionType = "expense" | "income" | "combined";
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "NGN" | "GHS" | "KES" | "XOF";
export type EmotionalState = "happy" | "stressed" | "bored" | "excited" | "sad" | "neutral" | "hopeful";
export type BackupFrequency = "daily" | "weekly" | "monthly" | "manual";
export type TimePeriod = "week" | "month" | "year" | "all";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: string;
  description?: string;
  type: TransactionType;
  emotionalState?: EmotionalState;
}

export interface EmotionInsight {
  emotion: EmotionalState;
  category: string;
  percentageIncrease: number;
  message: string;
}

export interface EmotionTrend {
  emotion: EmotionalState;
  count: number;
  percentage: number;
  totalSpent: number;
  averageSpent: number;
}

export interface EmotionTimelineTrend {
  period: string; // e.g., "Jan", "Feb" for months or "Week 1", "Week 2" for weeks
  happy?: number;
  stressed?: number;
  bored?: number;
  excited?: number;
  sad?: number;
  neutral?: number;
  hopeful?: number;
  [key: string]: string | number | undefined;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: BackupFrequency;
  lastBackup: string | null;
}
