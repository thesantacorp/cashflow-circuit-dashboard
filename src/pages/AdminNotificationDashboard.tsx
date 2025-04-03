
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminNotificationDashboard: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationType, setNotificationType] = useState("all");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check hardcoded credentials
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
    
    // Here we would normally send to a server, but for demo purposes we'll use the Notifications API directly
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
      
      // Clear form
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
                View previously sent notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No notification history available yet.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationDashboard;
