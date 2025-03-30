
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BarChart3, Menu, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import BackupManager from "./BackupManager";
import CurrencySelector from "./CurrencySelector";

const MobileNav: React.FC = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { getTotalByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] sm:w-[350px] bg-gradient-to-b from-orange-500 to-amber-500 text-white border-r-orange-600">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-6 mt-2">
            <BarChart3 className="h-6 w-6 mr-2" />
            <span className="font-bold text-xl">CashFlow</span>
          </div>

          <nav className="flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Overview
              </Button>
            </Link>
            <Link to="/expenses" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/expenses" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/expenses" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Expenses
              </Button>
            </Link>
            <Link to="/income" onClick={() => setOpen(false)}>
              <Button 
                variant={location.pathname === "/income" ? "secondary" : "ghost"} 
                className={`w-full justify-start ${location.pathname === "/income" 
                  ? "bg-white/20 text-white hover:bg-white/30" 
                  : "text-white hover:bg-white/10"}`}
              >
                Income
              </Button>
            </Link>
          </nav>

          <div className="mt-8 space-y-4">
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Expenses</span>
              <span className="font-medium flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Income</span>
              <span className="font-medium flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                {currencySymbol}{totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
              <span>Balance</span>
              <span className="font-medium">
                {currencySymbol}{balance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-auto p-4 flex flex-col gap-3">
            <CurrencySelector />
            <div className="flex justify-center">
              <BackupManager />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
