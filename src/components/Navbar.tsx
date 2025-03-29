
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon, ArrowUpIcon, BarChart3 } from "lucide-react";
import { useTransactions } from "@/context/TransactionContext";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { getTotalByType } = useTransactions();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;
  
  return (
    <nav className="border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
      <div className="container flex h-16 items-center max-w-7xl">
        <Link to="/" className="flex items-center mr-8">
          <BarChart3 className="h-6 w-6 mr-2" />
          <span className="font-bold text-xl">CashFlow</span>
        </Link>
        
        <div className="flex items-center gap-4 md:gap-6">
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
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Expenses</span>
              <span className="font-medium text-white flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                ${totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Income</span>
              <span className="font-medium text-white flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                ${totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-white/70">Balance</span>
              <span className={`font-medium text-white`}>
                ${balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
