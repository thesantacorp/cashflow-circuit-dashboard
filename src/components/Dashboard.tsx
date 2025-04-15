
import React from "react";
import { useTransactions } from "@/context/transaction";
import { Transaction, TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionInsights from "./EmotionInsights";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  type: TransactionType;
  filteredTransactions?: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ type, filteredTransactions }) => {
  const { getTotalByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();
  
  // Calculate total based on filtered transactions if provided
  const total = filteredTransactions 
    ? filteredTransactions
        .filter(t => t.type === type)
        .reduce((sum, t) => sum + t.amount, 0)
    : getTotalByType(type);

  const transactionCount = filteredTransactions
    ? filteredTransactions.filter(t => t.type === type).length
    : state.transactions.filter(t => t.type === type).length;

  return (
    <div className="grid gap-4 sm:gap-6 w-full overflow-visible pb-4 sm:pb-6">
      <Card className="bg-primary text-primary-foreground w-full max-w-full overflow-visible shadow-md">
        <CardHeader className="pb-2 pt-4 px-4 sm:p-6 sm:pb-2">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Total {type === "expense" ? "Expenses" : "Income"}</CardTitle>
        </CardHeader>
        <CardContent className="break-words px-4 pb-4 sm:p-6 sm:pt-2">
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold overflow-x-auto max-w-full">
            <span className="whitespace-nowrap">{currencySymbol}{total.toFixed(2)}</span>
          </div>
          <p className="text-xs sm:text-sm mt-1 text-primary-foreground/80">
            Based on {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
          </p>
        </CardContent>
      </Card>

      {type === "expense" && (
        <div className="w-full overflow-visible">
          <EmotionInsights filteredTransactions={filteredTransactions} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
