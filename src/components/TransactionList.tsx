
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { Transaction, TransactionType } from "@/types";
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isWithinInterval, endOfDay, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { Trash2, Edit, Search, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import EditTransactionModal from "./EditTransactionModal";

interface TransactionListProps {
  type: TransactionType;
  limit?: number;
  showViewAll?: boolean;
  filteredTransactions?: Transaction[];
}

type TimePeriod = "day" | "week" | "month" | "year" | "all";

const TransactionList: React.FC<TransactionListProps> = ({ type, limit, showViewAll = false, filteredTransactions }) => {
  const { getTransactionsByType, deleteTransaction, getCategoryById, isOnline, pendingSyncCount } = useTransactions();
  const { currencySymbol } = useCurrency();
  const allTransactions = getTransactionsByType(type);
  const transactions = filteredTransactions || allTransactions;
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filterTransactionsByTimePeriod = (transactions: Transaction[], period: TimePeriod): Transaction[] => {
    if (period === "all") return transactions;
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (period) {
      case "day":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        return transactions;
    }
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return isWithinInterval(transactionDate, { start: startDate, end: endDate });
    });
  };

  const filterTransactionsBySearch = (transactions: Transaction[], query: string): Transaction[] => {
    if (!query.trim()) return transactions;
    
    const lowercaseQuery = query.toLowerCase().trim();
    
    return transactions.filter(transaction => {
      const category = getCategoryById(transaction.categoryId);
      const categoryName = category?.name || "";
      const description = transaction.description || "";
      
      return (
        description.toLowerCase().includes(lowercaseQuery) ||
        categoryName.toLowerCase().includes(lowercaseQuery)
      );
    });
  };

  const filteredByTimePeriod = filterTransactionsByTimePeriod(transactions, timePeriod);
  
  const filteredBySearch = filterTransactionsBySearch(filteredByTimePeriod, searchQuery);
  
  const sortedTransactions = [...filteredBySearch].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const displayTransactions = limit ? sortedTransactions.slice(0, limit) : sortedTransactions;

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case "happy": return "bg-green-100 text-green-800 border-green-300";
      case "stressed": return "bg-red-100 text-red-800 border-red-300";
      case "bored": return "bg-orange-100 text-orange-800 border-orange-300";
      case "excited": return "bg-purple-100 text-purple-800 border-purple-300";
      case "sad": return "bg-blue-100 text-blue-800 border-blue-300";
      case "neutral": return "bg-gray-100 text-gray-600 border-gray-200";
      case "hopeful": return "bg-blue-50 text-blue-600 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case "day": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "year": return "This Year";
      default: return "All Time";
    }
  };

  return (
    <>
      <Card className="border-orange-200 shadow-lg bg-gradient-to-b from-white to-orange-50/30">
        <CardHeader className="border-b border-orange-100">
          <div className="flex flex-wrap justify-between items-center">
            <CardTitle className="text-orange-600">Recent Transactions</CardTitle>
            <div className="flex items-center gap-2">
              {!isOnline && pendingSyncCount > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <CloudOff className="h-3 w-3" />
                  <span>{pendingSyncCount} pending</span>
                </Badge>
              )}
              <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 relative">
            <Input
              placeholder="Search descriptions or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mt-3">
            {displayTransactions.length > 0 ? (
              displayTransactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                return (
                  <div
                    key={transaction.id}
                    className="flex flex-wrap items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow duration-200"
                    style={{
                      borderLeftColor: category?.color || "#ccc",
                      borderLeftWidth: "4px",
                    }}
                  >
                    <div className="flex flex-col mr-2 mb-2 sm:mb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium break-words max-w-[200px] sm:max-w-full">
                          {category?.name || "Unknown Category"}
                        </span>
                        {transaction.emotionalState && (
                          <Badge variant="outline" className={getEmotionColor(transaction.emotionalState)}>
                            {transaction.emotionalState}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground break-words max-w-[200px] sm:max-w-full">
                        {transaction.description || "No description"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), "EEE MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <span
                        className={`font-semibold ${
                          type === "expense" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {type === "expense" ? "-" : "+"}{currencySymbol}{transaction.amount.toFixed(2)}
                      </span>
                      <div className="flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-100"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 
                  `No results found for "${searchQuery}"` : 
                  `No ${type} transactions found for ${getPeriodLabel().toLowerCase()}.`
                }
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};

export default TransactionList;
