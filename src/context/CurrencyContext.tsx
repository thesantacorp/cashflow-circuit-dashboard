
import React, { createContext, useContext, useState, useEffect } from "react";
import { Currency } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  // Use try/catch to safely access auth context during initialization
  let authUser = null;
  try {
    const { user } = useAuth();
    authUser = user;
  } catch (error) {
    console.warn("Auth context not available yet");
  }

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("currency");
    return (saved as Currency) || "USD";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch currency preference from Supabase when user logs in
  useEffect(() => {
    const fetchCurrencyPreference = async () => {
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if the user has a currency preference in Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('currency_preference')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching currency preference:', error);
          setIsLoading(false);
          return;
        }

        // If there's a preference in Supabase, use it
        if (data?.currency_preference) {
          setCurrency(data.currency_preference as Currency);
          localStorage.setItem("currency", data.currency_preference);
        } else {
          // If no preference in Supabase but there is one in localStorage, sync it to Supabase
          const localCurrency = localStorage.getItem("currency");
          if (localCurrency && authUser.id) {
            await supabase
              .from('profiles')
              .update({ currency_preference: localCurrency })
              .eq('id', authUser.id);
          }
        }
      } catch (error) {
        console.error('Error in currency sync:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencyPreference();
  }, [authUser]);

  // Update currency preference in Supabase when it changes
  const updateCurrency = async (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);

    // Also update in Supabase if user is logged in
    if (authUser) {
      try {
        await supabase
          .from('profiles')
          .update({ currency_preference: newCurrency })
          .eq('id', authUser.id);
      } catch (error) {
        console.error('Error updating currency preference:', error);
      }
    }
  };

  const value = {
    currency,
    setCurrency: updateCurrency,
    currencySymbol: currencySymbols[currency],
  };

  // Show actual content only after loading is completed
  if (isLoading && authUser) {
    return <>{children}</>;
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
