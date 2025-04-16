
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import EmotionInsightsEnhanced from "./EmotionInsightsEnhanced";
import { useIsMobile } from "@/hooks/use-mobile";

interface EmotionInsightsProps {
  filteredTransactions?: Transaction[];
}

const EmotionInsights: React.FC<EmotionInsightsProps> = ({ filteredTransactions }) => {
  const isMobile = useIsMobile();
  
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className={isMobile ? 'px-4 py-3' : ''}>
        <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl md:text-2xl'}`}>
          Emotional Insights
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'p-2' : 'pb-6'} overflow-x-auto`}>
        <div className="min-w-[280px]">
          <EmotionInsightsEnhanced filteredTransactions={filteredTransactions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
