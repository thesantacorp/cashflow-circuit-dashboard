
import React, { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { TransactionType, EmotionalState } from "@/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPurchaseWarning } from "@/utils/emotionAnalysis";
import AmountInput from "./form/AmountInput";
import CategorySelector from "./form/CategorySelector";
import DatePicker from "./form/DatePicker";
import EmotionSelector from "./form/EmotionSelector";
import WarningAlert from "./form/WarningAlert";

interface TransactionFormProps {
  type: TransactionType;
  onSuccess?: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ type, onSuccess }) => {
  const { addTransaction, getCategoriesByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const categories = getCategoriesByType(type);
  
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("neutral");
  const [warning, setWarning] = useState<string | null>(null);

  const resetForm = () => {
    setAmount("");
    setCategoryId("");
    setDescription("");
    setDate(new Date());
    setEmotionalState("neutral");
    setWarning(null);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    
    if (type === "expense" && emotionalState) {
      const warningMessage = getPurchaseWarning(
        value,
        emotionalState,
        state.transactions,
        state.categories
      );
      setWarning(warningMessage);
    }
  };

  const handleEmotionChange = (value: EmotionalState) => {
    setEmotionalState(value);
    
    if (categoryId && type === "expense") {
      const warningMessage = getPurchaseWarning(
        categoryId,
        value,
        state.transactions,
        state.categories
      );
      setWarning(warningMessage);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    addTransaction({
      amount: parsedAmount,
      categoryId,
      description,
      date: date.toISOString(),
      type,
      emotionalState,
    });
    
    resetForm();
    if (onSuccess) onSuccess();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add {type === "expense" ? "Expense" : "Income"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <WarningAlert message={warning || ""} />
          
          <AmountInput 
            amount={amount} 
            onAmountChange={setAmount} 
            currencySymbol={currencySymbol} 
          />
          
          <CategorySelector 
            categoryId={categoryId} 
            categories={categories} 
            onCategoryChange={handleCategoryChange} 
          />
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker date={date} onDateChange={(newDate) => newDate && setDate(newDate)} />
          </div>
          
          {type === "expense" && (
            <EmotionSelector 
              emotionalState={emotionalState} 
              onChange={handleEmotionChange} 
            />
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" variant="default">
            Add {type === "expense" ? "Expense" : "Income"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TransactionForm;
