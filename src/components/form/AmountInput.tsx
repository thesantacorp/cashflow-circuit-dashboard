
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AmountInputProps {
  amount: string;
  onAmountChange: (value: string) => void;
  currencySymbol: string;
}

const AmountInput: React.FC<AmountInputProps> = ({ 
  amount, 
  onAmountChange, 
  currencySymbol
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount" className="text-orange-700 font-medium">Amount</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 font-medium">
          {currencySymbol}
        </span>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          className="pl-8 border-orange-200 focus-visible:ring-orange-400"
          required
        />
      </div>
    </div>
  );
};

export default AmountInput;
