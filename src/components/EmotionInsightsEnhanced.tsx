import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/context/transaction";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { EmotionTimelineTrend, EmotionTrend, TimePeriod } from "@/types";
import { analyzeEmotionalSpending } from "@/utils/emotionAnalysis";
import { getEmotionTimelineTrends } from "@/utils/emotionTimelineAnalysis";
import { getEmotionTrends } from "@/utils/emotionTrendAnalysis";
import { useCurrency } from "@/context/CurrencyContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumberWithCommas } from "@/lib/utils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

interface EmotionInsightsEnhancedProps {
  currencySymbol?: string;
  filteredTransactions?: any[];
}

const EmotionInsightsEnhanced: React.FC<EmotionInsightsEnhancedProps> = ({ 
  filteredTransactions 
}) => {
  const { state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const [timelinePeriod, setTimelinePeriod] = useState<TimePeriod>("month");
  const isMobile = useIsMobile();
  
  // Use the current currencySymbol
  const currency = currencySymbol;
  
  // Use filtered transactions if provided, otherwise use all transactions
  const transactions = filteredTransactions || state.transactions;
  
  const emotionTransactions = useMemo(() => {
    return transactions.filter(t => t.emotionalState && t.emotionalState !== "neutral");
  }, [transactions]);
  
  // Get emotion analysis data
  const { emotionInsights, emotionDistribution, emotionSpending, averageSpending } = useMemo(() => {
    const insights = analyzeEmotionalSpending(transactions, state.categories);
    
    // Calculate emotion distribution
    const distribution: Record<string, number> = {};
    const spending: Record<string, number> = {};
    let totalEmotionalSpending = 0;
    let totalEmotionalTransactions = 0;
    
    emotionTransactions.forEach(t => {
      if (t.emotionalState && t.type === "expense") {
        if (!distribution[t.emotionalState]) {
          distribution[t.emotionalState] = 0;
          spending[t.emotionalState] = 0;
        }
        distribution[t.emotionalState]++;
        spending[t.emotionalState] += t.amount;
        totalEmotionalSpending += t.amount;
        totalEmotionalTransactions++;
      }
    });
    
    const avgSpending = totalEmotionalTransactions > 0 
      ? totalEmotionalSpending / totalEmotionalTransactions 
      : 0;
    
    return { 
      emotionInsights: insights,
      emotionDistribution: distribution,
      emotionSpending: spending,
      averageSpending: avgSpending
    };
  }, [transactions, state.categories, emotionTransactions]);

  // Prepare emotion timeline data
  const timelineData = useMemo(() => {
    const timelineTrends: EmotionTimelineTrend[] = getEmotionTimelineTrends(emotionTransactions, timelinePeriod);
    
    const labels = timelineTrends.map(trend => trend.period);
    const emotions = ["happy", "stressed", "bored", "excited", "sad", "neutral", "hopeful"];
    
    const datasets = emotions
      .filter(emotion => timelineTrends.some(trend => {
        const value = trend[emotion];
        return value !== undefined && typeof value === 'number' && value > 0;
      }))
      .map(emotion => {
        const color = getEmotionColor(emotion);
        return {
          label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          data: timelineTrends.map(trend => trend[emotion] || 0),
          borderColor: color,
          backgroundColor: color.replace('1)', '0.2)'),
          tension: 0.4,
        };
      });
    
    // If no dataset is populated, add a placeholder dataset
    if (datasets.length === 0) {
      datasets.push({
        label: 'No Data',
        data: labels.map(() => 0),
        borderColor: 'rgba(156, 163, 175, 1)',
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        tension: 0.4,
      });
    }
    
    return { labels, datasets };
  }, [emotionTransactions, timelinePeriod]);

  // Prepare emotion trend data
  const trendData = useMemo(() => {
    const trends: EmotionTrend[] = getEmotionTrends(emotionTransactions);
    
    const labels = trends.map(trend => 
      trend.emotion.charAt(0).toUpperCase() + trend.emotion.slice(1)
    );
    
    const datasets = [{
      label: 'Spending',
      data: trends.map(trend => trend.totalSpent),
      backgroundColor: trends.map(trend => getEmotionColor(trend.emotion)),
    }];
    
    // If no data, add placeholder
    if (labels.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{
          label: 'Spending',
          data: [0],
          backgroundColor: ['rgba(156, 163, 175, 1)'],
        }]
      };
    }
    
    return { labels, datasets };
  }, [emotionTransactions]);

  // Doughnut chart data for emotion distribution
  const distributionData = useMemo(() => {
    const labels = Object.keys(emotionDistribution).map(
      emotion => emotion.charAt(0).toUpperCase() + emotion.slice(1)
    );
    
    const data = Object.values(emotionDistribution);
    
    const backgroundColor = Object.keys(emotionDistribution).map(emotion => 
      getEmotionColor(emotion)
    );
    
    // If no data, add placeholder
    if (labels.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['rgba(156, 163, 175, 1)'],
            borderWidth: 1,
          },
        ],
      };
    }
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  }, [emotionDistribution]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        display: true,
        labels: {
          boxWidth: isMobile ? 8 : 10,
          font: {
            size: isMobile ? 8 : 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'Spending') {
              return `${currency}${context.raw.toFixed(2)}`;
            }
            return context.label;
          }
        }
      }
    },
  };

  // Helper function to get emotion color
  function getEmotionColor(emotion: string): string {
    switch(emotion) {
      case 'happy': return 'rgba(74, 222, 128, 1)';
      case 'excited': return 'rgba(96, 165, 250, 1)';
      case 'stressed': return 'rgba(239, 68, 68, 1)';
      case 'sad': return 'rgba(139, 92, 246, 1)';
      case 'bored': return 'rgba(251, 191, 36, 1)';
      case 'hopeful': return 'rgba(14, 159, 110, 1)';
      default: return 'rgba(156, 163, 175, 1)';
    }
  }

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
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} overflow-visible`}>
      {/* Emotion Distribution */}
      <Card className={`col-span-1 overflow-visible ${isMobile ? 'min-w-[250px]' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">Emotion Distribution</CardTitle>
          <CardDescription className="text-xs">How often you feel different emotions when spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] sm:h-[200px] flex items-center justify-center">
            <Doughnut data={distributionData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Emotional Spending Summary */}
      <Card className={`col-span-1 overflow-visible ${isMobile ? 'min-w-[250px]' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">Emotional Spending</CardTitle>
          <CardDescription className="text-xs">How emotions influence your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.keys(emotionSpending).length > 0 ? (
              Object.entries(emotionSpending).map(([emotion, amount]) => (
                <div key={emotion} className="flex justify-between items-center">
                  <span className="capitalize text-xs sm:text-sm">{emotion}</span>
                  <span className="font-semibold text-xs sm:text-sm">{currency}{formatNumberWithCommas(amount)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-xs">
                No emotional spending data available
              </div>
            )}
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium text-xs sm:text-sm">Avg. per transaction</span>
                <span className="font-semibold text-xs sm:text-sm">{currency}{formatNumberWithCommas(averageSpending)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emotion Spending Over Time */}
      <Card className={`${isMobile ? 'col-span-1' : 'md:col-span-2 lg:col-span-1'} overflow-visible ${isMobile ? 'min-w-[250px]' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">Emotional Spending Trends</CardTitle>
          <CardDescription className="text-xs">How your emotional spending changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] sm:h-[200px]">
            <Line data={trendData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Emotion Timeline */}
      <Card className={`col-span-full overflow-visible ${isMobile ? 'min-w-[250px]' : ''}`}>
        <CardHeader className="flex flex-col pb-2">
          <div className="mb-2">
            <CardTitle className="text-xs sm:text-sm">Emotion Timeline</CardTitle>
            <CardDescription className="text-xs">Your emotional spending patterns over time</CardDescription>
          </div>
          <Tabs 
            value={timelinePeriod} 
            onValueChange={(value) => setTimelinePeriod(value as TimePeriod)}
            className="w-auto"
          >
            <TabsList className="grid w-[180px] grid-cols-3 h-6 sm:h-8">
              <TabsTrigger value="month" className="text-[10px] sm:text-xs px-1 sm:px-2">Month</TabsTrigger>
              <TabsTrigger value="year" className="text-[10px] sm:text-xs px-1 sm:px-2">Year</TabsTrigger>
              <TabsTrigger value="all" className="text-[10px] sm:text-xs px-1 sm:px-2">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[150px] sm:h-[200px]">
            <Line data={timelineData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmotionInsightsEnhanced;
