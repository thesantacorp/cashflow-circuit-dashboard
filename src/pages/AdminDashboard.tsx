
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Chart } from "@/components/ui/chart";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChevronRight } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { state } = useTransactions();
  const { transactions, categories } = state;
  const { currencySymbol } = useCurrency();
  
  // Retrieve usage data from localStorage
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
      const sessions = localStorage.getItem('sessions') ? JSON.parse(localStorage.getItem('sessions')!) : [];
      const users = new Set(sessions.map((s: any) => s.userId));
      
      // Calculate average session duration
      let totalDuration = 0;
      sessions.forEach((session: any) => {
        if (session.duration) {
          totalDuration += session.duration;
        }
      });
      
      const avgDuration = sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0;
      
      // Find last active time
      const lastSession = sessions.sort((a: any, b: any) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )[0];
      
      setUsageStats({
        totalSessions: sessions.length,
        averageSessionDuration: avgDuration,
        uniqueUsers: users.size,
        lastActive: lastSession ? format(new Date(lastSession.startTime), 'MMM dd, yyyy HH:mm') : 'Never',
        transactionsCount: transactions.length,
        categoriesCount: categories.length
      });
    }
  }, [isAuthenticated, transactions.length, categories.length]);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check hardcoded credentials (using the same as notification dashboard for consistency)
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
  
  // Prepare data for charts
  const getMonthlyTransactionData = () => {
    const monthlyData: { [key: string]: { expenses: number, income: number } } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(month, "MMM yyyy");
      monthlyData[monthKey] = { expenses: 0, income: 0 };
    }
    
    // Fill with transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      // Only include last 6 months
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
    
    // Convert to array for recharts
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
      if (category) {
        if (!categoryTotals[category.name]) {
          categoryTotals[category.name] = 0;
        }
        categoryTotals[category.name] += transaction.amount;
      }
    });
    
    return Object.keys(categoryTotals)
      .map(name => ({ name, value: categoryTotals[name] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              <div className="flex justify-between">
                <Button type="submit">Login</Button>
                <Button type="button" variant="outline" onClick={handleBackToApp}>
                  Back to App
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGoToNotifications}>
            Notifications Admin
          </Button>
          <Button variant="outline" onClick={handleBackToApp}>
            Back to App
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last active: {usageStats.lastActive}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg. session: {usageStats.averageSessionDuration} minutes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.transactionsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {usageStats.categoriesCount} categories
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="users">User Activities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Transaction Volume</CardTitle>
                <CardDescription>Income vs Expenses over last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getMonthlyTransactionData()}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, '']}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Bar dataKey="income" name="Income" fill="#27ae60" />
                      <Bar dataKey="expenses" name="Expenses" fill="#e74c3c" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
                <CardDescription>Highest transaction volume by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getCategoryDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getCategoryDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${currencySymbol}${value.toFixed(2)}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="insights">
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
                    Overall, users are saving {transactions.length > 0 ? 
                      `${Math.round((1 - (getTotalByType("expense") / getTotalByType("income"))) * 100)}%` : 
                      'N/A'} of their income.
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: transactions.length > 0 ? 
                          `${Math.min(100, Math.round((1 - (getTotalByType("expense") / getTotalByType("income"))) * 100))}%` : 
                          '0%'
                      }}
                    />
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Transaction Frequency</h3>
                  <p className="text-sm text-muted-foreground">
                    Average of {transactions.length > 0 ? 
                      (transactions.length / Math.max(1, usageStats.uniqueUsers)).toFixed(1) : 
                      '0'} transactions per user.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Category Diversity</h3>
                  <p className="text-sm text-muted-foreground">
                    Users are tracking finances across {categories.length} different categories.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Sessions</CardTitle>
              <CardDescription>
                Activity patterns and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats.totalSessions > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border-b">
                    <div>
                      <h3 className="font-medium">Session Statistics</h3>
                      <p className="text-sm text-muted-foreground">
                        {usageStats.totalSessions} total sessions from {usageStats.uniqueUsers} unique users
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border-b">
                    <div>
                      <h3 className="font-medium">Average Session Duration</h3>
                      <p className="text-sm text-muted-foreground">
                        {usageStats.averageSessionDuration} minutes per session
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex justify-between items-center p-3">
                    <div>
                      <h3 className="font-medium">Latest Activity</h3>
                      <p className="text-sm text-muted-foreground">
                        Last active: {usageStats.lastActive}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  No session data available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function to calculate total by type
const getTotalByType = (transactions: any[], type: string) => {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
};

export default AdminDashboard;
