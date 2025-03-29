
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { Transaction, TransactionType } from "@/types";
import { format } from "date-fns";
import { Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EditTransactionModal from "./EditTransactionModal";

interface TransactionListProps {
  type: TransactionType;
}

const TransactionList: React.FC<TransactionListProps> = ({ type }) => {
  const { getTransactionsByType, deleteTransaction, getCategoryById } = useTransactions();
  const { currencySymbol } = useCurrency();
  const transactions = getTransactionsByType(type);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
  };

  if (sortedTransactions.length === 0) {
    return (
      <Card className="border-orange-200 shadow-lg">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="text-orange-600">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No {type} transactions found.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case "happy": return "bg-green-100 text-green-800 border-green-300";
      case "stressed": return "bg-red-100 text-red-800 border-red-300";
      case "bored": return "bg-orange-100 text-orange-800 border-orange-300";
      case "excited": return "bg-purple-100 text-purple-800 border-purple-300";
      case "sad": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <>
      <Card className="border-orange-200 shadow-lg bg-gradient-to-b from-white to-orange-50/30">
        <CardHeader className="border-b border-orange-100">
          <CardTitle className="text-orange-600">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mt-3">
            {sortedTransactions.map((transaction) => {
              const category = getCategoryById(transaction.categoryId);
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow duration-200"
                  style={{
                    borderLeftColor: category?.color || "#ccc",
                    borderLeftWidth: "4px",
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {category?.name || "Unknown Category"}
                      </span>
                      {transaction.emotionalState && transaction.emotionalState !== "neutral" && (
                        <Badge variant="outline" className={getEmotionColor(transaction.emotionalState)}>
                          {transaction.emotionalState}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {transaction.description || "No description"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
            })}
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
