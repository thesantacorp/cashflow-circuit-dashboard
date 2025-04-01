
import React, { useState, useEffect } from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingDown, ArrowRight, RefreshCw } from "lucide-react";
import { format, subDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";

const SpendingRecommendations: React.FC = () => {
  const { state, getTotalByType } = useTransactions();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMobile = useIsMobile();

  // Generate spending recommendations based on transaction history
  useEffect(() => {
    const generateRecommendations = () => {
      const recommendations: string[] = [];
      const { transactions, categories } = state;
      
      if (transactions.length < 5) {
        recommendations.push("Add more transactions to receive personalized recommendations.");
        return recommendations;
      }

      // Get expense transactions sorted by date (newest first)
      const expenseTransactions = transactions
        .filter(t => t.type === "expense")
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate total expenses and income
      const totalExpenses = getTotalByType("expense");
      const totalIncome = getTotalByType("income");

      // Group expenses by category
      const categorySpending: Record<string, { total: number, count: number, name: string }> = {};
      
      expenseTransactions.forEach(transaction => {
        const category = categories.find(c => c.id === transaction.categoryId);
        if (!category) return;
        
        if (!categorySpending[category.id]) {
          categorySpending[category.id] = { 
            total: 0, 
            count: 0, 
            name: category.name 
          };
        }
        
        categorySpending[category.id].total += transaction.amount;
        categorySpending[category.id].count += 1;
      });

      // Find top spending categories
      const topCategories = Object.values(categorySpending)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      // Last 7 days spending
      const last7Days = subDays(new Date(), 7);
      const recentSpending = expenseTransactions
        .filter(t => new Date(t.date) >= last7Days)
        .reduce((sum, t) => sum + t.amount, 0);

      // Repeat purchases check - look for frequent small purchases in the same category
      const frequentSmallPurchases = Object.values(categorySpending)
        .filter(cat => cat.count >= 3 && cat.total / cat.count < 20)
        .sort((a, b) => b.count - a.count);

      // Check savings ratio
      const savingsRatio = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;

      // Emotional spending patterns
      const emotionalSpending = expenseTransactions
        .filter(t => ["stressed", "bored", "sad"].includes(t.emotionalState || ""))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const emotionalRatio = totalExpenses > 0 ? emotionalSpending / totalExpenses : 0;

      // Add recommendations based on analysis
      if (topCategories.length > 0) {
        recommendations.push(`Your top spending category is ${topCategories[0].name}. Consider setting a budget for this category to manage expenses better.`);
      }

      if (frequentSmallPurchases.length > 0) {
        recommendations.push(`You make frequent small purchases in ${frequentSmallPurchases[0].name}. These small expenses add up to ${frequentSmallPurchases[0].total.toFixed(2)} over time.`);
      }

      if (savingsRatio < 0.2 && totalIncome > 0) {
        recommendations.push(`You're currently saving ${(savingsRatio * 100).toFixed(1)}% of your income. Try to aim for at least 20% savings rate.`);
      }

      if (emotionalRatio > 0.3) {
        recommendations.push(`${(emotionalRatio * 100).toFixed(1)}% of your spending happens when feeling stressed, bored, or sad. Consider waiting 24 hours before making purchases when in these emotional states.`);
      }

      if (recentSpending > totalIncome * 0.5 && totalIncome > 0) {
        recommendations.push(`Your spending has been high in the last 7 days (${recentSpending.toFixed(2)}). Consider slowing down for the rest of the month.`);
      }

      // Ensure we have at least one recommendation
      if (recommendations.length === 0) {
        recommendations.push("Keep tracking your expenses to receive more personalized recommendations.");
      }

      return recommendations;
    };

    // Check if we should update recommendations
    const storedLastUpdate = localStorage.getItem("recommendationsLastUpdate");
    const now = new Date();
    let shouldUpdate = true;

    if (storedLastUpdate) {
      const lastUpdate = new Date(storedLastUpdate);
      const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      shouldUpdate = daysSinceUpdate >= 1; // Update if it's been at least 1 day
    }

    if (shouldUpdate) {
      const newRecommendations = generateRecommendations();
      setRecommendations(newRecommendations);
      setLastUpdated(now);
      localStorage.setItem("recommendationsLastUpdate", now.toISOString());
    } else if (storedLastUpdate) {
      setLastUpdated(new Date(storedLastUpdate));
    }
  }, [state, getTotalByType]);

  const handleRefresh = () => {
    const now = new Date();
    const newRecommendations = generateRecommendations();
    setRecommendations(newRecommendations);
    setLastUpdated(now);
    localStorage.setItem("recommendationsLastUpdate", now.toISOString());
  };

  // Function to generate recommendations based on transaction data
  const generateRecommendations = () => {
    // This is a simplified version of what's in the useEffect
    const recommendations: string[] = [];
    const { transactions, categories } = state;
    
    if (transactions.length < 5) {
      recommendations.push("Add more transactions to receive personalized recommendations.");
      return recommendations;
    }

    // Category analysis
    const categorySpending: Record<string, { total: number, name: string }> = {};
    transactions
      .filter(t => t.type === "expense")
      .forEach(transaction => {
        const category = categories.find(c => c.id === transaction.categoryId);
        if (!category) return;
        
        if (!categorySpending[category.id]) {
          categorySpending[category.id] = { total: 0, name: category.name };
        }
        
        categorySpending[category.id].total += transaction.amount;
      });

    const sortedCategories = Object.values(categorySpending)
      .sort((a, b) => b.total - a.total);

    if (sortedCategories.length > 0) {
      recommendations.push(`Your highest spending category is ${sortedCategories[0].name}. Consider setting a budget limit for this category.`);
    }

    // Total expenses vs income
    const totalExpenses = getTotalByType("expense");
    const totalIncome = getTotalByType("income");
    
    if (totalIncome > 0 && totalExpenses > totalIncome * 0.9) {
      recommendations.push(`You're spending ${(totalExpenses / totalIncome * 100).toFixed(1)}% of your income. Aim to keep this below 90% to build savings.`);
    }

    // Emotional spending
    const emotionalSpending = transactions
      .filter(t => ["stressed", "bored", "sad"].includes(t.emotionalState || ""))
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (emotionalSpending > totalExpenses * 0.25) {
      recommendations.push(`${(emotionalSpending / totalExpenses * 100).toFixed(1)}% of your spending happens when you're not in a positive emotional state. Try setting a 24-hour waiting period for purchases made during these times.`);
    }

    // Ensure we have at least one recommendation
    if (recommendations.length === 0) {
      recommendations.push("Keep tracking your expenses consistently to receive more tailored recommendations.");
    }

    return recommendations;
  };

  return (
    <Card className="mt-6 border-green-200">
      <CardHeader className="border-b border-green-100 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Lightbulb size={18} />
            AI Spending Recommendations
          </CardTitle>
          <button 
            onClick={handleRefresh} 
            className="rounded-full hover:bg-green-50 p-1"
            aria-label="Refresh recommendations"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <CardDescription>
          {lastUpdated ? (
            `Last updated: ${format(lastUpdated, "MMM d, yyyy")}`
          ) : (
            "Personalized insights updated daily"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div 
                key={index} 
                className="p-3 border rounded-lg bg-green-50/40 flex items-start gap-2"
              >
                <TrendingDown className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="warning" className="bg-yellow-50">
            <AlertDescription>
              Add more transactions to receive personalized spending recommendations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingRecommendations;
