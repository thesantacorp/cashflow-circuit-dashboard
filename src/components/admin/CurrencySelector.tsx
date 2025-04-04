
import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  onSymbolChange: (symbol: string) => void;
}

const ProjectCurrencySelector: React.FC<CurrencySelectorProps> = ({ value, onChange, onSymbolChange }) => {
  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
    { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
    { code: "XOF", symbol: "CFA", name: "West African CFA franc" }
  ];

  const handleCurrencyChange = (currencyCode: string) => {
    onChange(currencyCode);
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (selectedCurrency) {
      onSymbolChange(selectedCurrency.symbol);
    }
  };

  return (
    <div>
      <Select value={value} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Select Project Currency</SelectLabel>
            {currencies.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {currency.symbol} - {currency.name} ({currency.code})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectCurrencySelector;
