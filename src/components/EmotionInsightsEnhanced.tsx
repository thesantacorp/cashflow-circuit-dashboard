
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, XAxis, YAxis, Bar, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { useTransactions } from "@/context/transaction";
import { EmotionInsight, EmotionalState, TimePeriod } from "@/types";
import { AlertCircle, TrendingUp, Info } from "lucide-react";
import { getEmotionTrends } from "@/utils/emotionTrendAnalysis";
import { getEmotionTimelineTrends } from "@/utils/emotionTimelineAnalysis";

const emotionColors = {
  happy: "#4CAF50",
  stressed: "#F44336",
  bored: "#9E9E9E",
  excited: "#2196F3",
  sad: "#673AB7",
  neutral: "#FF9800"
};

// Helper function for insights
const getEmotionInsights = (transactions: any[]): EmotionInsight[] => {
  // Basic implementation that returns empty array for now
  return [];
};

const EmotionInsightsEnhanced: React.FC = () => {
  const { state } = useTransactions();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  
  const insights = getEmotionInsights(state.transactions);
  const trends = getEmotionTrends(state.transactions, timePeriod);
  const timelineTrends = getEmotionTimelineTrends(state.transactions, timePeriod);
  
  // Filter out emotions with zero values
  const filteredTrends = trends.filter(trend => trend.count > 0);
  
  // Check if there are any transactions with emotions
  const hasEmotionData = state.transactions.some(tx => tx.emotionalState);
  
  // Check if we have enough data for the selected time period
  const hasEnoughData = {
    timeline: timelineTrends.length > 0 && timelineTrends.some(trend => 
      Object.keys(trend).some(key => key !== 'period' && trend[key] !== 0)
    ),
    distribution: filteredTrends.length > 0,
    insights: insights.length > 0
  };
  
  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value as TimePeriod);
  };

  if (!hasEmotionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <AlertCircle size={18} />
            Emotional Spending Insights
          </CardTitle>
          <CardDescription>
            Add emotions to your expenses to see how your mood affects your spending.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-black">
            <TrendingUp size={18} />
            Emotional Spending Insights
          </CardTitle>
          <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Track how your emotions impact your spending habits
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline">
            {hasEnoughData.timeline ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timelineTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                      labelFormatter={(label: string) => `Period: ${label}`}
                    />
                    <Legend />
                    {Object.keys(emotionColors).map((emotion) => (
                      <Bar 
                        key={emotion}
                        dataKey={emotion}
                        name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        fill={emotionColors[emotion as EmotionalState]}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not enough data</h3>
                <p className="text-muted-foreground max-w-md">
                  There isn't enough emotional spending data for the selected {timePeriod} time period. 
                  Try selecting a different time period or add more transactions with emotional states.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Spending distribution across different emotions over {timePeriod === "week" ? "weeks" : timePeriod === "month" ? "months" : "years"}
            </p>
          </TabsContent>
          
          <TabsContent value="distribution">
            {hasEnoughData.distribution ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredTrends}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="emotion" 
                      tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === "percentage") return [`${value.toFixed(1)}%`, "Percentage"];
                        if (name === "averageSpent") return [`$${value.toFixed(2)}`, "Avg. Spent"];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="percentage" fill="#8884d8" name="Percentage">
                      {filteredTrends.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={emotionColors[entry.emotion]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Not enough data</h3>
                <p className="text-muted-foreground max-w-md">
                  There isn't enough emotional spending data for the selected {timePeriod} time period. 
                  Try selecting a different time period or add more transactions with emotional states.
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Percentage of transactions associated with each emotion
            </p>
          </TabsContent>
          
          <TabsContent value="insights">
            <div className="grid gap-4">
              {insights.length > 0 ? (
                insights.map((insight: EmotionInsight, index: number) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-lg border"
                    style={{ borderLeftColor: emotionColors[insight.emotion], borderLeftWidth: 4 }}
                  >
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: emotionColors[insight.emotion] }}
                      ></span>
                      {insight.emotion.charAt(0).toUpperCase() + insight.emotion.slice(1)} with {insight.category}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Not enough data</h3>
                  <p className="text-muted-foreground max-w-md">
                    There isn't enough emotional spending data to generate insights for the selected {timePeriod} time period.
                    Try selecting a different time period or add more transactions with emotional states.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EmotionInsightsEnhanced;
