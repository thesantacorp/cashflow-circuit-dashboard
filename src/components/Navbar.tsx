import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  Bell, 
  BellOff, 
  Sprout 
} from "lucide-react";
import { useTransactions } from "@/context/transaction";
import CurrencySelector from "./CurrencySelector";
import BackupManager from "./BackupManager";
import { useCurrency } from "@/context/CurrencyContext";
import MobileNav from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import AppLogo from "./AppLogo";
import { createRoot } from "react-dom/client";
import NotificationSettings from "./NotificationSettings";
import { useNotifications } from "@/context/NotificationContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();
  const { permission, isSupported } = useNotifications();
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;
  
  return (
    <nav className="border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
      <div className="container flex h-16 items-center max-w-7xl px-4">
        {isMobile && <MobileNav />}
        
        <Link to="/" className="flex items-center mr-8">
          <AppLogo className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">Stack'd</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-4 md:gap-6">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "secondary" : "ghost"} 
              className={location.pathname === "/" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Overview
            </Button>
          </Link>
          <Link to="/expenses">
            <Button variant={location.pathname === "/expenses" ? "secondary" : "ghost"}
              className={location.pathname === "/expenses" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Expenses
            </Button>
          </Link>
          <Link to="/income">
            <Button variant={location.pathname === "/income" ? "secondary" : "ghost"}
              className={location.pathname === "/income" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Income
            </Button>
          </Link>
          <Link to="/grow">
            <Button variant={location.pathname === "/grow" ? "secondary" : "ghost"}
              className={location.pathname === "/grow" 
                ? "bg-white/20 text-white hover:bg-white/30" 
                : "text-white hover:bg-white/10"}>
              Grow
              <Sprout size={16} className="ml-1 text-green-300" />
            </Button>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          {!isMobile && (
            <>
              <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-white bg-white/10 border-white/20 hover:bg-white/20 w-10 h-10 p-0"
                  >
                    {isSupported && permission === 'granted' ? (
                      <Bell size={16} />
                    ) : (
                      <BellOff size={16} />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                  </DialogHeader>
                  <NotificationSettings />
                </DialogContent>
              </Dialog>
              
              <BackupManager />
              
              <CurrencySelector />
            </>
          )}
          
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Expenses</span>
              <span className="font-medium text-white flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Income</span>
              <span className="font-medium text-white flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Balance</span>
              <span className={`font-medium text-white`}>
                {currencySymbol}{balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
