
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bell, Send, Users, Settings, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const AdminNotificationDashboard: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  
  const navigate = useNavigate();
  
  // Check if user is logged in
  useEffect(() => {
    const adminAuthStatus = localStorage.getItem("adminLoggedIn");
    if (adminAuthStatus === "true") {
      setIsLoggedIn(true);
    }
  }, []);
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple authentication for demo purposes
    const correctEmail = "odioryole@gmail.com";
    const correctPassword = "admin123";
    
    if (email === correctEmail && password === correctPassword) {
      localStorage.setItem("adminLoggedIn", "true");
      setIsLoggedIn(true);
      toast.success("Login successful");
    } else {
      toast.error("Invalid email or password");
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
    // For now, we just show a success message
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
    
    // This would actually trigger push notifications in a real implementation
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
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    // In a real app, this would update the password in the database
    // For this demo, we'll just show a success message
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
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
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
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="admin@example.com"
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
              <h1 className="text-xl font-semibold">Notification Admin Dashboard</h1>
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
            <TabsTrigger value="notifications" className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>
          
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
                      <span className="text-sm text-gray-500">Total Users</span>
                      <span className="font-semibold">1,234</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-500">Notifications Enabled</span>
                      <span className="font-semibold">856 (69%)</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm text-gray-500">Active Today</span>
                      <span className="font-semibold">423</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">New Users (Last 7 Days)</span>
                      <span className="font-semibold">78</span>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminNotificationDashboard;
