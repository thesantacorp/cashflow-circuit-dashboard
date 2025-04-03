
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from "@/components/Dashboard";
import CurrencySelector from "@/components/CurrencySelector";
import EmotionInsightsEnhanced from "@/components/EmotionInsightsEnhanced";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpendingRecommendations from "@/components/SpendingRecommendations";
import { useCurrency } from "@/context/CurrencyContext";
import DataExportImport from "@/components/DataExportImport";
import { useTransactions } from "@/context/transaction";

const OverviewPageEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currencySymbol } = useCurrency();
  const { getTotalByType } = useTransactions();
  
  const totalExpenses = getTotalByType("expense");
  const totalIncome = getTotalByType("income");
  const balance = totalIncome - totalExpenses;

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex gap-2">
          <CurrencySelector />
        </div>
      </div>
      
      <Card className="bg-primary text-primary-foreground overflow-hidden w-full max-w-full mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Current Balance</CardTitle>
        </CardHeader>
        <CardContent className="break-words">
          <div className="text-3xl font-bold overflow-x-auto">
            {currencySymbol}{balance.toFixed(2)}
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="emotions">Emotion Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4">
          <Dashboard type="expense" />
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
        
        <TabsContent value="emotions" className="pt-4">
          <EmotionInsightsEnhanced />
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
        
        <TabsContent value="recommendations" className="pt-4">
          <SpendingRecommendations />
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OverviewPageEnhanced;
