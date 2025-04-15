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

  return (
    <div className="grid gap-6 w-full overflow-x-visible pb-6">
      <Card className="bg-primary text-primary-foreground overflow-hidden w-full max-w-full">
        <CardHeader className="pb-2">
          <CardTitle>Total {type === "expense" ? "Expenses" : "Income"}</CardTitle>
        </CardHeader>
        <CardContent className="break-words">
          <div className="text-3xl font-bold overflow-x-auto">
            {currencySymbol}{total.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {type === "expense" && <EmotionInsights filteredTransactions={filteredTransactions} />}
    </div>
  );
};

export default Dashboard;
