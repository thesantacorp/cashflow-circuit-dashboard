
export type TransactionType = "expense" | "income";
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

export interface Project {
  id: string;
  name: string;
  description?: string;
  image_url?: string | null;
  funding_goal?: number | null;
  live_link?: string | null;
  more_details?: string | null;
  expiration_date?: string | null; // ISO date string
  created_at: string; // ISO date string
  upvotes: number;
  downvotes: number;
  userVote?: number; // 1, 0 or -1, for client-side tracking
}
