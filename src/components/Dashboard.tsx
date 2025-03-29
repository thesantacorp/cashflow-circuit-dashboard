
import React from "react";
import { useTransactions } from "@/context/TransactionContext";
import { TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DashboardProps {
  type: TransactionType;
}

const Dashboard: React.FC<DashboardProps> = ({ type }) => {
  const { getTransactionsByType, getCategoriesByType, getCategoryById, getTotalByType } = useTransactions();
  const transactions = getTransactionsByType(type);
  const categories = getCategoriesByType(type);
  const total = getTotalByType(type);

  // Calculate category totals for the pie chart
  const categoryTotals = categories.map((category) => {
    const categoryTransactions = transactions.filter(
      (transaction) => transaction.categoryId === category.id
    );
    const categoryTotal = categoryTransactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );
    return {
      name: category.name,
      value: categoryTotal,
      color: category.color,
    };
  }).filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total {type === "expense" ? "Expenses" : "Income"}
            </CardTitle>
            {type === "expense" ? (
              <ArrowDownIcon className="h-4 w-4 text-expense" />
            ) : (
              <ArrowUpIcon className="h-4 w-4 text-income" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${total.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {type === "expense" ? "Biggest Expense" : "Biggest Income"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <>
                <div className="text-2xl font-bold">
                  ${Math.max(...transactions.map((t) => t.amount)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(() => {
                    const maxTransaction = transactions.reduce((max, t) => 
                      t.amount > max.amount ? t : max, transactions[0]);
                    const category = getCategoryById(maxTransaction.categoryId);
                    return category?.name || "Unknown";
                  })()}
                </p>
              </>
            ) : (
              <div className="text-xl font-bold">$0.00</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {type === "expense" ? "Most Common Expense" : "Most Common Income"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <>
                <div className="text-xl font-bold">
                  {(() => {
                    // Count transactions by category
                    const categoryCount: Record<string, number> = {};
                    transactions.forEach(t => {
                      categoryCount[t.categoryId] = (categoryCount[t.categoryId] || 0) + 1;
                    });
                    
                    // Find the most common category
                    let maxCount = 0;
                    let mostCommonCategoryId = "";
                    Object.entries(categoryCount).forEach(([categoryId, count]) => {
                      if (count > maxCount) {
                        maxCount = count;
                        mostCommonCategoryId = categoryId;
                      }
                    });
                    
                    const category = getCategoryById(mostCommonCategoryId);
                    return category?.name || "None";
                  })()}
                </div>
              </>
            ) : (
              <div className="text-xl font-bold">None</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>
            {type === "expense" ? "Expenses" : "Income"} by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryTotals.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-16">
              No data available for chart
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
