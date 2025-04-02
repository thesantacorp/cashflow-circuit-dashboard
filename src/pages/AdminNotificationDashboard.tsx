
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Clock, Users, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "odioryole@gmail.com";
const ADMIN_PASSWORD = "admin123"; // This would be hashed in a real application

const AdminNotificationDashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("admin_auth") === "true";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_auth", "true");
      setIsLoggedIn(true);
      toast({
        title: "Login successful",
        description: "Welcome to the admin notification dashboard"
      });
    } else {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsLoggedIn(false);
  };
  
  const sendNotification = () => {
    if (!title || !message) {
      toast({
        title: "Validation error",
        description: "Please provide both a title and message",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    // Simulate API call to send notifications
    setTimeout(() => {
      toast({
        title: "Notifications sent",
        description: "Your message has been delivered to all users"
      });
      
      setTitle("");
      setMessage("");
      setIsSending(false);
    }, 1500);
  };
  
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50">
        <Card className="w-[350px] shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-center">
              Admin Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the notification dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="input-colorful"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-colorful"
                />
              </div>
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                Login
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-orange-600"
            >
              Back to App
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-orange-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notification Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,234</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                Notifications Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">58</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Last Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2 days ago</p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Send New Notification</CardTitle>
            <CardDescription>
              This notification will be sent to all users who have enabled notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Notification Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                className="input-colorful"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">Notification Message</label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the notification message"
                rows={4}
                className="input-colorful"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={sendNotification}
              disabled={isSending}
              className="w-full bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4" /> 
                  Send Notification
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-orange-600"
          >
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationDashboard;
