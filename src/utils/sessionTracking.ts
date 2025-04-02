
// Utility to track user sessions and usage statistics

export interface SessionStats {
  activeDevices: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  sessionsPerDay: {
    date: string;
    count: number;
  }[];
  sessionsPerWeek: {
    week: string;
    count: number;
  }[];
  sessionsPerMonth: {
    month: string;
    count: number;
  }[];
  deviceTypes: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

// Generate a unique device ID for the current browser
const generateDeviceId = (): string => {
  let deviceId = localStorage.getItem('stack_d_device_id');
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('stack_d_device_id', deviceId);
  }
  
  return deviceId;
};

// Track the current session
export const trackSession = (): void => {
  const deviceId = generateDeviceId();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Get existing session data
  const sessionsData = JSON.parse(localStorage.getItem('stack_d_sessions') || '{}');
  
  // Structure for storing session data if it doesn't exist
  if (!sessionsData.devices) {
    sessionsData.devices = {};
  }
  
  if (!sessionsData.dailySessions) {
    sessionsData.dailySessions = {};
  }
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    deviceType = 'mobile';
    if (/iPad|tablet|Tablet/i.test(navigator.userAgent)) {
      deviceType = 'tablet';
    }
  }
  
  // Add or update this device
  sessionsData.devices[deviceId] = {
    lastSeen: now.toISOString(),
    type: deviceType,
    userAgent: navigator.userAgent
  };
  
  // Track daily sessions
  if (!sessionsData.dailySessions[dateStr]) {
    sessionsData.dailySessions[dateStr] = {
      total: 0,
      devices: {}
    };
  }
  
  if (!sessionsData.dailySessions[dateStr].devices[deviceId]) {
    sessionsData.dailySessions[dateStr].devices[deviceId] = 0;
  }
  
  sessionsData.dailySessions[dateStr].devices[deviceId]++;
  sessionsData.dailySessions[dateStr].total++;
  
  // Store updated session data
  localStorage.setItem('stack_d_sessions', JSON.stringify(sessionsData));
  
  // Set a ping interval to update the "lastSeen" time while the user is active
  const intervalId = setInterval(() => {
    const currentData = JSON.parse(localStorage.getItem('stack_d_sessions') || '{}');
    if (currentData.devices && currentData.devices[deviceId]) {
      currentData.devices[deviceId].lastSeen = new Date().toISOString();
      localStorage.setItem('stack_d_sessions', JSON.stringify(currentData));
    }
  }, 60000); // Update every minute
  
  // Clean up the interval when the user leaves the page
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });
};

// Get statistics for the admin dashboard
export const getSessionStats = (): SessionStats => {
  const sessionsData = JSON.parse(localStorage.getItem('stack_d_sessions') || '{}');
  const now = new Date();
  
  // Calculate active devices (seen in the last 15 minutes)
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const dailyActiveThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weeklyActiveThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  let activeDevices = 0;
  let dailyActiveUsers = 0;
  let weeklyActiveUsers = 0;
  const deviceTypes = { desktop: 0, mobile: 0, tablet: 0 };
  
  // Process device data
  if (sessionsData.devices) {
    Object.entries(sessionsData.devices).forEach(([_, deviceData]: [string, any]) => {
      // Count device types
      if (deviceData.type) {
        deviceTypes[deviceData.type as keyof typeof deviceTypes]++;
      }
      
      // Count active devices
      if (deviceData.lastSeen > fifteenMinutesAgo) {
        activeDevices++;
      }
      
      // Count daily active users
      if (deviceData.lastSeen > dailyActiveThreshold) {
        dailyActiveUsers++;
      }
      
      // Count weekly active users
      if (deviceData.lastSeen > weeklyActiveThreshold) {
        weeklyActiveUsers++;
      }
    });
  }
  
  // Process daily sessions data for charts
  const sessionsPerDay: { date: string; count: number }[] = [];
  const sessionsPerWeek: { week: string; count: number }[] = [];
  const sessionsPerMonth: { month: string; count: number }[] = [];
  
  if (sessionsData.dailySessions) {
    // Get last 30 days of data
    const last30Days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push(dateStr);
    }
    
    // Organize by day
    last30Days.forEach(dateStr => {
      const sessionsCount = sessionsData.dailySessions[dateStr]?.total || 0;
      sessionsPerDay.push({
        date: dateStr,
        count: sessionsCount
      });
    });
    
    // Organize by week (last 12 weeks)
    const weekData: Record<string, number> = {};
    last30Days.forEach(dateStr => {
      const date = new Date(dateStr);
      const weekNumber = Math.floor(date.getDate() / 7) + 1;
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const weekKey = `${year}-${month.toString().padStart(2, '0')}-W${weekNumber}`;
      
      if (!weekData[weekKey]) {
        weekData[weekKey] = 0;
      }
      
      weekData[weekKey] += sessionsData.dailySessions[dateStr]?.total || 0;
    });
    
    Object.entries(weekData).forEach(([week, count]) => {
      sessionsPerWeek.push({ week, count });
    });
    
    // Organize by month (last 12 months)
    const monthData: Record<string, number> = {};
    Object.keys(sessionsData.dailySessions).forEach(dateStr => {
      const yearMonth = dateStr.substring(0, 7); // YYYY-MM format
      if (!monthData[yearMonth]) {
        monthData[yearMonth] = 0;
      }
      monthData[yearMonth] += sessionsData.dailySessions[dateStr].total;
    });
    
    Object.entries(monthData).forEach(([month, count]) => {
      sessionsPerMonth.push({ month, count });
    });
  }
  
  // Sort data chronologically
  sessionsPerDay.sort((a, b) => a.date.localeCompare(b.date));
  sessionsPerWeek.sort((a, b) => a.week.localeCompare(b.week));
  sessionsPerMonth.sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    activeDevices,
    dailyActiveUsers,
    weeklyActiveUsers,
    sessionsPerDay,
    sessionsPerWeek,
    sessionsPerMonth,
    deviceTypes
  };
};

// Initialize session tracking (call this when the app loads)
export const initSessionTracking = (): void => {
  trackSession();
  
  // Clean up old session data (older than 90 days)
  const sessionsData = JSON.parse(localStorage.getItem('stack_d_sessions') || '{}');
  if (sessionsData.dailySessions) {
    const now = new Date();
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);
    const cutoffDate = ninetyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(sessionsData.dailySessions).forEach(dateStr => {
      if (dateStr < cutoffDate) {
        delete sessionsData.dailySessions[dateStr];
      }
    });
    
    localStorage.setItem('stack_d_sessions', JSON.stringify(sessionsData));
  }
};
