
import React, { useMemo, useEffect, useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { analyzeEmotionalSpending } from "@/utils/emotionAnalysis";
import { format, addDays, isSaturday, nextSaturday, isAfter } from "date-fns";

const EmotionInsights: React.FC = () => {
  const { state } = useTransactions();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  
  const insights = useMemo(() => 
    analyzeEmotionalSpending(state.transactions, state.categories),
    [state.transactions, state.categories]
  );

  // Set up the weekly update schedule (every Saturday at 8pm)
  useEffect(() => {
    // Get current date and time
    const now = new Date();
    
    // Check if there's a stored last update time
    const storedLastUpdate = localStorage.getItem("emotionInsightsLastUpdate");
    let lastUpdateDate = storedLastUpdate ? new Date(storedLastUpdate) : null;
    
    // Determine the next update date (next Saturday at 8pm)
    let nextUpdateDate: Date;
    
    if (isSaturday(now)) {
      // If today is Saturday
      const saturdayEightPM = new Date(now);
      saturdayEightPM.setHours(20, 0, 0, 0);
      
      if (isAfter(now, saturdayEightPM)) {
        // If it's past 8pm, next update is next Saturday
        nextUpdateDate = nextSaturday(addDays(now, 1));
        nextUpdateDate.setHours(20, 0, 0, 0);
      } else {
        // If it's before 8pm, update is today at 8pm
        nextUpdateDate = saturdayEightPM;
      }
    } else {
      // If today is not Saturday, next update is the coming Saturday
      nextUpdateDate = nextSaturday(now);
      nextUpdateDate.setHours(20, 0, 0, 0);
    }
    
    // If we don't have a last update time or it's time for an update
    if (!lastUpdateDate || (isAfter(now, lastUpdateDate) && isAfter(now, nextUpdateDate))) {
      // Update the last update time
      setLastUpdated(now);
      localStorage.setItem("emotionInsightsLastUpdate", now.toISOString());
    } else if (lastUpdateDate) {
      setLastUpdated(lastUpdateDate);
    }
    
    setNextUpdate(nextUpdateDate);
  }, []);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotional Spending Insights</CardTitle>
          <CardDescription>
            Updated weekly on Saturdays at 8:00 PM
          </CardDescription>
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
        <CardDescription>
          {lastUpdated 
            ? `Last updated: ${format(lastUpdated, "MMMM d, yyyy")} • Next update: ${format(nextUpdate || new Date(), "EEEE, MMMM d 'at' h:mm a")}`
            : "Updates every Saturday at 8:00 PM"}
        </CardDescription>
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
