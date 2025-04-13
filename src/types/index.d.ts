
export {};

declare global {
  type CategoryType = "income" | "expense";
  type EmotionalState = "happy" | "stressed" | "bored" | "excited" | "sad" | "neutral" | "hopeful";
  type TimePeriod = "week" | "month" | "year" | "all";

  interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    categoryId: string;
    type: CategoryType;
    recurring: boolean;
    ruleId?: string | null;
    emotionalState?: EmotionalState;
  }

  interface Category {
    id: string;
    name: string;
    type: CategoryType;
    icon: string;
    color: string;
  }

  interface Rule {
    id: string;
    description: string;
    categoryId: string;
    conditions: Condition[];
  }

  interface Condition {
    field: string;
    operator: string;
    value: string;
  }

  interface EmotionTrend {
    emotion: EmotionalState;
    count: number;
    percentage: number;
    totalSpent: number;
    averageSpent: number;
  }

  interface EmotionTimelineTrend {
    period: string;
    happy?: number;
    stressed?: number;
    bored?: number;
    excited?: number;
    sad?: number;
    neutral?: number;
    hopeful?: number;
  }
}

declare module "@/components/Dashboard" {
  interface DashboardProps {
    type: "income" | "expense";
    filteredTransactions?: Transaction[];
  }
  
  const Dashboard: React.FC<DashboardProps>;
  export default Dashboard;
}

declare module "@/components/CategoryList" {
  interface CategoryListProps {
    type: "income" | "expense";
    filteredTransactions?: Transaction[];
  }
  
  const CategoryList: React.FC<CategoryListProps>;
  export default CategoryList;
}

declare module "@/components/TransactionList" {
  interface TransactionListProps {
    type: "income" | "expense";
    filteredTransactions?: Transaction[];
  }
  
  const TransactionList: React.FC<TransactionListProps>;
  export default TransactionList;
}
