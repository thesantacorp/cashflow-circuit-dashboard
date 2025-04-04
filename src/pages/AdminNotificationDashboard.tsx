import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { NotificationHistoryItem } from "@/context/NotificationContext";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const AdminNotificationDashboard: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationType, setNotificationType] = useState("all");
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedHistory = localStorage.getItem("notificationHistory");
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      const adminHistory = history.filter((item: NotificationHistoryItem) => item.sentFromAdmin);
      setNotificationHistory(adminHistory);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === "SupErAdmIn" && password === "K9$PzW2e&xL!mG7@sV3#nQ8*tD5^jF6") {
      setIsAuthenticated(true);
      toast.success("Logged in successfully");
    } else {
      toast.error("Invalid username or password");
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast.error("Please provide both title and body for the notification");
      return;
    }
    
    const newNotification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'> = {
      title: notificationTitle,
      body: notificationBody,
      sentFromAdmin: true,
      deliveredToDevices: Math.floor(Math.random() * 30) + 10,
      views: Math.floor(Math.random() * 20) + 5,
      deviceTypes: {
        "mobile": Math.floor(Math.random() * 20) + 5,
        "desktop": Math.floor(Math.random() * 15) + 3,
        "tablet": Math.floor(Math.random() * 8)
      }
    };
    
    const savedHistory = localStorage.getItem("notificationHistory") || "[]";
    const history = JSON.parse(savedHistory);
    
    const notificationWithId: NotificationHistoryItem = {
      ...newNotification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const updatedHistory = [notificationWithId, ...history];
    localStorage.setItem("notificationHistory", JSON.stringify(updatedHistory));
    
    setNotificationHistory(prev => [notificationWithId, ...prev]);
    
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        sendNotification();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            sendNotification();
          }
        });
      }
    } else {
      toast.error("Notifications are not supported in this browser");
    }
  };
  
  const sendNotification = () => {
    try {
      const notification = new Notification(notificationTitle, {
        body: notificationBody,
        icon: '/favicon.ico'
      });
      
      toast.success("Notification sent successfully");
      
      setNotificationTitle("");
      setNotificationBody("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
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
  
  const handleNavigateToAdminDashboard = () => {
    navigate("/admin/dashboard");
  };
  
  const prepareDeviceData = () => {
    const devices: Record<string, number> = {};
    
    notificationHistory.forEach(notification => {
      if (notification.deviceTypes) {
        Object.entries(notification.deviceTypes).forEach(([device, count]) => {
          devices[device] = (devices[device] || 0) + count;
        });
      }
    });
    
    return Object.entries(devices).map(([name, value]) => ({ name, value }));
  };
  
  const prepareEngagementData = () => {
    return notificationHistory.slice(0, 5).map(notification => ({
      name: notification.title.substring(0, 15) + (notification.title.length > 15 ? '...' : ''),
      delivered: notification.deliveredToDevices || 0,
      viewed: notification.views || 0
    }));
  };
  
  const deviceData = prepareDeviceData();
  const engagementData = prepareEngagementData();
  
  const COLORS = ['#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#8884D8'];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
        <h1 className="text-3xl font-bold">Admin Notification Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNavigateToAdminDashboard}>
            Admin Dashboard
          </Button>
          <Button variant="outline" onClick={handleBackToApp}>
            Back to App
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="send" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="send">Send Notifications</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>
                Send notifications to app users. These will appear as push notifications if users have allowed them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendNotification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-title">Notification Title</Label>
                  <Input 
                    id="notification-title" 
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                    placeholder="E.g., Budget Alert"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notification-body">Notification Body</Label>
                  <Textarea 
                    id="notification-body"
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                    placeholder="E.g., You've spent 90% of your food budget this month."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notification-type">Notification Type</Label>
                  <select 
                    id="notification-type"
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="all">All Users</option>
                    <option value="expense-users">Users with Expenses</option>
                    <option value="income-users">Users with Income</option>
                    <option value="budget-alert">Budget Alert</option>
                  </select>
                </div>
                
                <Button type="submit" className="w-full">Send Notification</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View previously sent notifications and their statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Content</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notificationHistory.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(notification.timestamp)}</TableCell>
                        <TableCell className="font-medium truncate max-w-[150px]">{notification.title}</TableCell>
                        <TableCell className="truncate max-w-[200px]">{notification.body}</TableCell>
                        <TableCell>{notification.deliveredToDevices || 0}</TableCell>
                        <TableCell>{notification.views || 0}</TableCell>
                        <TableCell>
                          <Badge variant={notification.views && notification.views > (notification.deliveredToDevices || 0) / 2 ? "secondary" : "default"}>
                            {notification.views && notification.views > (notification.deliveredToDevices || 0) / 2 ? "High Engagement" : "Sent"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No notification history available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>
                  Breakdown of notification delivery by device type.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {deviceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
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
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No device data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  Delivered vs. viewed notifications for recent campaigns.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {engagementData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={engagementData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="delivered" fill="#8884d8" name="Delivered" />
                      <Bar dataKey="viewed" fill="#82ca9d" name="Viewed" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No engagement data available yet.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Notification Performance Summary</CardTitle>
                <CardDescription>
                  Overall engagement and delivery statistics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-100 p-6 rounded-lg text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {notificationHistory.length}
                    </div>
                    <div className="text-slate-600 mt-2">Total Campaigns</div>
                  </div>
                  
                  <div className="bg-slate-100 p-6 rounded-lg text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {notificationHistory.reduce((total, item) => total + (item.deliveredToDevices || 0), 0)}
                    </div>
                    <div className="text-slate-600 mt-2">Total Notifications Sent</div>
                  </div>
                  
                  <div className="bg-slate-100 p-6 rounded-lg text-center">
                    <div className="text-4xl font-bold text-orange-600">
                      {Math.round(
                        (notificationHistory.reduce((total, item) => total + (item.views || 0), 0) /
                        Math.max(1, notificationHistory.reduce((total, item) => total + (item.deliveredToDevices || 0), 0))) * 100
                      )}%
                    </div>
                    <div className="text-slate-600 mt-2">Average Open Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationDashboard;
