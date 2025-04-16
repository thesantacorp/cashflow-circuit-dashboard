
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await addTransaction({
        amount: parsedAmount,
        categoryId,
        description,
        date: date.toISOString(),
        type,
        emotionalState,
      });
      
      if (success) {
        resetForm();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-orange-200 shadow-lg bg-gradient-to-b from-white to-orange-50/30">
      <CardHeader className="border-b border-orange-100">
        <CardTitle className="text-orange-600">
          Add {type === "expense" ? "Expense" : "Income"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
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
            <Label htmlFor="date" className="text-orange-700 font-medium">Date</Label>
            <DatePicker date={date} onDateChange={(newDate) => newDate && setDate(newDate)} />
          </div>
          
          {type === "expense" && (
            <EmotionSelector 
              emotionalState={emotionalState} 
              onChange={handleEmotionChange} 
            />
          )}
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-orange-700 font-medium">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
              className="border-orange-200 focus-visible:ring-orange-400"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : `Add ${type === "expense" ? "Expense" : "Income"}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default TransactionForm;
