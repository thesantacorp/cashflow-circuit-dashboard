
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
import { toast } from "sonner";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | 'all'>('all');
  const isMobile = useIsMobile();
  const { getTotalByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();

  // Verify transactions are loaded correctly on mount and after changes
  useEffect(() => {
    console.log("ExpensePage - Current state from context:", state);
    const transactionCount = state.transactions?.length || 0;
    console.log(`ExpensePage - Transaction count: ${transactionCount}`);
    
    try {
      // Check localStorage directly to verify data persistence
      const savedStateRaw = localStorage.getItem("transactionState");
      if (!savedStateRaw) {
        console.error("No transactionState found in localStorage!");
        return;
      }
      
      try {
        const parsedState = JSON.parse(savedStateRaw);
        const localStorageCount = parsedState.transactions?.length || 0;
        console.log("ExpensePage - localStorage state:", parsedState);
        console.log(`ExpensePage - localStorage transaction count: ${localStorageCount}`);
        
        // Alert if there's a mismatch between context and localStorage
        if (localStorageCount !== transactionCount) {
          console.warn(`State mismatch: localStorage has ${localStorageCount} transactions, but context has ${transactionCount}`);
          
          // Show a toast to the user if there's a serious mismatch
          if (transactionCount > 0 && localStorageCount === 0) {
            toast.error("Storage issue detected. Your data may not be saving correctly.");
          }
        }
        
        // Log some sample transactions for debugging
        if (localStorageCount > 0 && transactionCount > 0) {
          console.log("First few transactions in localStorage:", 
            parsedState.transactions.slice(0, 3).map(t => t.id));
          console.log("First few transactions in context:", 
            state.transactions.slice(0, 3).map(t => t.id));
        }
      } catch (error) {
        console.error("Error parsing localStorage state:", error);
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
    
    // Delayed verification check to ensure data was properly saved
    const saveVerifier = setTimeout(() => {
      try {
        const currentSaved = localStorage.getItem("transactionState");
        if (currentSaved) {
          const parsedCurrent = JSON.parse(currentSaved);
          console.log("Verification check - localStorage transaction count:", 
            parsedCurrent.transactions?.length);
          
          // Test localStorage by adding and immediately removing a test item
          try {
            // Add a test item
            const testKey = "test_localStorage_" + Date.now();
            localStorage.setItem(testKey, "test");
            // Check if it was added
            const testValue = localStorage.getItem(testKey);
            // Remove the test item
            localStorage.removeItem(testKey);
            
            if (testValue !== "test") {
              console.error("localStorage test failed - could not write and read test value!");
              toast.error("Your browser storage may be restricted. Data saving may not work.");
            }
          } catch (error) {
            console.error("localStorage write test failed:", error);
            toast.error("Storage access is restricted. Your data may not be saved.");
          }
        }
      } catch (e) {
        console.error("Error in verification check:", e);
      }
    }, 2000);
    
    return () => clearTimeout(saveVerifier);
  }, [state]);

  // Filter transactions based on selected emotion
  const filteredTransactions = useMemo(() => {
    if (selectedEmotion === 'all') {
      return state.transactions;
    }
    
    return state.transactions.filter((transaction) => 
      transaction.emotionalState === selectedEmotion
    );
  }, [state.transactions, selectedEmotion]);

  // Calculate total for filtered transactions
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
