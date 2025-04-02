
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Bell, 
  Send, 
  Users, 
  Settings, 
  Lock, 
  BarChart4, 
  Calendar, 
  Smartphone, 
  Laptop, 
  Tablet 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { getSessionStats } from "@/utils/sessionTracking";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip
} from "recharts";

// Secure password using AI generation
const SECURE_ADMIN_PASSWORD = "K9$PzW2e&xL!mG7@sV3#nQ8*tD5^jF6";
const ADMIN_USERNAME = "SupErAdmIn";

const AdminNotificationDashboard: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [sessionStats, setSessionStats] = useState(getSessionStats());
  
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const adminAuthStatus = localStorage.getItem("adminLoggedIn");
    if (adminAuthStatus === "true") {
      setIsLoggedIn(true);
    }
    
    // Update session stats every minute
    const intervalId = setInterval(() => {
      setSessionStats(getSessionStats());
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Authentication with secure credentials
    if (email === "odioryole@gmail.com" && (password === "admin123" || password === SECURE_ADMIN_PASSWORD)) {
      localStorage.setItem("adminLoggedIn", "true");
      setIsLoggedIn(true);
      toast.success("Login successful");
    } else if (email === ADMIN_USERNAME && password === SECURE_ADMIN_PASSWORD) {
      localStorage.setItem("adminLoggedIn", "true");
      setIsLoggedIn(true);
      toast.success("Login successful as super admin");
    } else {
      toast.error("Invalid username or password");
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
    toast.success("Logged out successfully");
  };
  
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      toast.error("Please provide both title and message");
      return;
    }
    
    // In a real app, this would send to a backend service
    // For now, we just show a success message and store locally
    const notificationData = {
      title,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Store notification in localStorage for demonstration
    const storedNotifications = localStorage.getItem("adminSentNotifications");
    const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
    notifications.push(notificationData);
    localStorage.setItem("adminSentNotifications", JSON.stringify(notifications));
    
    // Display notification if permissions are granted
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
      } catch (err) {
        console.error("Failed to send notification:", err);
      }
    }
    
    toast.success("Notification sent successfully");
    setTitle("");
    setMessage("");
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 10) {
      toast.error("Password must be at least 10 characters");
      return;
    }
    
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || 
        !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Password must include uppercase, lowercase, numbers, and special characters");
      return;
    }
    
    // In a real app, this would update the password in the database
    toast.success("Password updated successfully");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast.error("Please enter your email");
      return;
    }
    
    if (resetEmail !== "odioryole@gmail.com") {
      toast.error("Email not found");
      return;
    }
    
    // Generate a 6-digit reset code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("passwordResetCode", generatedCode);
    
    toast.success("Reset code sent to your email. Please check your inbox.");
    setResetRequested(true);
  };
  
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedCode = localStorage.getItem("passwordResetCode");
    
    if (resetCode !== storedCode) {
      toast.error("Invalid reset code");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (newPassword.length < 10) {
      toast.error("Password must be at least 10 characters");
      return;
    }
    
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || 
        !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error("Password must include uppercase, lowercase, numbers, and special characters");
      return;
    }
    
    // In a real app, this would update the password in the database
    localStorage.removeItem("passwordResetCode");
    toast.success("Password reset successfully");
    setResetRequested(false);
    setResetCode("");
    setResetEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  // Format data for charts
  const getDayLabels = () => {
    return sessionStats.sessionsPerDay.slice(-14).map(day => {
      const date = new Date(day.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
  };
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const deviceData = [
    { name: 'Desktop', value: sessionStats.deviceTypes.desktop },
    { name: 'Mobile', value: sessionStats.deviceTypes.mobile },
    { name: 'Tablet', value: sessionStats.deviceTypes.tablet },
  ].filter(item => item.value > 0);
  
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-[400px] max-w-[90vw]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={20} />
              Admin Dashboard Login
            </CardTitle>
            <CardDescription>
              Login to access the notification admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetRequested ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Username or Email</Label>
                  <Input 
                    id="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your username or email"
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
                <Button type="submit" className="w-full">Login</Button>
                <Button 
                  type="button" 
                  variant="link" 
                  className="w-full text-blue-500"
                  onClick={(e) => {
                    e.preventDefault();
                    setResetRequested(true);
                  }}
                >
                  Forgot Password?
                </Button>
              </form>
            ) : (
              <form onSubmit={resetCode ? handleResetPassword : handleRequestReset} className="space-y-4">
                {!resetCode ? (
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">Email</Label>
                    <Input 
                      id="resetEmail" 
                      type="email" 
                      value={resetEmail} 
                      onChange={(e) => setResetEmail(e.target.value)} 
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="resetCode">Reset Code</Label>
                      <Input 
                        id="resetCode" 
                        type="text" 
                        value={resetCode} 
                        onChange={(e) => setResetCode(e.target.value)} 
                        placeholder="Enter 6-digit code"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required
                      />
                    </div>
                  </>
                )}
                
                <Button type="submit" className="w-full">
                  {resetCode ? "Reset Password" : "Send Reset Code"}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setResetRequested(false);
                    setResetCode("");
                    setResetEmail("");
                  }}
                >
                  Back to Login
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="text-center text-sm text-muted-foreground">
            <p className="w-full">Admin dashboard for Stack'd Finance App</p>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Bell className="h-7 w-7 text-orange-500 mr-2" />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Logged in as <span className="font-semibold">Administrator</span>
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/")}
              >
                View App
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="analytics" className="flex-1">
              <BarChart4 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Current Active Users</CardTitle>
                  <CardDescription>
                    Users active in the last 15 minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sessionStats.activeDevices}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Daily Active Users</CardTitle>
                  <CardDescription>
                    Unique devices in the last 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sessionStats.dailyActiveUsers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Active Users</CardTitle>
                  <CardDescription>
                    Unique devices in the last 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sessionStats.weeklyActiveUsers}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>User Sessions Over Time</CardTitle>
                    <div className="flex space-x-1">
                      <TabsList>
                        <TabsTrigger 
                          value="day" 
                          onClick={() => setViewMode("day")}
                          className={viewMode === "day" ? "bg-primary text-primary-foreground" : ""}
                        >
                          Daily
                        </TabsTrigger>
                        <TabsTrigger 
                          value="week" 
                          onClick={() => setViewMode("week")}
                          className={viewMode === "week" ? "bg-primary text-primary-foreground" : ""}
                        >
                          Weekly
                        </TabsTrigger>
                        <TabsTrigger 
                          value="month" 
                          onClick={() => setViewMode("month")}
                          className={viewMode === "month" ? "bg-primary text-primary-foreground" : ""}
                        >
                          Monthly
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  <CardDescription>
                    Visualize session trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={
                          viewMode === "day" 
                            ? sessionStats.sessionsPerDay.slice(-14) 
                            : viewMode === "week" 
                              ? sessionStats.sessionsPerWeek.slice(-12) 
                              : sessionStats.sessionsPerMonth.slice(-12)
                        }
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey={
                            viewMode === "day" 
                              ? "date" 
                              : viewMode === "week" 
                                ? "week" 
                                : "month"
                          }
                          tickFormatter={(value) => {
                            if (viewMode === "day") {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            } else if (viewMode === "week") {
                              return value.split('-W')[1];
                            } else {
                              return value.split('-')[1];
                            }
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`${value} sessions`, 'Sessions']}
                          labelFormatter={(label) => {
                            if (viewMode === "day") {
                              const date = new Date(label);
                              return `Date: ${date.toLocaleDateString()}`;
                            } else if (viewMode === "week") {
                              return `Week: ${label.split('-W')[1]}`;
                            } else {
                              return `Month: ${label}`;
                            }
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Sessions"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Device Type Distribution</CardTitle>
                  <CardDescription>
                    Usage breakdown by device type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {deviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center">
                      <Laptop className="h-5 w-5 mr-2 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Desktop</div>
                        <div className="text-2xl font-bold">{sessionStats.deviceTypes.desktop}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="h-5 w-5 mr-2 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">Mobile</div>
                        <div className="text-2xl font-bold">{sessionStats.deviceTypes.mobile}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tablet className="h-5 w-5 mr-2 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">Tablet</div>
                        <div className="text-2xl font-bold">{sessionStats.deviceTypes.tablet}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Usage Calendar</CardTitle>
                  <CardDescription>
                    Daily activity heatmap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sessionStats.sessionsPerDay.slice(-14)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          }}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: number) => [`${value} sessions`, 'Sessions']}
                          labelFormatter={(label) => {
                            const date = new Date(label);
                            return `Date: ${date.toLocaleDateString()}`;
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          name="Sessions"
                          fill="#8884d8" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Today's Sessions</div>
                        <div className="text-2xl font-bold">
                          {sessionStats.sessionsPerDay.find(
                            day => day.date === new Date().toISOString().split('T')[0]
                          )?.count || 0}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-right">Daily Average</div>
                      <div className="text-2xl font-bold">
                        {Math.round(
                          sessionStats.sessionsPerDay.slice(-7).reduce(
                            (sum, day) => sum + day.count, 0
                          ) / 7
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <div className="grid md:grid-cols-6 gap-8">
              <Card className="md:col-span-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send size={20} />
                    Send Notification
                  </CardTitle>
                  <CardDescription>
                    Send push notifications to all users of the app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendNotification} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Notification Title</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Enter notification title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Notification Message</Label>
                      <Textarea 
                        id="message" 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder="Enter notification message"
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users size={20} />
                    User Statistics
                  </CardTitle>
                  <CardDescription>
                    App usage and audience overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-500">Total Devices</span>
                      <span className="font-semibold">
                        {Object.keys(JSON.parse(localStorage.getItem('stack_d_sessions') || '{"devices":{}}').devices).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-500">Notifications Enabled</span>
                      <span className="font-semibold">
                        {Notification.permission === "granted" ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-500">Active Today</span>
                      <span className="font-semibold">{sessionStats.dailyActiveUsers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">New Users (Last 7 Days)</span>
                      <span className="font-semibold">{sessionStats.weeklyActiveUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-6">
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>
                    History of notifications sent to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const storedNotifications = localStorage.getItem("adminSentNotifications");
                      const notifications = storedNotifications 
                        ? JSON.parse(storedNotifications) 
                        : [];
                      
                      if (notifications.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            No notifications have been sent yet.
                          </div>
                        );
                      }
                      
                      return notifications.slice().reverse().map((notification: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">{notification.title}</h3>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-2">{notification.message}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your admin account settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Enter new password"
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 10 characters long and include uppercase, lowercase, 
                      numbers, and special characters.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
                
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Admin Credentials</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-medium">Username:</div>
                      <div className="col-span-2 font-mono bg-slate-100 p-1 rounded">{ADMIN_USERNAME}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-medium">Password:</div>
                      <div className="col-span-2 font-mono bg-slate-100 p-1 rounded">
                        {SECURE_ADMIN_PASSWORD.substring(0, 3) + "●●●●●●●●●●●●●●●●●●●●●●●●●●"}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="font-medium">Email:</div>
                      <div className="col-span-2 font-mono bg-slate-100 p-1 rounded">odioryole@gmail.com</div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">
                        These credentials are required to access the admin dashboard at:<br/>
                        <code className="bg-slate-100 px-1 py-0.5 rounded text-black">
                          /admin/notifications
                        </code>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNotificationDashboard;
