
import React, { useEffect, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, BellOff, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

const NotificationSettings: React.FC = () => {
  const { permission, requestPermission, isSupported, sendNotification } = useNotifications();
  const { toast: uiToast } = useToast();
  const isMobile = useIsMobile();
  
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
    <Card className={`bg-gradient-to-br from-white to-orange-50/50 border-orange-200 ${isMobile ? "border-0 shadow-none" : ""}`}>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  checked={permission === 'granted'}
                  onCheckedChange={handleTogglePermission}
                />
              </TooltipTrigger>
              <TooltipContent>
                {permission === 'granted' 
                  ? "Notifications are enabled" 
                  : "Enable notifications to stay updated"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Notifications are blocked</p>
                <p className="text-xs text-amber-700 mt-1">
                  You have blocked notifications for this site. Please update your browser settings to enable notifications.
                </p>
                
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-amber-800">How to enable:</p>
                  <div className="text-xs text-amber-700 space-y-1">
                    <p>• Chrome: Click the lock icon in address bar → Site settings → Notifications → Allow</p>
                    <p>• Firefox: Click the shield icon in address bar → Permissions → Notifications → Allow</p>
                    <p>• Safari: Safari menu → Preferences → Websites → Notifications → Allow</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {permission === 'granted' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Notifications are enabled</p>
                <p className="text-xs text-green-700 mt-1">
                  You'll receive alerts for important updates, budget reminders, and financial insights.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
