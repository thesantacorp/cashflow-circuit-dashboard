import React, { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { TransactionType, EmotionalState } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { getPurchaseWarning } from "@/utils/emotionAnalysis";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TransactionFormProps {
  type: TransactionType;
  onSuccess?: () => void;
}

const emotionOptions: { value: EmotionalState; label: string }[] = [
  { value: "happy", label: "Happy" },
  { value: "stressed", label: "Stressed" },
  { value: "bored", label: "Bored" },
  { value: "excited", label: "Excited" },
  { value: "sad", label: "Sad" },
  { value: "neutral", label: "Neutral" },
];

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
          {warning && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currencySymbol}
              </span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-8"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={handleCategoryChange} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      <span
                        className="h-3 w-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {type === "expense" && (
            <div className="space-y-2">
              <Label>How do you feel?</Label>
              <RadioGroup
                value={emotionalState}
                onValueChange={(value) => handleEmotionChange(value as EmotionalState)}
                className="grid grid-cols-3 gap-2"
              >
                {emotionOptions.map((emotion) => (
                  <div key={emotion.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={emotion.value} id={`emotion-${emotion.value}`} />
                    <Label htmlFor={`emotion-${emotion.value}`} className="cursor-pointer">
                      {emotion.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
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
