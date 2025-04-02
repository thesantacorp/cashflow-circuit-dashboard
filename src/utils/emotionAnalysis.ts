
import { Transaction, EmotionalState, EmotionInsight, Category } from "@/types";

// Calculate spending by category for a specific emotion vs. overall
export function analyzeEmotionalSpending(
  transactions: Transaction[],
  categories: Category[]
): {
  emotionInsights: EmotionInsight[];
  emotionDistribution: Record<string, number>;
  emotionSpending: Record<string, number>;
  averageSpending: number;
} {
  const insights: EmotionInsight[] = [];
  const emotionDistribution: Record<string, number> = {};
  const emotionSpending: Record<string, number> = {};
  let totalEmotionalSpending = 0;
  let totalEmotionalTransactions = 0;

  // Filter out transactions without emotional state
  const transactionsWithEmotion = transactions.filter(
    (t) => t.type === "expense" && t.emotionalState && t.emotionalState !== "neutral"
  );
  
  if (transactionsWithEmotion.length < 5) {
    return { 
      emotionInsights: [], 
      emotionDistribution: {}, 
      emotionSpending: {}, 
      averageSpending: 0 
    };
  }

  // Calculate emotion distribution and spending
  transactionsWithEmotion.forEach(t => {
    if (t.emotionalState) {
      if (!emotionDistribution[t.emotionalState]) {
        emotionDistribution[t.emotionalState] = 0;
        emotionSpending[t.emotionalState] = 0;
      }
      emotionDistribution[t.emotionalState]++;
      emotionSpending[t.emotionalState] += t.amount;
      totalEmotionalSpending += t.amount;
      totalEmotionalTransactions++;
    }
  });

  // Calculate average spending per transaction
  const averageSpending = totalEmotionalTransactions > 0 
    ? totalEmotionalSpending / totalEmotionalTransactions 
    : 0;

  // Calculate average spending by category
  const categorySpending: Record<string, number> = {};
  const categoryTransactionCount: Record<string, number> = {};

  // Group expenses by category
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      if (!categorySpending[t.categoryId]) {
        categorySpending[t.categoryId] = 0;
        categoryTransactionCount[t.categoryId] = 0;
      }
      categorySpending[t.categoryId] += t.amount;
      categoryTransactionCount[t.categoryId]++;
    });

  // Calculate average spending per category
  const categoryAverage: Record<string, number> = {};
  Object.keys(categorySpending).forEach((catId) => {
    if (categoryTransactionCount[catId] > 0) {
      categoryAverage[catId] = categorySpending[catId] / categoryTransactionCount[catId];
    }
  });

  // For each emotion, analyze spending patterns
  const emotions: EmotionalState[] = ["happy", "stressed", "bored", "excited", "sad"];
  emotions.forEach((emotion) => {
    const emotionTransactions = transactionsWithEmotion.filter(
      (t) => t.emotionalState === emotion
    );
    if (emotionTransactions.length < 3) return; // Not enough data for this emotion

    // Calculate emotion-specific spending by category
    const emotionCategorySpending: Record<string, number> = {};
    const emotionCategoryCount: Record<string, number> = {};

    emotionTransactions.forEach((t) => {
      if (!emotionCategorySpending[t.categoryId]) {
        emotionCategorySpending[t.categoryId] = 0;
        emotionCategoryCount[t.categoryId] = 0;
      }
      emotionCategorySpending[t.categoryId] += t.amount;
      emotionCategoryCount[t.categoryId]++;
    });

    // Calculate emotion-specific average
    Object.keys(emotionCategorySpending).forEach((catId) => {
      if (
        emotionCategoryCount[catId] > 2 && // At least 3 transactions in this category
        categoryAverage[catId] // There's an overall average to compare with
      ) {
        const emotionAverage = emotionCategorySpending[catId] / emotionCategoryCount[catId];
        const percentageIncrease = ((emotionAverage - categoryAverage[catId]) / categoryAverage[catId]) * 100;

        // Only add insights for significant differences (>10%)
        if (Math.abs(percentageIncrease) > 10) {
          const category = categories.find((c) => c.id === catId);
          if (category) {
            const message = 
              percentageIncrease > 0 
                ? `You spend ${Math.round(percentageIncrease)}% more on ${category.name} when ${emotion}`
                : `You spend ${Math.round(Math.abs(percentageIncrease))}% less on ${category.name} when ${emotion}`;
              
            insights.push({
              emotion,
              category: category.name,
              percentageIncrease: Math.round(percentageIncrease),
              message,
            });
          }
        }
      }
    });
  });

  // Sort insights by absolute percentage difference (descending)
  const sortedInsights = insights.sort((a, b) => 
    Math.abs(b.percentageIncrease) - Math.abs(a.percentageIncrease)
  );

  return {
    emotionInsights: sortedInsights,
    emotionDistribution,
    emotionSpending,
    averageSpending
  };
}

export function getPurchaseWarning(
  categoryId: string,
  emotionalState: EmotionalState,
  transactions: Transaction[],
  categories: Category[]
): string | null {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;

  // Get all transactions for this category
  const categoryTransactions = transactions.filter(
    (t) => t.categoryId === categoryId && t.emotionalState
  );
  if (categoryTransactions.length < 5) return null; // Not enough data
  
  // Count regretted purchases (those that were later deleted)
  const emotionsCount: Record<EmotionalState, number> = {
    happy: 0,
    stressed: 0,
    bored: 0,
    excited: 0,
    sad: 0,
    neutral: 0,
  };

  categoryTransactions.forEach((t) => {
    if (t.emotionalState) {
      emotionsCount[t.emotionalState]++;
    }
  });

  // Find the most common emotion for this category
  const mostCommonEmotion = Object.entries(emotionsCount).reduce(
    (max, [emotion, count]) => (count > max[1] ? [emotion, count] : max),
    ["", 0]
  )[0] as EmotionalState;

  // If current emotion matches the most common emotion and it's not a positive emotion
  if (
    emotionalState === mostCommonEmotion &&
    ["stressed", "bored", "excited", "sad"].includes(emotionalState) &&
    emotionsCount[emotionalState] >= 3
  ) {
    return `You often make ${category.name} purchases when ${emotionalState}. Take a moment to consider if you really need this.`;
  }

  return null;
}

export const getEmotionInsights = (transactions: Transaction[]): EmotionInsight[] => {
  // Simple implementation that returns an empty array for now
  return [];
};
