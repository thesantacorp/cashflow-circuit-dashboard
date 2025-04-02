
import React, { useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

const NotificationSettings: React.FC = () => {
  const { permission, requestPermission, isSupported, sendNotification } = useNotifications();
  const { toast: uiToast } = useToast();
  
  // When the component mounts, if the user hasn't made a decision yet, prompt them
  useEffect(() => {
    if (isSupported && permission === 'default') {
      // Auto-request permission when component opens
      setTimeout(() => {
        handleTogglePermission();
      }, 500);
    }
  }, []);

  // Function to directly request browser notification permission
  const handleTogglePermission = async () => {
    if (permission === 'granted') {
      uiToast({
        title: "Permission already granted",
        description: "You have already enabled notifications for this app. To disable, use your browser settings.",
      });
      return;
    }
    
    try {
      // Directly ask for Notification permission from the browser
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        // Send a test notification
        const notification = new Notification("Stack'd Notifications Enabled", {
          body: "You will now receive notifications from Stack'd",
          icon: "/favicon.ico"
        });
        
        // Close the notification after 3 seconds
        setTimeout(() => {
          notification.close();
        }, 3000);
        
        toast.success("Notifications enabled successfully!");
      } else if (result === 'denied') {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Could not request notification permission");
    }
  };
  
  if (!isSupported) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-700 flex items-center gap-2">
            <BellOff size={20} />
            Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser does not support push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try using a modern browser like Chrome, Firefox, or Safari to enable push notifications.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-gradient-to-br from-white to-orange-50/50 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} className="text-orange-500" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about important updates and reminders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable notifications</p>
            <p className="text-sm text-muted-foreground">
              Status: {permission === 'granted' ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <Switch
            checked={permission === 'granted'}
            onCheckedChange={handleTogglePermission}
          />
        </div>
        
        {permission !== 'granted' && (
          <Button 
            onClick={handleTogglePermission} 
            className="mt-4 w-full bg-orange-500 hover:bg-orange-600"
          >
            Enable Notifications
          </Button>
        )}
        
        {permission === 'granted' && (
          <Button 
            onClick={() => {
              sendNotification("Test Notification", { 
                body: "This is a test notification to confirm notifications are working correctly.",
                icon: "/favicon.ico"
              });
              toast.success("Test notification sent!");
            }}
            variant="outline" 
            className="mt-4 w-full"
          >
            Send Test Notification
          </Button>
        )}
        
        {permission === 'denied' && (
          <p className="mt-2 text-xs text-orange-700">
            You have blocked notifications for this site. Please update your browser settings to enable notifications.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
