
import React, { useState } from "react";
import Dashboard from "@/components/Dashboard";
import CurrencySelector from "@/components/CurrencySelector";
import EmotionInsightsEnhanced from "@/components/EmotionInsightsEnhanced";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpendingRecommendations from "@/components/SpendingRecommendations";
import { useCurrency } from "@/context/CurrencyContext";
import DataExportImport from "@/components/DataExportImport";

const OverviewPageEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currencySymbol } = useCurrency();

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Overview</h1>
        <div className="flex gap-2">
          <CurrencySelector />
        </div>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="emotions">Emotion Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4">
          <Dashboard type="all" />
          <LocalStorageInfo />
          <DataExportImport />
        </TabsContent>
        
        <TabsContent value="emotions" className="pt-4">
          <EmotionInsightsEnhanced currencySymbol={currencySymbol} />
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
