
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/context/transaction";
import { Doughnut, Line } from "react-chartjs-2";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { generateEmotionTimelineData } from "@/utils/emotionTimelineAnalysis";
import { generateEmotionTrendData } from "@/utils/emotionTrendAnalysis";
import { analyzeEmotionalSpending } from "@/utils/emotionAnalysis";
import { useCurrency } from "@/context/CurrencyContext";

interface EmotionInsightsEnhancedProps {
  currencySymbol?: string;
}

const EmotionInsightsEnhanced: React.FC<EmotionInsightsEnhancedProps> = () => {
  const { state } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  // Use the passed currencySymbol or the default value
  const currency = currencySymbol;
  
  const emotionTransactions = useMemo(() => {
    return state.transactions.filter(t => t.emotionalState && t.emotionalState !== "neutral");
  }, [state.transactions]);
  
  // Get emotion analysis data
  const { emotionDistribution, emotionSpending, averageSpending } = useMemo(() => {
    return analyzeEmotionalSpending(state.transactions);
  }, [state.transactions]);

  // Prepare emotion timeline data
  const { labels: timelineLabels, datasets: timelineDatasets } = useMemo(() => {
    return generateEmotionTimelineData(emotionTransactions);
  }, [emotionTransactions]);

  // Prepare emotion trend data
  const { labels: trendLabels, datasets: trendDatasets } = useMemo(() => {
    return generateEmotionTrendData(emotionTransactions);
  }, [emotionTransactions]);

  // Doughnut chart data for emotion distribution
  const distributionData = {
    labels: Object.keys(emotionDistribution),
    datasets: [
      {
        data: Object.values(emotionDistribution),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Line chart data for emotion spending over time
  const timelineData = {
    labels: timelineLabels,
    datasets: timelineDatasets,
  };

  // Line chart data for emotion trends
  const trendData = {
    labels: trendLabels,
    datasets: trendDatasets,
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // If there is no emotional data, display an info message
  if (emotionTransactions.length === 0) {
    return (
      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>No emotional data available</AlertTitle>
        <AlertDescription>
          Start recording your emotional state when adding transactions to see insights.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Emotion Distribution */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Emotion Distribution</CardTitle>
          <CardDescription>How often you feel different emotions when spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <Doughnut data={distributionData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Emotional Spending Summary */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Emotional Spending</CardTitle>
          <CardDescription>How emotions influence your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(emotionSpending).map(([emotion, amount]) => (
              <div key={emotion} className="flex justify-between items-center">
                <span className="capitalize">{emotion}</span>
                <span className="font-semibold">{currency}{amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Avg. per transaction</span>
                <span className="font-semibold">{currency}{averageSpending.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emotion Spending Over Time */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>Emotional Spending Trends</CardTitle>
          <CardDescription>How your emotional spending changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <Line data={trendData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Emotion Timeline */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Emotion Timeline</CardTitle>
          <CardDescription>Your emotional spending patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={timelineData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionInsightsEnhanced;
