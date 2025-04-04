
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, ArrowUpIcon, Sprout } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import AppLogo from "../AppLogo";
import {
  DrawerContent,
  DrawerHeader,
  DrawerClose,
} from "@/components/ui/drawer";

interface MobileNavDrawerProps {
  setOpen: (open: boolean) => void;
  openSettingSheet: (setting: string) => void;
}

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ setOpen, openSettingSheet }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  const onLinkClick = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <DrawerContent className="bg-gradient-to-b from-orange-500 to-amber-500 text-white border-r-orange-600 h-[85vh] rounded-t-[20px]">
      <div className="flex flex-col h-full px-4 py-4">
        <div className="flex items-center mb-6 mt-2">
          <AppLogo className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">Stack'd</span>
        </div>

        <div className="px-4 py-3 bg-white/10 mb-4 rounded-lg">
          <div className="text-sm text-white/70 mb-1">Balance</div>
          <div className="text-2xl font-bold">{currencySymbol}{balance.toFixed(2)}</div>
        </div>

        <nav className="flex flex-col mb-4">
          <div 
            className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/" 
              ? "bg-white/20 border-l-4 border-white" 
              : ""}`}
            onClick={() => onLinkClick("/")}
          >
            <span>Overview</span>
          </div>
          <div 
            className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/expenses" 
              ? "bg-white/20 border-l-4 border-white" 
              : ""}`}
            onClick={() => onLinkClick("/expenses")}
          >
            <span>Expenses</span>
            <span className="ml-auto font-medium flex items-center">
              <ArrowDownIcon className="h-3 w-3 mr-1" />
              {currencySymbol}{totalExpenses.toFixed(2)}
            </span>
          </div>
          <div 
            className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/income" 
              ? "bg-white/20 border-l-4 border-white" 
              : ""}`}
            onClick={() => onLinkClick("/income")}
          >
            <span>Income</span>
            <span className="ml-auto font-medium flex items-center">
              <ArrowUpIcon className="h-3 w-3 mr-1" />
              {currencySymbol}{totalIncome.toFixed(2)}
            </span>
          </div>
          <div 
            className={`flex items-center px-6 py-3 rounded-lg mb-1 ${location.pathname === "/grow" 
              ? "bg-white/20 border-l-4 border-white" 
              : ""}`}
            onClick={() => onLinkClick("/grow")}
          >
            <span>Grow</span>
            <Sprout className="h-4 w-4 ml-1 text-green-300" />
          </div>
        </nav>

        <div className="px-4 mt-auto">
          <div className="text-sm font-medium mb-2 text-white/80">Settings</div>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
              onClick={() => openSettingSheet("currency")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Currency
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
              onClick={() => openSettingSheet("data")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              Data Management
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
              onClick={() => openSettingSheet("notifications")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
              </svg>
              Notifications
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 rounded-lg"
              onClick={() => openSettingSheet("backup")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
              Google Backup
            </Button>
          </div>
        </div>
      </div>
    </DrawerContent>
  );
};

export default MobileNavDrawer;
