
import React from "react";
import { useTransactions } from "@/context/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { useCurrency } from "@/context/CurrencyContext";
import DataExportImport from "@/components/DataExportImport";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import { useIsMobile } from "@/hooks/use-mobile";

const OverviewPage: React.FC = () => {
  const { state, getTotalByType } = useTransactions();
  const { transactions, categories } = state;
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  // Last 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Generate monthly data for chart
  const getMonthlyData = () => {
    const last6Months: { name: string; expenses: number; income: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = format(month, "MMM");
      
      const monthExpenses = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            t.type === "expense" &&
            transactionDate.getMonth() === month.getMonth() &&
            transactionDate.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthIncome = transactions
        .filter((t) => {
          const transactionDate = new Date(t.date);
          return (
            t.type === "income" &&
            transactionDate.getMonth() === month.getMonth() &&
            transactionDate.getFullYear() === month.getFullYear()
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);
        
      last6Months.push({
        name: monthName,
        expenses: monthExpenses,
        income: monthIncome
      });
    }
    
    return last6Months;
  };

  const monthlyData = getMonthlyData();

  return (
    <div className="container py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Financial Overview</h1>
      
      <div className="grid gap-6 mb-8 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-income" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {state.categories.filter(c => c.type === "income").length} income sources
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-expense" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencySymbol}{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {state.categories.filter(c => c.type === "expense").length} expense categories
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <TrendingUpIcon className={`h-4 w-4 ${balance >= 0 ? "text-income" : "text-expense"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-income" : "text-expense"}`}>
              {currencySymbol}{balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balance >= 0 ? "Surplus" : "Deficit"}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 mb-8 md:grid-cols-2">
        <Card className="col-span-full md:col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#27ae60" />
                  <Bar dataKey="expenses" name="Expenses" fill="#e74c3c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Link to="/expenses">
                <Button variant="outline" size="sm">View Expenses</Button>
              </Link>
              <Link to="/income">
                <Button variant="outline" size="sm">View Income</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const category = categories.find(c => c.id === transaction.categoryId);
                  return (
                    <div
                      key={transaction.id}
                      className="flex flex-wrap items-center justify-between p-3 border rounded-lg"
                      style={{
                        borderLeftColor: category?.color || "#ccc",
                        borderLeftWidth: "4px",
                      }}
                    >
                      <div className="flex flex-col mr-2 mb-2 sm:mb-0 max-w-[70%]">
                        <span className="font-medium break-words">
                          {category?.name || "Unknown Category"}
                        </span>
                        <span className="text-sm text-muted-foreground break-words">
                          {transaction.description || "No description"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          transaction.type === "expense" ? "text-expense" : "text-income"
                        }`}
                      >
                        {transaction.type === "expense" ? "-" : "+"}{currencySymbol}{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No transactions found.
              </p>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link to="/expenses">
                <Button className="w-full bg-expense hover:bg-expense/90">
                  <ArrowDownIcon className="h-4 w-4 mr-2" />
                  Add New Expense
                </Button>
              </Link>
              <Link to="/income">
                <Button className="w-full bg-income hover:bg-income/90">
                  <ArrowUpIcon className="h-4 w-4 mr-2" />
                  Add New Income
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {!isMobile && (
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <DataExportImport />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {!isMobile && (
        <div className="mt-8">
          <LocalStorageInfo />
        </div>
      )}
    </div>
  );
};

export default OverviewPage;
