
export type TransactionType = "expense" | "income";

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
}
