
import React from "react";
import { useTransactions } from "@/context/TransactionContext";
import { Transaction, TransactionType } from "@/types";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransactionListProps {
  type: TransactionType;
}

const TransactionList: React.FC<TransactionListProps> = ({ type }) => {
  const { getTransactionsByType, deleteTransaction, getCategoryById } = useTransactions();
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
                  <span className="font-medium">
                    {category?.name || "Unknown Category"}
                  </span>
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
                      type === "expense" ? "text-expense" : "text-income"
                    }`}
                  >
                    {type === "expense" ? "-" : "+"}${transaction.amount.toFixed(2)}
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
