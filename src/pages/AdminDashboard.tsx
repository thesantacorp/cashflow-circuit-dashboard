
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseIcon, DatabaseBackupIcon, UsersIcon, BarChartIcon, Loader2 } from "lucide-react";
import AdminLogin from "@/components/admin/AdminLogin";
import StatCards from "@/components/admin/StatCards";
import DashboardCharts from "@/components/admin/DashboardCharts";
import FinancialInsights from "@/components/admin/FinancialInsights";
import UserSessionsCard from "@/components/admin/UserSessionsCard";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import { fetchDashboardStats, getLocalDataStats } from "@/utils/admin/dashboardStats";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { state } = useTransactions();
  const { transactions, categories } = state;
  const { currencySymbol } = useCurrency();
  
  const [usageStats, setUsageStats] = useState({
    totalSessions: 0,
    averageSessionDuration: 0,
    uniqueUsers: 0,
    lastActive: "",
    transactionsCount: 0,
    categoriesCount: 0
  });
  
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      
      const loadStats = async () => {
        try {
          // Get local stats
          const localStats = getLocalDataStats(transactions, categories);
          
          // Get remote stats
          const remoteStats = await fetchDashboardStats();
          
          // Combine stats
          const sessions = localStorage.getItem('sessions') ? JSON.parse(localStorage.getItem('sessions')!) : [];
          const users = new Set(sessions.map((s: any) => s.userId));
          
          let totalDuration = 0;
          sessions.forEach((session: any) => {
            if (session.duration) {
              totalDuration += session.duration;
            }
          });
          
          const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
          
          setUsageStats({
            totalSessions: remoteStats.sessions.sessionsPerDay.reduce((sum, day) => sum + day.count, 0),
            averageSessionDuration: avgDuration,
            uniqueUsers: remoteStats.userCount,
            lastActive: remoteStats.lastActive,
            transactionsCount: localStats.transactionsCount,
            categoriesCount: localStats.categoriesCount
          });
        } catch (error) {
          console.error("Error loading dashboard stats:", error);
          toast.error("Failed to load some dashboard statistics");
        } finally {
          setIsLoading(false);
        }
      };
      
      loadStats();
    }
  }, [isAuthenticated, transactions.length, categories.length]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "SupErAdmIn" && password === "K9$PzW2e&xL!mG7@sV3#nQ8*tD5^jF6") {
      setIsAuthenticated(true);
      toast.success("Logged in successfully");
    } else {
      toast.error("Invalid username or password");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const handleBackToApp = () => {
    navigate("/");
  };
  
  const handleGoToNotifications = () => {
    navigate("/admin/notifications");
  };
  
  const handleGoToIdeas = () => {
    navigate("/admin/ideas");
  };
  
  const getMonthlyTransactionData = () => {
    const monthlyData: { [key: string]: { expenses: number, income: number } } = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(month, "MMM yyyy");
      monthlyData[monthKey] = { expenses: 0, income: 0 };
    }
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (date >= new Date(now.getFullYear(), now.getMonth() - 5, 1)) {
        const monthKey = format(date, "MMM yyyy");
        if (monthlyData[monthKey]) {
          if (transaction.type === "expense") {
            monthlyData[monthKey].expenses += transaction.amount;
          } else {
            monthlyData[monthKey].income += transaction.amount;
          }
        }
      }
    });
    
    return Object.keys(monthlyData).map(month => ({
      name: month,
      expenses: monthlyData[month].expenses,
      income: monthlyData[month].income
    }));
  };
  
  const getCategoryDistribution = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const category = categories.find(c => c.id === transaction.categoryId);
      if (category && transaction.type === "expense") {
        if (!categoryTotals[category.name]) {
          categoryTotals[category.name] = 0;
        }
        categoryTotals[category.name] += transaction.amount;
      }
    });
    
    return Object.keys(categoryTotals)
      .map(name => ({ name, value: categoryTotals[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getTotalByType = (type: string) => {
    return transactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };
  
  const totalExpense = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const savingsRate = totalIncome > 0 ? (1 - (totalExpense / totalIncome)) : 0;
  const transactionsPerUser = usageStats.uniqueUsers > 0 ? 
    (transactions.length / usageStats.uniqueUsers) : 0;
  const hasTransactions = transactions.length > 0;

  if (!isAuthenticated) {
    return (
      <AdminLogin 
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
        handleLogin={handleLogin}
        handleBackToApp={handleBackToApp}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleGoToIdeas} className="flex items-center">
            <BarChartIcon className="mr-2 h-4 w-4" />
            Manage Ideas
          </Button>
          <Button variant="outline" onClick={handleGoToNotifications} className="flex items-center">
            <DatabaseBackupIcon className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button variant="outline" onClick={handleBackToApp} className="flex items-center">
            <DatabaseIcon className="mr-2 h-4 w-4" />
            Back to App
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <StatCards usageStats={usageStats} />
          
          <Tabs defaultValue="overview" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">
                <BarChartIcon className="mr-2 h-4 w-4 inline" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="insights">
                <DatabaseIcon className="mr-2 h-4 w-4 inline" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="users">
                <UsersIcon className="mr-2 h-4 w-4 inline" />
                User Activities
              </TabsTrigger>
              <TabsTrigger value="admin">
                <DatabaseBackupIcon className="mr-2 h-4 w-4 inline" />
                Admin
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <DashboardCharts 
                monthlyData={getMonthlyTransactionData()}
                categoryData={getCategoryDistribution()}
                currencySymbol={currencySymbol}
              />
            </TabsContent>
            
            <TabsContent value="insights">
              <FinancialInsights 
                savingsRate={savingsRate}
                transactionsPerUser={transactionsPerUser}
                categoryCount={categories.length}
                hasTransactions={hasTransactions}
              />
            </TabsContent>
            
            <TabsContent value="users">
              <UserSessionsCard usageStats={usageStats} />
            </TabsContent>
            
            <TabsContent value="admin">
              <AdminOverviewTab />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
