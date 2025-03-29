
import React, { useMemo } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeEmotionalSpending } from "@/utils/emotionAnalysis";

const EmotionInsights: React.FC = () => {
  const { state } = useTransactions();
  
  const insights = useMemo(() => 
    analyzeEmotionalSpending(state.transactions, state.categories),
    [state.transactions, state.categories]
  );

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotional Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            Not enough data to generate insights yet. Track more transactions with emotional states to see patterns.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotional Spending Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.slice(0, 5).map((insight, index) => (
            <div 
              key={index} 
              className="p-3 border rounded-lg"
              style={{
                borderLeftColor: insight.percentageIncrease > 0 ? "#ef4444" : "#22c55e",
                borderLeftWidth: "4px",
              }}
            >
              <p>{insight.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
