
import React from "react";
import { useTransactions } from "@/context/transaction";
import { TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionInsights from "./EmotionInsights";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  type: TransactionType;
}

const Dashboard: React.FC<DashboardProps> = ({ type }) => {
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();
  
  // Handle the combined type by calculating both income and expenses
  const incomeTotal = type === "income" || type === "combined" ? getTotalByType("income") : 0;
  const expenseTotal = type === "expense" || type === "combined" ? getTotalByType("expense") : 0;
  const netTotal = incomeTotal - expenseTotal;

  return (
    <div className="grid gap-6 w-full overflow-x-visible pb-6">
      {type === "combined" ? (
        <>
          <Card className="bg-primary text-primary-foreground overflow-hidden w-full max-w-full">
            <CardHeader className="pb-2">
              <CardTitle>Net Balance</CardTitle>
            </CardHeader>
            <CardContent className="break-words">
              <div className="text-3xl font-bold overflow-x-auto">
                {currencySymbol}{netTotal.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-green-600 text-white overflow-hidden w-full">
              <CardHeader className="pb-2">
                <CardTitle>Total Income</CardTitle>
              </CardHeader>
              <CardContent className="break-words">
                <div className="text-2xl font-bold overflow-x-auto">
                  {currencySymbol}{incomeTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-red-600 text-white overflow-hidden w-full">
              <CardHeader className="pb-2">
                <CardTitle>Total Expenses</CardTitle>
              </CardHeader>
              <CardContent className="break-words">
                <div className="text-2xl font-bold overflow-x-auto">
                  {currencySymbol}{expenseTotal.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="bg-primary text-primary-foreground overflow-hidden w-full max-w-full">
          <CardHeader className="pb-2">
            <CardTitle>Total {type === "expense" ? "Expenses" : "Income"}</CardTitle>
          </CardHeader>
          <CardContent className="break-words">
            <div className="text-3xl font-bold overflow-x-auto">
              {currencySymbol}{type === "expense" ? expenseTotal.toFixed(2) : incomeTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}

      {(type === "expense" || type === "combined") && <EmotionInsights />}
    </div>
  );
};

export default Dashboard;
