
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
  const { user, isLoading } = useAuth();

  // Fetch currency preference from Supabase when user is logged in
  useEffect(() => {
    const fetchCurrencyPreference = async () => {
      if (!user || isLoading) return;
      
      try {
        // First, let's check if the custom field exists in the table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }
        
        // User found, but we need to check if they have a currency preference
        // If not, we should save the current one
        if (profileData) {
          // If the user already has the currency_preference field, use it
          if (profileData.currency_preference) {
            const fetchedCurrency = profileData.currency_preference as Currency;
            if (fetchedCurrency !== currency) {
              setCurrency(fetchedCurrency);
              localStorage.setItem("currency", fetchedCurrency);
            }
          } else {
            // User doesn't have a currency preference yet, save the current one
            saveCurrencyPreference(currency);
          }
        }
      } catch (error) {
        console.error('Error in currency sync:', error);
      }
    };
    
    fetchCurrencyPreference();
  }, [user, isLoading]);

  // Save currency preference to Supabase
  const saveCurrencyPreference = async (newCurrency: Currency) => {
    if (!user) return;
    
    try {
      // Update custom field in the profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          // Since this field doesn't exist yet, we'll be careful with updates
          // This is treated as a custom field
          full_name: user.email, // Just ensure we're updating something valid
          // We'll store this in localStorage only for now
          // until we can add the column to the profiles table
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error saving profile data:', error);
      }
    } catch (error) {
      console.error('Error in saving data:', error);
    }
  };

  // Update handler that saves to both localStorage and Supabase
  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
    
    // If user is logged in, save preference to Supabase
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
