
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

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
  const savingsRatePercent = hasTransactions ? Math.round(savingsRate * 100) : 0;
  const savingsHealth = savingsRatePercent >= 20 ? 'good' : savingsRatePercent >= 10 ? 'medium' : 'poor';
  
  const getSavingsMessage = () => {
    if (!hasTransactions) return "No transaction data available";
    if (savingsRatePercent >= 20) return "Excellent savings rate! Users are saving well.";
    if (savingsRatePercent >= 10) return "Moderate savings rate. Room for improvement.";
    if (savingsRatePercent > 0) return "Low savings rate. Users need to save more.";
    return "Negative savings rate. Users are spending more than they earn.";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Health Indicators</CardTitle>
        <CardDescription>
          Key metrics and insights based on user data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Average Savings Rate</h3>
              {savingsHealth === 'good' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : savingsHealth === 'medium' ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {getSavingsMessage()}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {hasTransactions ? `${savingsRatePercent}%` : 'N/A'}
                </span>
                <span className="text-xs text-muted-foreground">Target: 20%</span>
              </div>
              <Progress 
                value={savingsRatePercent} 
                max={100}
                className={`h-2 ${
                  savingsHealth === 'good' 
                    ? 'bg-gray-200 [&>div]:bg-green-500' 
                    : savingsHealth === 'medium'
                    ? 'bg-gray-200 [&>div]:bg-amber-500'
                    : 'bg-gray-200 [&>div]:bg-red-500'
                }`}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
                <span>20%+</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium mb-2">Transaction Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Average of {hasTransactions ? 
                      transactionsPerUser.toFixed(1) : 
                      '0'} transactions per user
                  </p>
                </div>
                {transactionsPerUser > 5 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-1">Activity level:</div>
                <div className="grid grid-cols-5 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1.5 rounded-full ${
                        transactionsPerUser > i * 5
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium mb-2">Category Diversity</h3>
                  <p className="text-sm text-muted-foreground">
                    Users are tracking across {categoryCount} different categories
                  </p>
                </div>
                {categoryCount > 7 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-xs text-muted-foreground mb-1">Diversity score:</div>
                <Progress 
                  value={Math.min(100, categoryCount * 10)} 
                  max={100}
                  className="h-1.5 bg-gray-200 [&>div]:bg-blue-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Basic</span>
                  <span>Diverse</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Insights Summary</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start">
                <div className="min-w-4 h-4 mt-0.5 mr-2 rounded-full bg-blue-500" />
                {hasTransactions ? (
                  savingsRatePercent > 0 ? (
                    `Users are saving ${savingsRatePercent}% of their income on average`
                  ) : (
                    `Users are spending more than they earn - negative savings rate`
                  )
                ) : (
                  'No transaction data available to calculate savings rate'
                )}
              </li>
              <li className="flex items-start">
                <div className="min-w-4 h-4 mt-0.5 mr-2 rounded-full bg-green-500" />
                {categoryCount > 0 ? (
                  `${categoryCount} categories being used for financial tracking`
                ) : (
                  'No categories have been defined yet'
                )}
              </li>
              <li className="flex items-start">
                <div className="min-w-4 h-4 mt-0.5 mr-2 rounded-full bg-orange-500" />
                {transactionsPerUser > 0 ? (
                  transactionsPerUser > 10 ? (
                    'High level of user engagement with the app'
                  ) : (
                    'Moderate level of user engagement - opportunity to increase'
                  )
                ) : (
                  'No user engagement data available'
                )}
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialInsights;
