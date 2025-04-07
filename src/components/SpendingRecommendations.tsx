
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleDollarSign, TrendingDown, History, Coffee, ShoppingCart, UtensilsCrossed, Car, Home, Shirt, Heart } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";

const SpendingInsights = [
  {
    title: "Coffee Budget Tip",
    description: "Consider making coffee at home a few days a week. You could save up to 15% of your monthly food budget.",
    icon: Coffee
  },
  {
    title: "Subscription Audit",
    description: "Review your monthly subscriptions. Cancelling unused ones could free up funds for savings.",
    icon: CircleDollarSign
  },
  {
    title: "Comparison Shopping",
    description: "Compare prices before major purchases. This simple habit can save you 10-30% on average.",
    icon: ShoppingCart
  },
  {
    title: "Meal Planning",
    description: "Planning meals in advance can reduce food waste and impulse buying at grocery stores.",
    icon: UtensilsCrossed
  },
  {
    title: "Transportation Savings",
    description: "Consider carpooling or public transit once a week to reduce transportation costs.",
    icon: Car
  },
  {
    title: "Energy Efficiency",
    description: "Lowering your thermostat by 1-2 degrees can save up to 10% on your heating bill.",
    icon: Home
  },
  {
    title: "Second-hand Shopping",
    description: "For items you don't need brand new, consider second-hand options to save significantly.",
    icon: Shirt
  },
  {
    title: "Self-care Budget",
    description: "Allocate a small monthly budget for self-care. It prevents impulse spending on feel-good purchases.",
    icon: Heart
  },
  {
    title: "24-Hour Rule",
    description: "For non-essential purchases, wait 24 hours before buying to avoid impulse spending.",
    icon: History
  },
  {
    title: "Cashback Benefits",
    description: "Use credit cards with cashback for regular purchases, but pay them off fully each month.",
    icon: TrendingDown
  }
];

const SpendingRecommendations: React.FC = () => {
  const { state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const [rotatingInsights, setRotatingInsights] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Select relevant insights based on transaction data
  useEffect(() => {
    // Get today's date to use as a seed for deterministic but changing insights
    const today = new Date();
    const dayOfYear = today.getFullYear() * 1000 + today.getMonth() * 100 + today.getDate();
    
    // Use the day of year to select 3 insights from the list
    const selectedIndices = [];
    let modifiedDay = dayOfYear;
    
    for (let i = 0; i < 3; i++) {
      const selectedIndex = modifiedDay % SpendingInsights.length;
      selectedIndices.push(selectedIndex);
      modifiedDay = Math.floor(modifiedDay / 3); // Modify for next selection
    }
    
    // Get the selected insights and set them
    const selected = selectedIndices.map(index => SpendingInsights[index]);
    setRotatingInsights(selected);

    // Reset current index when insights change
    setCurrentIndex(0);
  }, []);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <TrendingDown className="h-5 w-5 mr-2 text-emerald-500" />
          Spending Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rotatingInsights.length > 0 ? (
          <div className="space-y-4">
            {rotatingInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="bg-slate-100 p-2 rounded-full">
                  <insight.icon className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{insight.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-slate-500">
            Loading personalized insights...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingRecommendations;
