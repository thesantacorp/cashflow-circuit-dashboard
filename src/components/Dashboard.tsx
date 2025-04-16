
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
    <div className="grid gap-6 w-full pb-6">
      <Card className="bg-primary text-primary-foreground w-full overflow-hidden">
        <CardHeader className={`pb-2 ${isMobile ? 'px-4 py-3' : ''}`}>
          <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            Total {type === "expense" ? "Expenses" : "Income"}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'px-4 py-3' : ''}>
          <div className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold break-words`}>
            {currencySymbol}{total.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {type === "expense" && (
        <div className="w-full">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[300px] px-4 sm:px-0">
              <EmotionInsights filteredTransactions={filteredTransactions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
