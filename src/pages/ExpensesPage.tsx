
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import SpendingRecommendations from "@/components/SpendingRecommendations";
import DataExportImport from "@/components/DataExportImport";
import { useIsMobile } from "@/hooks/use-mobile";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const isMobile = useIsMobile();

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Expenses</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4 max-w-full overflow-x-hidden">
          <div className="max-w-full mx-auto">
            <Dashboard type="expense" />
            <SpendingRecommendations />
            <LocalStorageInfo />
            <DataExportImport />
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoryList type="expense" />
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-6'}`}>
            <div className="w-full max-w-lg mx-auto md:mx-0">
              <TransactionForm type="expense" />
            </div>
            <div className="w-full">
              <TransactionList type="expense" />
            </div>
          </div>
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;
