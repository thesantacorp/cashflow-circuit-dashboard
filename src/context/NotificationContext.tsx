
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

type NotificationPermission = 'default' | 'granted' | 'denied';

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);
  
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Notifications are not supported in this browser");
      return 'denied' as NotificationPermission;
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success("Push notifications enabled!");
      } else if (result === 'denied') {
        toast.error("Notification permission denied");
      }
      
      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Could not request notification permission");
      return 'default' as NotificationPermission;
    }
  };
  
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported) {
      toast.error("Notifications are not supported in this browser");
      return;
    }
    
    if (permission !== 'granted') {
      toast.error("Notification permission not granted");
      return;
    }
    
    try {
      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Could not send notification");
    }
  };
  
  return (
    <NotificationContext.Provider
      value={{
        permission,
        requestPermission,
        sendNotification,
        isSupported
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};
