
import React, { useMemo, useEffect, useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyzeEmotionalSpending } from "@/utils/emotionAnalysis";
import { analyzeEmotionTrends, TimePeriod } from "@/utils/emotionTrendAnalysis";
import { format, addDays, isSaturday, nextSaturday, isAfter } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const EMOTION_COLORS = {
  happy: "#4ade80", // green
  excited: "#60a5fa", // blue
  stressed: "#ef4444", // red
  sad: "#8b5cf6", // purple
  bored: "#fbbf24", // yellow
  neutral: "#9ca3af", // gray
};

const EmotionInsights: React.FC = () => {
  const { state } = useTransactions();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  
  // Basic spending insights
  const insights = useMemo(() => 
    analyzeEmotionalSpending(state.transactions, state.categories),
    [state.transactions, state.categories]
  );
  
  // Emotion trends by period
  const trends = useMemo(() => 
    analyzeEmotionTrends(state.transactions, timePeriod),
    [state.transactions, timePeriod]
  );
  
  // Prepare data for charts
  const trendChartData = useMemo(() => 
    trends.map(trend => ({
      name: trend.emotion.charAt(0).toUpperCase() + trend.emotion.slice(1),
      value: trend.percentage,
      count: trend.count,
      amount: trend.totalSpent,
      emotion: trend.emotion,
    })),
    [trends]
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

  // Custom tooltip for emotion charts
  const EmotionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>Transactions: {data.count}</p>
          <p>Total spent: ${data.amount.toFixed(2)}</p>
          <p>Percentage: {data.value}%</p>
        </div>
      );
    }
    return null;
  };

  const renderTimePeriodLabel = () => {
    switch(timePeriod) {
      case "week": return "This Week";
      case "month": return "This Month";
      case "year": return "This Year";
      default: return "This Week";
    }
  };
  
  const hasData = insights.length > 0 || trends.length > 0;

  if (!hasData) {
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
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="trends" className="flex-1">Emotion Trends</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">Spending Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Emotion Distribution</h3>
                <div className="flex space-x-1">
                  <TabsList>
                    <TabsTrigger 
                      value="week" 
                      onClick={() => setTimePeriod("week")}
                      className={timePeriod === "week" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Week
                    </TabsTrigger>
                    <TabsTrigger 
                      value="month" 
                      onClick={() => setTimePeriod("month")}
                      className={timePeriod === "month" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Month
                    </TabsTrigger>
                    <TabsTrigger 
                      value="year" 
                      onClick={() => setTimePeriod("year")}
                      className={timePeriod === "year" ? "bg-primary text-primary-foreground" : ""}
                    >
                      Year
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              {trends.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="text-sm font-medium mb-2">{renderTimePeriodLabel()} Emotion Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trendChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {trendChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={EMOTION_COLORS[entry.emotion] || '#ccc'} 
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<EmotionTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <h4 className="text-sm font-medium mb-2">{renderTimePeriodLabel()} Spending by Emotion</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendChartData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<EmotionTooltip />} />
                          <Bar dataKey="amount" name="Amount Spent">
                            {trendChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={EMOTION_COLORS[entry.emotion] || '#ccc'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Not enough data for emotion trends in this time period.
                </p>
              )}
              
              {trends.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Emotional Spending Summary</h4>
                  <div className="grid gap-3">
                    {trends.map((trend, index) => (
                      <div 
                        key={index} 
                        className="p-3 border rounded-lg flex justify-between items-center"
                        style={{
                          borderLeftColor: EMOTION_COLORS[trend.emotion] || '#ccc',
                          borderLeftWidth: "4px",
                        }}
                      >
                        <div>
                          <p className="font-medium">{trend.emotion.charAt(0).toUpperCase() + trend.emotion.slice(1)}</p>
                          <p className="text-sm text-muted-foreground">
                            {trend.count} transactions ({trend.percentage}% of emotional spending)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${trend.totalSpent.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: ${trend.averageSpent.toFixed(2)}/purchase
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="insights">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmotionInsights;
