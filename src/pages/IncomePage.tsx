
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import CurrencySelector from "@/components/CurrencySelector";
import { Card } from "@/components/ui/card";
import LocalStorageInfo from "@/components/LocalStorageInfo";

const IncomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");

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
        
        <TabsContent value="dashboard" className="pt-4">
          <Dashboard type="income" />
          <LocalStorageInfo />
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <CategoryList type="income" />
          <LocalStorageInfo />
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <TransactionForm type="income" />
            <TransactionList type="income" />
          </div>
          <LocalStorageInfo />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IncomePage;
