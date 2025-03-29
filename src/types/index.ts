
export type TransactionType = "expense" | "income";
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
export type EmotionalState = "happy" | "stressed" | "bored" | "excited" | "sad" | "neutral";

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
