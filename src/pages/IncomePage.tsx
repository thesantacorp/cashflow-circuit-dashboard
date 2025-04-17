
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import CurrencySelector from "@/components/CurrencySelector";
import { useIsMobile } from "@/hooks/use-mobile";
import IncomeInsights from "@/components/IncomeInsights";
import { useTransactions } from "@/context/transaction";

const IncomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const isMobile = useIsMobile();
  const { getCategoriesByType } = useTransactions();

  // Debug: log the income categories on mount
  useEffect(() => {
    const incomeCategories = getCategoriesByType("income");
    console.log("Income page mounted, categories:", incomeCategories);
  }, [getCategoriesByType]);

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Income</h1>
        <CurrencySelector />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4 space-y-4">
          <Dashboard type="income" />
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
