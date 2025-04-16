
import React, { useState, useMemo } from "react";
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

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | 'all'>('all');
  const isMobile = useIsMobile();
  const { getTotalByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const totalExpenses = getTotalByType("expense");

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
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Expenses</h1>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4 max-w-full overflow-x-hidden">
          <div className="max-w-full mx-auto">
            <EmotionFilter 
              selectedEmotion={selectedEmotion} 
              onChange={setSelectedEmotion} 
            />
            
            {selectedEmotion !== 'all' && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium capitalize">
                        {selectedEmotion} spending
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing only {selectedEmotion} transactions
                      </p>
                    </div>
                    <div className="text-2xl font-bold">
                      {currencySymbol}{filteredTotal.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-8">
              <Dashboard 
                type="expense" 
                filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
              />
              
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
