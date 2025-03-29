
import React from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Transaction, TransactionType } from "@/types";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TransactionListProps {
  type: TransactionType;
}

const TransactionList: React.FC<TransactionListProps> = ({ type }) => {
  const { getTransactionsByType, deleteTransaction, getCategoryById } = useTransactions();
  const { currencySymbol } = useCurrency();
  const transactions = getTransactionsByType(type);

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
      case "happy": return "bg-green-100 text-green-800";
      case "stressed": return "bg-red-100 text-red-800";
      case "bored": return "bg-orange-100 text-orange-800";
      case "excited": return "bg-purple-100 text-purple-800";
      case "sad": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedTransactions.map((transaction) => {
            const category = getCategoryById(transaction.categoryId);
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-lg"
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
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold ${
                      type === "expense" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {type === "expense" ? "-" : "+"}{currencySymbol}{transaction.amount.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteTransaction(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;
