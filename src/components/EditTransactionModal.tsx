
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Transaction, TransactionType } from "@/types";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import AmountInput from "./form/AmountInput";
import CategorySelector from "./form/CategorySelector";
import DatePicker from "./form/DatePicker";
import EmotionSelector from "./form/EmotionSelector";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmotionalState } from "@/types";
import WarningAlert from "./form/WarningAlert";
import { getPurchaseWarning } from "@/utils/emotionAnalysis";

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { updateTransaction, getCategoriesByType, getCategoryById, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("neutral");
  const [warning, setWarning] = useState<string | null>(null);
  const [type, setType] = useState<TransactionType>("expense");
  
  // Load transaction data when the modal opens
  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId);
      setDescription(transaction.description || "");
      setDate(new Date(transaction.date));
      setEmotionalState(transaction.emotionalState || "neutral");
      setType(transaction.type);
      setWarning(null);
    }
  }, [transaction]);
  
  const categories = transaction ? getCategoriesByType(transaction.type) : [];
  
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
    
    if (!transaction || !amount || !categoryId) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    updateTransaction({
      ...transaction,
      amount: parsedAmount,
      categoryId,
      description,
      date: date.toISOString(),
      emotionalState,
    });
    
    onClose();
  };
  
  if (!transaction) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-gradient-to-b from-background to-background/90 backdrop-blur-sm max-h-[95vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-orange-500">
            Edit {transaction.type === "expense" ? "Expense" : "Income"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            {transaction.type === "expense" && (
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
                className="border-orange-200 focus-visible:ring-orange-400"
              />
            </div>
          </form>
        </ScrollArea>
        
        <DialogFooter className="pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-orange-300 text-gray-700 hover:bg-orange-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
