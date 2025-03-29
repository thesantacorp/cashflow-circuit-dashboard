
import React from "react";
import { useTransactions } from "@/context/transaction";
import { TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionInsights from "./EmotionInsights";

interface DashboardProps {
  type: TransactionType;
}

const Dashboard: React.FC<DashboardProps> = ({ type }) => {
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const total = getTotalByType(type);

  return (
    <div className="grid gap-6">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle>Total {type === "expense" ? "Expenses" : "Income"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {currencySymbol}{total.toFixed(2)}
          </div>
        </CardContent>
      </Card>

      {type === "expense" && <EmotionInsights />}
    </div>
  );
};

export default Dashboard;
