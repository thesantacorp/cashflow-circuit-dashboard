
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
import CategoryFilter from "@/components/CategoryFilter";
import { EmotionalState, Transaction } from "@/types";

const ExpensesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const isMobile = useIsMobile();
  const { getTotalByType, state, getCategoriesByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const totalExpenses = getTotalByType("expense");
  const expenseCategories = getCategoriesByType("expense");

  // Filter transactions based on selected emotion and category
  const filteredTransactions = useMemo(() => {
    let filtered = state.transactions;
    
    // Filter by emotion if not 'all'
    if (selectedEmotion !== 'all') {
      filtered = filtered.filter((transaction) => 
        transaction.emotionalState === selectedEmotion
      );
    }
    
    // Filter by category if not 'all'
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((transaction) => 
        transaction.categoryId === selectedCategory
      );
    }
    
    return filtered;
  }, [state.transactions, selectedEmotion, selectedCategory]);

  // Calculate filtered total
  const filteredTotal = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  // Reset filters
  const resetFilters = () => {
    setSelectedEmotion('all');
    setSelectedCategory('all');
  };

  return (
    <div className="container py-6 max-w-7xl mx-auto px-4 w-full">
      <h1 className="text-3xl font-bold mb-6 text-center sm:text-left">Expenses</h1>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="pt-4">
          <div className="max-w-full mx-auto overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <EmotionFilter 
                selectedEmotion={selectedEmotion} 
                onChange={setSelectedEmotion} 
              />
              
              <CategoryFilter 
                selectedCategory={selectedCategory}
                categories={expenseCategories}
                onChange={setSelectedCategory}
              />
            </div>
            
            {(selectedEmotion !== 'all' || selectedCategory !== 'all') && (
              <Card className="mb-6 overflow-hidden min-w-[250px]">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">
                        Filtered spending
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmotion !== 'all' && selectedCategory !== 'all' && `Showing ${selectedEmotion} transactions in selected category`}
                        {selectedEmotion !== 'all' && selectedCategory === 'all' && `Showing only ${selectedEmotion} transactions`}
                        {selectedEmotion === 'all' && selectedCategory !== 'all' && 'Showing only selected category'}
                      </p>
                    </div>
                    <div className="text-2xl font-bold break-words">
                      {currencySymbol}{filteredTotal.toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={resetFilters}
                    className="mt-2 text-xs text-orange-600 hover:text-orange-800 hover:underline"
                  >
                    Reset filters
                  </button>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-8 pb-6">
              <div className="w-full overflow-x-auto">
                <div className={`${isMobile ? 'min-w-[250px]' : 'w-full'}`}>
                  <Dashboard 
                    type="expense" 
                    filteredTransactions={selectedEmotion === 'all' && selectedCategory === 'all' ? undefined : filteredTransactions} 
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <EmotionFilter 
              selectedEmotion={selectedEmotion} 
              onChange={setSelectedEmotion} 
            />
            
            <CategoryFilter 
              selectedCategory={selectedCategory}
              categories={expenseCategories}
              onChange={setSelectedCategory}
            />
          </div>
          
          <CategoryList 
            type="expense" 
            filteredTransactions={selectedEmotion === 'all' && selectedCategory === 'all' ? undefined : filteredTransactions} 
          />
          
          {!isMobile && (
            <div className="mt-6">
              <LocalStorageInfo />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <EmotionFilter 
              selectedEmotion={selectedEmotion} 
              onChange={setSelectedEmotion} 
            />
            
            <CategoryFilter 
              selectedCategory={selectedCategory}
              categories={expenseCategories}
              onChange={setSelectedCategory}
            />
          </div>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-6'}`}>
            <div className="w-full max-w-lg mx-auto md:mx-0">
              <TransactionForm type="expense" />
            </div>
            <div className="w-full">
              <TransactionList 
                type="expense" 
                filteredTransactions={selectedEmotion === 'all' && selectedCategory === 'all' ? undefined : filteredTransactions} 
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
