
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
        <CardTitle className="text-xl md:text-2xl">Emotional Insights</CardTitle>
      </CardHeader>
      <CardContent className="pb-6 overflow-x-auto">
        <EmotionInsightsEnhanced filteredTransactions={filteredTransactions} />
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
