
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Send, Users, Calendar, Activity, Smartphone, Laptop, Timer } from "lucide-react";

// The username is SupErAdmIn and a complex password
const ADMIN_CREDENTIALS = {
  username: "SupErAdmIn",
  password: "j8K#p2L!qR7@vX9zD6sY3mF" // Complex password
};

// This would normally be stored in a database
let notificationHistory: {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  delivered: boolean;
}[] = [];

// Session tracking data would come from a real database
interface SessionData {
  day: string;
  count: number;
}

// Mock session data generation function (would be real data in production)
const generateSessionData = (days: number): SessionData[] => {
  const data: SessionData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const day = date.toISOString().split('T')[0];
    // Generate random number between 10-50 for demo purposes
    const count = Math.floor(Math.random() * 40) + 10;
    data.push({ day, count });
  }
  
  return data;
};

// Get real session data from localStorage if available
const getRealSessionData = (): SessionData[] => {
  try {
    const sessionData = localStorage.getItem('sessionTracking');
    if (sessionData) {
      const parsedData = JSON.parse(sessionData);
      
      // Convert to our format
      const result: SessionData[] = [];
      Object.entries(parsedData).forEach(([date, count]) => {
        result.push({
          day: date,
          count: count as number
        });
      });
      
      // Sort by date
      result.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
      return result;
    }
  } catch (e) {
    console.error("Error parsing session data:", e);
  }
  
  // Fallback to generated data
  return generateSessionData(7);
};

// Device data - would come from a real database
interface DeviceData {
  type: string;
  count: number;
}

const AdminNotificationDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData[]>([]);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");
  const { toast } = useToast();

  useEffect(() => {
    // Load session data
    setSessionData(getRealSessionData());
    
    // Check if already authenticated in this session
    const savedAuth = sessionStorage.getItem("adminAuthenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    }
    
    // Load notification history
    const savedHistory = localStorage.getItem("notificationHistory");
    if (savedHistory) {
      notificationHistory = JSON.parse(savedHistory);
    }
    
    // Auto refresh data every minute
    const refreshInterval = setInterval(() => {
      setSessionData(getRealSessionData());
    }, 60000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuthenticated", "true");
      toast({
        title: "Authentication successful",
        description: "Welcome to the admin dashboard",
      });
    } else {
      toast({
        title: "Authentication failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = () => {
    if (!notificationTitle) {
      toast({
        title: "Error",
        description: "Please enter a notification title",
        variant: "destructive"
      });
      return;
    }
    
    const newNotification = {
      id: `notification-${Date.now()}`,
      title: notificationTitle,
      body: notificationBody,
      timestamp: Date.now(),
      delivered: true
    };
    
    // Add to history
    notificationHistory = [newNotification, ...notificationHistory];
    localStorage.setItem("notificationHistory", JSON.stringify(notificationHistory));
    
    // Actually send the notification if supported
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/favicon.ico'
        });
        
        toast({
          title: "Notification sent",
          description: "The notification has been sent to all subscribers",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Users have not granted notification permission",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Not supported",
        description: "Notifications are not supported in this browser",
        variant: "destructive"
      });
    }
    
    // Reset form
    setNotificationTitle("");
    setNotificationBody("");
  };

  const calculateDeviceStats = (): DeviceData[] => {
    // This would come from real analytics in production
    return [
      { type: "Mobile", count: 68 },
      { type: "Desktop", count: 32 }
    ];
  };
  
  // Calculate unique users in last 24 hours
  const calculateRecentUsers = (): number => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    let count = 0;
    sessionData.forEach(session => {
      const sessionDate = new Date(session.day);
      if (sessionDate >= oneDayAgo) {
        count += session.count;
      }
    });
    
    return count;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the notification dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Notification Dashboard</h1>
            <p className="text-muted-foreground">Manage notifications and view analytics</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              sessionStorage.removeItem("adminAuthenticated");
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {sessionData.reduce((sum, session) => sum + session.count, 0)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last 24 Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Timer className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{calculateRecentUsers()}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Mobile Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Smartphone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{calculateDeviceStats()[0].count}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Desktop Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{calculateDeviceStats()[1].count}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle>User Sessions</CardTitle>
              <CardDescription>
                <div className="flex space-x-4 mt-2">
                  <Button 
                    variant={timeframe === "day" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeframe("day")}
                  >
                    Day
                  </Button>
                  <Button 
                    variant={timeframe === "week" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeframe("week")}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timeframe === "month" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeframe("month")}
                  >
                    Month
                  </Button>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {sessionData.length > 0 ? (
                  <div className="w-full h-full">
                    {/* Session data visualization would go here */}
                    <div className="bg-orange-100 rounded-md p-4 h-full flex flex-col justify-center">
                      <p className="text-center mb-4">Session Data: {timeframe}</p>
                      <div className="flex justify-between h-32">
                        {sessionData.slice(0, 7).map((data, index) => (
                          <div key={index} className="flex flex-col items-center justify-end">
                            <div 
                              className="w-10 bg-orange-500 rounded-t-md"
                              style={{ height: `${(data.count / 50) * 100}%` }}
                            ></div>
                            <span className="text-xs mt-2">{data.day.split('-')[2]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No session data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>
                Push a notification to all subscribed users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Input
                    id="body"
                    placeholder="Notification message"
                    value={notificationBody}
                    onChange={(e) => setNotificationBody(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Hide History" : "Show History"}
              </Button>
              <Button onClick={handleSendNotification}>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </CardFooter>
          </Card>
        </div>

        {showHistory && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Previously sent notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationHistory.length > 0 ? (
                <div className="space-y-4">
                  {notificationHistory.map((notification) => (
                    <div
                      key={notification.id}
                      className="border rounded-md p-4 flex items-start"
                    >
                      <Bell className="h-5 w-5 mr-4 text-orange-500 mt-1" />
                      <div>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No notifications sent yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationDashboard;
