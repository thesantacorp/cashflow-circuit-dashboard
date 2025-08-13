import { useState, useEffect, useCallback } from 'react';
import { Transaction, Category } from '@/types';

interface OfflineData {
  transactions: Transaction[];
  categories: Category[];
  lastModified: number;
}

const STORAGE_KEY = 'offlineTransactionData';
const INITIAL_CATEGORIES: Category[] = [
  { id: "1", name: "Food & Drinks", type: "expense", color: "#e74c3c" },
  { id: "2", name: "Housing", type: "expense", color: "#3498db" },
  { id: "3", name: "Transportation", type: "expense", color: "#2ecc71" },
  { id: "4", name: "Entertainment", type: "expense", color: "#9b59b6" },
  { id: "5", name: "Shopping", type: "expense", color: "#f39c12" },
  { id: "6", name: "Utilities", type: "expense", color: "#1abc9c" },
  { id: "7", name: "Healthcare", type: "expense", color: "#e67e22" },
  { id: "10", name: "Salary", type: "income", color: "#27ae60" },
  { id: "11", name: "Freelance", type: "income", color: "#2980b9" },
  { id: "12", name: "Investments", type: "income", color: "#8e44ad" },
  { id: "13", name: "Gifts", type: "income", color: "#d35400" }
];

export function useOfflineStorage() {
  const [data, setData] = useState<OfflineData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          transactions: parsed.transactions || [],
          categories: parsed.categories || INITIAL_CATEGORIES,
          lastModified: parsed.lastModified || Date.now()
        };
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
    
    return {
      transactions: [],
      categories: INITIAL_CATEGORIES,
      lastModified: Date.now()
    };
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, [data]);

  const updateData = useCallback((updates: Partial<Pick<OfflineData, 'transactions' | 'categories'>>) => {
    setData(prev => ({
      ...prev,
      ...updates,
      lastModified: Date.now()
    }));
  }, []);

  const addTransaction = useCallback((transaction: Transaction) => {
    setData(prev => ({
      ...prev,
      transactions: [...prev.transactions, transaction],
      lastModified: Date.now()
    }));
  }, []);

  const updateTransaction = useCallback((transaction: Transaction) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => 
        t.id === transaction.id ? transaction : t
      ),
      lastModified: Date.now()
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
      lastModified: Date.now()
    }));
  }, []);

  const addCategory = useCallback((category: Category) => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, category],
      lastModified: Date.now()
    }));
  }, []);

  const updateCategory = useCallback((category: Category) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => 
        c.id === category.id ? category : c
      ),
      lastModified: Date.now()
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      lastModified: Date.now()
    }));
  }, []);

  const replaceAllData = useCallback((newData: Pick<OfflineData, 'transactions' | 'categories'>) => {
    setData({
      ...newData,
      lastModified: Date.now()
    });
  }, []);

  return {
    data,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    replaceAllData,
    updateData
  };
}