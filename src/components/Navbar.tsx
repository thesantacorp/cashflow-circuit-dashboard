
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
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-7xl">
        <Link to="/" className="flex items-center mr-8">
          <BarChart3 className="h-6 w-6 mr-2" />
          <span className="font-bold">CashFlow</span>
        </Link>
        
        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/">
            <Button variant={location.pathname === "/" ? "default" : "ghost"}>
              Overview
            </Button>
          </Link>
          <Link to="/expenses">
            <Button variant={location.pathname === "/expenses" ? "default" : "ghost"}>
              Expenses
            </Button>
          </Link>
          <Link to="/income">
            <Button variant={location.pathname === "/income" ? "default" : "ghost"}>
              Income
            </Button>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-medium text-expense flex items-center">
                <ArrowDownIcon className="h-3 w-3 mr-1" />
                ${totalExpenses.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Income</span>
              <span className="font-medium text-income flex items-center">
                <ArrowUpIcon className="h-3 w-3 mr-1" />
                ${totalIncome.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className={`font-medium ${balance >= 0 ? "text-income" : "text-expense"}`}>
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
