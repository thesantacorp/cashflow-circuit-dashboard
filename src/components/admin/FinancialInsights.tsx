
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FinancialInsightsProps {
  savingsRate: number;
  transactionsPerUser: number;
  categoryCount: number;
  hasTransactions: boolean;
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ 
  savingsRate, 
  transactionsPerUser, 
  categoryCount,
  hasTransactions 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Insights</CardTitle>
        <CardDescription>
          Key metrics and trends based on user data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Savings Rate</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Overall, users are saving {hasTransactions ? 
                `${Math.round(savingsRate * 100)}%` : 
                'N/A'} of their income.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ 
                  width: hasTransactions ? 
                    `${Math.min(100, Math.round(savingsRate * 100))}%` : 
                    '0%'
                }}
              />
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Transaction Frequency</h3>
            <p className="text-sm text-muted-foreground">
              Average of {hasTransactions ? 
                transactionsPerUser.toFixed(1) : 
                '0'} transactions per user.
            </p>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Category Diversity</h3>
            <p className="text-sm text-muted-foreground">
              Users are tracking finances across {categoryCount} different categories.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialInsights;
