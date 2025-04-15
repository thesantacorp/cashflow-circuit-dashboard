import React, { createContext, useContext, useState, useEffect } from "react";
import { Currency } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CurrencyContextProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencySymbol: string;
}

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  XOF: "CFA",
};

const CurrencyContext = createContext<CurrencyContextProps | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency");
    return (saved as Currency) || "USD";
  });
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    const fetchCurrencyPreference = async () => {
      if (!user || isLoading || !profile) return;
      
      try {
        if (profile.currency_preference) {
          const fetchedCurrency = profile.currency_preference as Currency;
          if (fetchedCurrency !== currency) {
            setCurrency(fetchedCurrency);
            localStorage.setItem("currency", fetchedCurrency);
          }
        } else {
          await saveCurrencyPreference(currency);
        }
      } catch (error) {
        console.error('Error in currency sync:', error);
      }
    };
    
    fetchCurrencyPreference();
  }, [user, profile, isLoading]);

  const saveCurrencyPreference = async (newCurrency: Currency) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          currency_preference: newCurrency
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving currency preference:', error);
      }
    } catch (error) {
      console.error('Error in saving currency preference:', error);
    }
  };

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
    
    if (user) {
      saveCurrencyPreference(newCurrency);
    }
  };

  const value = {
    currency,
    setCurrency: handleSetCurrency,
    currencySymbol: currencySymbols[currency],
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
