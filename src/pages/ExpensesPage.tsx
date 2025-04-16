
import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import SpendingRecommendations from "@/components/SpendingRecommendations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionFilter from "@/components/EmotionFilter";
import { EmotionalState, Transaction } from "@/types";
import NetworkStatusIndicator from "@/components/NetworkStatusIndicator";
import SupabaseSync from "@/components/SupabaseSync";
import { toast } from "sonner";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | 'all'>('all');
  const isMobile = useIsMobile();
  const { getTotalByType, state, refreshData, isOnline } = useTransactions();
  const { currencySymbol } = useCurrency();
  const totalExpenses = getTotalByType("expense");

  // Force data refresh when page loads and on network status change
  useEffect(() => {
    if (refreshData && isOnline) {
      refreshData(true).then(success => {
        if (success) {
          toast.success("Data synced successfully");
        }
      });
    }
  }, [refreshData, isOnline]);

  // Filter transactions based on selected emotion
  const filteredTransactions = useMemo(() => {
    if (selectedEmotion === 'all') {
      return state.transactions;
    }
    
    return state.transactions.filter((transaction) => 
      transaction.emotionalState === selectedEmotion
    );
  }, [state.transactions, selectedEmotion]);

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Expenses</h1>
      
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <NetworkStatusIndicator minimal={true} className="mb-2 sm:mb-0" />
        <SupabaseSync minimal={true} />
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4">
          <div className="max-w-full mx-auto overflow-x-auto">
            <EmotionFilter 
              selectedEmotion={selectedEmotion} 
              onChange={setSelectedEmotion} 
            />
            
            {selectedEmotion !== 'all' && (
              <Card className="mb-6 overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center flex-wrap">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="font-medium capitalize">
                        {selectedEmotion} spending
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing only {selectedEmotion} transactions
                      </p>
                    </div>
                    <div className="text-lg sm:text-2xl font-bold break-words">
                      {currencySymbol}{filteredTotal.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-8 pb-6">
              <div className="w-full overflow-x-auto pb-2">
                <div className="min-w-[300px] w-full max-w-full">
                  <Dashboard 
                    type="expense" 
                    filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <SpendingRecommendations />
              </div>
              
              {!isMobile && (
                <div className="mt-8">
                  <LocalStorageInfo />
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="pt-4">
          <EmotionFilter 
            selectedEmotion={selectedEmotion} 
            onChange={setSelectedEmotion} 
          />
          
          <CategoryList 
            type="expense" 
            filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
          />
          
          {!isMobile && (
            <div className="mt-6">
              <LocalStorageInfo />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <EmotionFilter 
            selectedEmotion={selectedEmotion} 
            onChange={setSelectedEmotion} 
          />
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-6'}`}>
            <div className="w-full max-w-lg mx-auto md:mx-0">
              <TransactionForm type="expense" />
            </div>
            <div className="w-full">
              <TransactionList 
                type="expense" 
                filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
              />
            </div>
          </div>
          
          {!isMobile && (
            <div className="mt-6">
              <LocalStorageInfo />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;
