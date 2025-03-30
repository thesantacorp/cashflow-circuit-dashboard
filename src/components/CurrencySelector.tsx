
import React from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { Currency } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const currencyOptions: { value: Currency; label: string }[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "GHS", label: "GHS (₵)" },
  { value: "KES", label: "KES (KSh)" },
  { value: "XOF", label: "CFA franc (CFA)" },
];

const CurrencySelector: React.FC = () => {
  const { currency, setCurrency, currencySymbol } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-black bg-white">
          {currencySymbol} {currency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {currencyOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setCurrency(option.value)}
            className={currency === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
