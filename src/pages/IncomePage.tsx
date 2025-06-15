import React, { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import CurrencySelector from "@/components/CurrencySelector";
import { useIsMobile } from "@/hooks/use-mobile";
import IncomeInsights from "@/components/IncomeInsights";
import { useTransactions } from "@/context/transaction";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const IncomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const isMobile = useIsMobile();
  const { getCategoriesByType, state, deduplicate } = useTransactions();

  // Debug: log the income categories on mount and when categories change
  useEffect(() => {
    const incomeCategories = getCategoriesByType("income");
    console.log("Income page mounted or categories changed, categories:", incomeCategories);
  }, [getCategoriesByType, state.categories]);
  
  // Check if there are duplicate transactions
  const hasDuplicates = useMemo(() => {
    const idSet = new Set();
    let duplicatesFound = false;
    
    for (const tx of state.transactions) {
      if (idSet.has(tx.id)) {
        duplicatesFound = true;
        break;
      }
      idSet.add(tx.id);
    }
    
    return duplicatesFound;
  }, [state.transactions]);

  // Create a wrapper function that handles the MouseEvent properly
  const handleDeduplicate = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    deduplicate(true); // Pass true to show toast notification
  };

  return (
    <div className="container py-6 px-4 max-w-7xl w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Income</h1>
        <div className="flex items-center gap-2">
          {hasDuplicates && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeduplicate}
              className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">Remove Duplicates</span>
              <span className="sm:hidden">Remove</span>
            </Button>
          )}
          <CurrencySelector />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4 space-y-4">
          <Dashboard type="income" />
          {/* If you render a TransactionList in Dashboard, add defaultTimePeriod="month" prop */}
          {/* <TransactionList type="income" defaultTimePeriod="month" ... /> */}
          <IncomeInsights />
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoryList type="income" />
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <TransactionForm type="income" />
            <TransactionList type="income" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomePage;
