
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";
import { useTransactions } from "@/context/transaction";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const IncomeInsights: React.FC = () => {
  const { state, getCategoriesByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  // Get income categories and transactions
  const incomeCategories = getCategoriesByType("income");
  const incomeTransactions = state.transactions.filter(t => t.type === "income");
  
  // Calculate income by category
  const incomeByCategory = incomeCategories.map(category => {
    const amount = incomeTransactions
      .filter(t => t.categoryId === category.id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      id: category.id,
      name: category.name,
      value: amount,
      color: category.color
    };
  }).filter(item => item.value > 0);
  
  // Sort by highest amount
  incomeByCategory.sort((a, b) => b.value - a.value);
  
  // Generate income growth recommendations based on categories
  const generateRecommendations = () => {
    if (incomeByCategory.length === 0) {
      return [
        "Start by adding your income sources to get personalized recommendations",
        "Try categorizing your income to better understand your financial patterns",
        "Track your income regularly to see trends and growth opportunities"
      ];
    }
    
    const recommendations = [];
    const topCategory = incomeByCategory[0];
    const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.value, 0);
    
    // Add general recommendations
    recommendations.push(
      `Your main income source is "${topCategory.name}". Consider exploring ways to increase this revenue stream.`
    );
    
    // Add diversification recommendation if one category dominates
    if (topCategory.value > totalIncome * 0.7) {
      recommendations.push(
        "Your income appears to be heavily dependent on one source. Consider diversifying your income streams to reduce financial risk."
      );
    }
    
    // Add frequency recommendation
    const regularIncome = incomeTransactions.filter(t => {
      const date = new Date(t.date);
      const currentDate = new Date();
      return date.getMonth() === currentDate.getMonth() || 
             date.getMonth() === currentDate.getMonth() - 1;
    });
    
    if (regularIncome.length < 3) {
      recommendations.push(
        "Consider adding more regular income sources to improve financial stability."
      );
    }
    
    // Add growth recommendation
    if (incomeCategories.length < 3) {
      recommendations.push(
        "Look for additional income opportunities such as freelancing, investments, or passive income streams."
      );
    }
    
    return recommendations;
  };

  const recommendations = generateRecommendations();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeByCategory.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No income sources found. Add income transactions to see insights.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Growth Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 list-disc pl-5">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-sm text-muted-foreground">
                {recommendation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncomeInsights;
