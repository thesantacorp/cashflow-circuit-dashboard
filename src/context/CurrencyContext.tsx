
import React, { createContext, useContext, useState, useEffect } from "react";
import { Currency } from "@/types";

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

  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  const value = {
    currency,
    setCurrency,
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
