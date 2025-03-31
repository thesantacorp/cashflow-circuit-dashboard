
import { Transaction, EmotionalState, Category, EmotionTrend } from "@/types";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";

// Time period types
export type TimePeriod = "week" | "month" | "year";

// Get transactions for a specific time period
export function getTransactionsForPeriod(
  transactions: Transaction[],
  period: TimePeriod,
  date: Date = new Date()
): Transaction[] {
  let startDate: Date;
  let endDate: Date;
  
  switch (period) {
    case "week":
      startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
      endDate = endOfWeek(date, { weekStartsOn: 1 });
      break;
    case "month":
      startDate = startOfMonth(date);
      endDate = endOfMonth(date);
      break;
    case "year":
      startDate = startOfYear(date);
      endDate = endOfYear(date);
      break;
  }
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });
}

// Analyze emotion trends for a specific time period
export function analyzeEmotionTrends(
  transactions: Transaction[],
  period: TimePeriod,
  date: Date = new Date()
): EmotionTrend[] {
  const filteredTransactions = getTransactionsForPeriod(transactions, period, date);
  
  // Get all transactions with emotions
  const transactionsWithEmotion = filteredTransactions.filter(t => 
    t.type === "expense" && t.emotionalState && t.emotionalState !== "neutral"
  );
  
  if (transactionsWithEmotion.length === 0) {
    return [];
  }
  
  // Count emotions
  const emotionCounts: Record<EmotionalState, number> = {
    happy: 0,
    stressed: 0,
    bored: 0,
    excited: 0,
    sad: 0,
    neutral: 0
  };
  
  // Total spending by emotion
  const emotionSpending: Record<EmotionalState, number> = {
    happy: 0,
    stressed: 0,
    bored: 0,
    excited: 0,
    sad: 0,
    neutral: 0
  };
  
  // Calculate emotion counts and spending
  transactionsWithEmotion.forEach(t => {
    if (t.emotionalState) {
      emotionCounts[t.emotionalState]++;
      emotionSpending[t.emotionalState] += t.amount;
    }
  });
  
  // Convert to array of trends
  const trends: EmotionTrend[] = Object.entries(emotionCounts)
    .filter(([emotion, count]) => emotion !== 'neutral' && count > 0)
    .map(([emotion, count]) => {
      const totalSpent = emotionSpending[emotion as EmotionalState];
      const percentage = Math.round((count / transactionsWithEmotion.length) * 100);
      return {
        emotion: emotion as EmotionalState,
        count,
        percentage,
        totalSpent,
        averageSpent: count > 0 ? totalSpent / count : 0,
      };
    })
    .sort((a, b) => b.count - a.count);
  
  return trends;
}

// Get the dominant emotion for a time period
export function getDominantEmotion(
  transactions: Transaction[],
  period: TimePeriod,
  date: Date = new Date()
): EmotionalState | null {
  const trends = analyzeEmotionTrends(transactions, period, date);
  
  if (trends.length === 0) {
    return null;
  }
  
  return trends[0].emotion;
}

// Compare emotions across different periods
export function compareEmotionTrends(
  transactions: Transaction[],
  currentPeriod: TimePeriod,
  previousPeriod: TimePeriod
): { current: EmotionTrend[], previous: EmotionTrend[] } {
  const now = new Date();
  
  // Get trends for current period
  const currentTrends = analyzeEmotionTrends(transactions, currentPeriod, now);
  
  // Get date for previous period
  let previousDate: Date;
  switch (previousPeriod) {
    case "week":
      previousDate = new Date(now);
      previousDate.setDate(previousDate.getDate() - 7);
      break;
    case "month":
      previousDate = new Date(now);
      previousDate.setMonth(previousDate.getMonth() - 1);
      break;
    case "year":
      previousDate = new Date(now);
      previousDate.setFullYear(previousDate.getFullYear() - 1);
      break;
    default:
      previousDate = now;
  }
  
  // Get trends for previous period
  const previousTrends = analyzeEmotionTrends(transactions, previousPeriod, previousDate);
  
  return {
    current: currentTrends,
    previous: previousTrends
  };
}
