
import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationHistoryItem {
  id: string;
  title: string;
  body?: string;
  timestamp: string;
  read: boolean;
  sentFromAdmin?: boolean;
  deliveredToDevices?: number;
  views?: number;
  deviceTypes?: Record<string, number>; // e.g. { "mobile": 5, "desktop": 10 }
}

interface NotificationContextType {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions, fromAdmin?: boolean) => void;
  isSupported: boolean;
  notificationHistory: NotificationHistoryItem[];
  markAsRead: (id: string) => void;
  clearHistory: () => void;
  addAdminNotificationToHistory: (notification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>(() => {
    const saved = localStorage.getItem("notificationHistory");
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);
  
  // Save notification history to localStorage
  useEffect(() => {
    localStorage.setItem("notificationHistory", JSON.stringify(notificationHistory));
  }, [notificationHistory]);
  
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
  
  const addToHistory = (title: string, options?: NotificationOptions, fromAdmin = false) => {
    const newNotification: NotificationHistoryItem = {
      id: Date.now().toString(),
      title,
      body: options?.body,
      timestamp: new Date().toISOString(),
      read: false,
      sentFromAdmin: fromAdmin,
      // Default estimates for analytics - would be updated with real data in production
      deliveredToDevices: fromAdmin ? Math.floor(Math.random() * 20) + 5 : 1,
      views: fromAdmin ? Math.floor(Math.random() * 15) + 1 : 1,
      deviceTypes: fromAdmin ? {
        "mobile": Math.floor(Math.random() * 15) + 1,
        "desktop": Math.floor(Math.random() * 10) + 1,
        "tablet": Math.floor(Math.random() * 5)
      } : { [/mobile|android|ios/i.test(navigator.userAgent) ? "mobile" : "desktop"]: 1 }
    };
    
    setNotificationHistory(prev => [newNotification, ...prev]);
  };
  
  const sendNotification = (title: string, options?: NotificationOptions, fromAdmin = false) => {
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
      
      // Add to history
      addToHistory(title, options, fromAdmin);
      
      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Could not send notification");
    }
  };
  
  const markAsRead = (id: string) => {
    setNotificationHistory(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  const clearHistory = () => {
    setNotificationHistory([]);
  };
  
  const addAdminNotificationToHistory = (notification: Omit<NotificationHistoryItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationHistoryItem = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      sentFromAdmin: true
    };
    
    setNotificationHistory(prev => [newNotification, ...prev]);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        permission,
        requestPermission,
        sendNotification,
        isSupported,
        notificationHistory,
        markAsRead,
        clearHistory,
        addAdminNotificationToHistory
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
