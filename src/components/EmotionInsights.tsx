
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import EmotionInsightsEnhanced from "./EmotionInsightsEnhanced";

interface EmotionInsightsProps {
  filteredTransactions?: Transaction[];
}

const EmotionInsights: React.FC<EmotionInsightsProps> = ({ filteredTransactions }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Emotional Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <EmotionInsightsEnhanced filteredTransactions={filteredTransactions} />
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
