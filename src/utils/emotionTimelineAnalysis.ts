
import { Transaction, EmotionTimelineTrend, EmotionalState, TimePeriod } from "@/types";
import { format, startOfWeek, endOfWeek, addDays, subMonths, subYears, parseISO, isWithinInterval, getWeek, getMonth, getYear } from "date-fns";

// Helper to get the time periods (weeks, months, years)
const getTimePeriods = (transactions: Transaction[], period: TimePeriod): EmotionTimelineTrend[] => {
  const now = new Date();
  
  if (period === "week") {
    // Get data for last 4 weeks
    const periods = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(addDays(now, -7 * i));
      const weekEnd = endOfWeek(addDays(now, -7 * i));
      return {
        start: weekStart,
        end: weekEnd,
        label: `Week ${4 - i}`
      };
    }).reverse();

    return aggregateEmotionsByPeriods(transactions, periods);
  } 
  
  if (period === "month") {
    // Get data for last 12 months
    const periods = Array.from({ length: 12 }, (_, i) => {
      const monthDate = subMonths(now, 11 - i);
      const monthStart = new Date(getYear(monthDate), getMonth(monthDate), 1);
      const monthEnd = new Date(getYear(monthDate), getMonth(monthDate) + 1, 0);
      return {
        start: monthStart,
        end: monthEnd,
        label: format(monthDate, "MMM")
      };
    });

    return aggregateEmotionsByPeriods(transactions, periods);
  }
  
  if (period === "year") {
    // Get data for last 5 years
    const periods = Array.from({ length: 5 }, (_, i) => {
      const yearDate = subYears(now, 4 - i);
      const yearStart = new Date(getYear(yearDate), 0, 1);
      const yearEnd = new Date(getYear(yearDate), 11, 31);
      return {
        start: yearStart,
        end: yearEnd,
        label: getYear(yearDate).toString()
      };
    });

    return aggregateEmotionsByPeriods(transactions, periods);
  }

  // Default to all time (simple aggregation)
  return aggregateAllTimeEmotions(transactions);
};

// Helper to aggregate emotions by defined periods
const aggregateEmotionsByPeriods = (
  transactions: Transaction[], 
  periods: {start: Date, end: Date, label: string}[]
): EmotionTimelineTrend[] => {
  return periods.map(period => {
    const filteredTransactions = transactions.filter(tx => {
      const txDate = parseISO(tx.date);
      return isWithinInterval(txDate, { start: period.start, end: period.end }) && tx.type === "expense";
    });
    
    const result: EmotionTimelineTrend = { period: period.label };
    
    // Count transactions by emotion
    filteredTransactions.forEach(tx => {
      if (tx.emotionalState) {
        if (!result[tx.emotionalState]) {
          result[tx.emotionalState] = 0;
        }
        result[tx.emotionalState] = (result[tx.emotionalState] as number) + tx.amount;
      }
    });
    
    return result;
  });
};

// Helper for all-time emotion aggregation
const aggregateAllTimeEmotions = (transactions: Transaction[]): EmotionTimelineTrend[] => {
  const expenseTransactions = transactions.filter(tx => tx.type === "expense");
  
  const result: EmotionTimelineTrend = { period: "All Time" };
  
  // Count transactions by emotion
  expenseTransactions.forEach(tx => {
    if (tx.emotionalState) {
      if (!result[tx.emotionalState]) {
        result[tx.emotionalState] = 0;
      }
      result[tx.emotionalState] = (result[tx.emotionalState] as number) + tx.amount;
    }
  });
  
  return [result];
};

export const getEmotionTimelineTrends = (
  transactions: Transaction[],
  period: TimePeriod = "month"
): EmotionTimelineTrend[] => {
  return getTimePeriods(transactions, period);
};
