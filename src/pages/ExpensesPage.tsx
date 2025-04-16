import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CategoryList from "@/components/CategoryList";
import TransactionForm from "@/components/TransactionForm";
import TransactionList from "@/components/TransactionList";
import LocalStorageInfo from "@/components/LocalStorageInfo";
import SpendingRecommendations from "@/components/SpendingRecommendations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionFilter from "@/components/EmotionFilter";
import { EmotionalState } from "@/types";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | 'all'>('all');
  const isMobile = useIsMobile();
  const { getTotalByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    console.log("ExpensePage - Current state from context:", state);
    console.log(`ExpensePage - Transaction count: ${state.transactions?.length || 0}`);
    
    try {
      const savedState = localStorage.getItem("transactionState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log("ExpensePage - localStorage state:", parsedState);
        console.log(`ExpensePage - localStorage transaction count: ${parsedState.transactions?.length || 0}`);
        
        if (parsedState.transactions?.length !== state.transactions?.length) {
          console.warn(`State mismatch: localStorage has ${
            parsedState.transactions?.length} transactions, but context has ${
            state.transactions?.length}`);
        }
        
        if (parsedState.transactions?.length > 0 && state.transactions?.length > 0) {
          console.log("First few transactions in localStorage:", 
            parsedState.transactions.slice(0, 3).map(t => t.id));
          console.log("First few transactions in context:", 
            state.transactions.slice(0, 3).map(t => t.id));
        }
      } else {
        console.warn("No transactionState found in localStorage!");
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
    
    const saveVerifier = setTimeout(() => {
      try {
        const currentSaved = localStorage.getItem("transactionState");
        if (currentSaved) {
          const parsedCurrent = JSON.parse(currentSaved);
          console.log("Verification check - localStorage transaction count:", 
            parsedCurrent.transactions?.length);
        }
      } catch (e) {
        console.error("Error in verification check:", e);
      }
    }, 2000);
    
    return () => clearTimeout(saveVerifier);
  }, [state]);

  const filteredTransactions = useMemo(() => {
    if (selectedEmotion === 'all') {
      return state.transactions;
    }
    
    return state.transactions.filter((transaction) => 
      transaction.emotionalState === selectedEmotion
    );
  }, [state.transactions, selectedEmotion]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="container py-4 md:py-6 max-w-7xl mx-auto px-3 sm:px-4 w-full overflow-hidden">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center sm:text-left">Expenses</h1>
      
      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
          Debug: {state.transactions?.length || 0} transactions in memory
        </div>
      )}
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-6 md:mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-2 md:pt-4 w-full overflow-hidden space-y-4 md:space-y-6">
          <div className="w-full mx-auto">
            <EmotionFilter 
              selectedEmotion={selectedEmotion} 
              onChange={setSelectedEmotion} 
              className="mb-4 md:mb-6"
            />
            
            {selectedEmotion !== 'all' && (
              <Card className="mb-4 md:mb-6 border-orange-200 shadow hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div>
                      <h3 className="font-medium capitalize text-lg">
                        {selectedEmotion} spending
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Showing only {selectedEmotion} transactions
                      </p>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      {currencySymbol}{filteredTotal.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-6 md:space-y-8 overflow-hidden">
              <Dashboard 
                type="expense" 
                filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
              />
              
              <div className="mt-6 md:mt-8">
                <SpendingRecommendations />
              </div>
              
              {!isMobile && (
                <div className="mt-6 md:mt-8">
                  <LocalStorageInfo />
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="pt-2 md:pt-4">
          <EmotionFilter 
            selectedEmotion={selectedEmotion} 
            onChange={setSelectedEmotion} 
            className="mb-4"
          />
          
          <CategoryList 
            type="expense" 
            filteredTransactions={selectedEmotion === 'all' ? undefined : filteredTransactions} 
          />
          
          {!isMobile && (
            <div className="mt-4 md:mt-6">
              <LocalStorageInfo />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-2 md:pt-4">
          <EmotionFilter 
            selectedEmotion={selectedEmotion} 
            onChange={setSelectedEmotion} 
            className="mb-4"
          />
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'md:grid-cols-2 gap-4 lg:gap-6'}`}>
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
            <div className="mt-4 md:mt-6">
              <LocalStorageInfo />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExpensesPage;
