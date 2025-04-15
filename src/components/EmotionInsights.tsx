
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import EmotionInsightsEnhanced from "./EmotionInsightsEnhanced";

interface EmotionInsightsProps {
  filteredTransactions?: Transaction[];
}

const EmotionInsights: React.FC<EmotionInsightsProps> = ({ filteredTransactions }) => {
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Emotional Insights</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <EmotionInsightsEnhanced filteredTransactions={filteredTransactions} />
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
