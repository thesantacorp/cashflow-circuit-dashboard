
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, PieChart, Settings, Activity, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import NetworkStatusIndicator from './NetworkStatusIndicator';
import { Link } from 'react-router-dom';

const MobileNavbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 py-2 px-4 md:hidden">
      <div className="flex items-center justify-around">
        <Link 
          to="/expenses" 
          className={cn(
            "flex flex-col items-center p-2 rounded-md", 
            isActive('/expenses') ? "text-primary" : "text-gray-500"
          )}
        >
          <Home size={20} />
          <span className="text-xs mt-1">Expenses</span>
        </Link>
        
        <Link 
          to="/income" 
          className={cn(
            "flex flex-col items-center p-2 rounded-md", 
            isActive('/income') ? "text-primary" : "text-gray-500"
          )}
        >
          <Activity size={20} />
          <span className="text-xs mt-1">Income</span>
        </Link>
        
        <Link 
          to="/ideas" 
          className={cn(
            "flex flex-col items-center p-2 rounded-md", 
            isActive('/ideas') ? "text-primary" : "text-gray-500"
          )}
        >
          <Lightbulb size={20} />
          <span className="text-xs mt-1">Ideas</span>
        </Link>
        
        <Link 
          to="/profile" 
          className={cn(
            "flex flex-col items-center p-2 rounded-md", 
            isActive('/profile') ? "text-primary" : "text-gray-500"
          )}
        >
          <Settings size={20} />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
      
      <div className="absolute top-0 right-2 transform -translate-y-1/2">
        <NetworkStatusIndicator minimal={true} />
      </div>
    </div>
  );
};

export default MobileNavbar;
