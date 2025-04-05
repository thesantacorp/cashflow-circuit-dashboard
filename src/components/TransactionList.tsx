
import React, { useState } from "react";
import { useTransactions } from "@/context/transaction";
import { Category, Transaction as TransactionType, TransactionType as TType } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useCurrency } from "@/context/CurrencyContext";
import EditTransactionModal from "./EditTransactionModal";
import { Button } from "./ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

interface TransactionListProps {
  type?: TType;
  limit?: number;
  title?: string;
}

const TransactionList: React.FC<TransactionListProps> = ({ type, limit, title }) => {
  const { state, deleteTransaction, getCategoryById } = useTransactions();
  const { currencySymbol } = useCurrency();
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showEmotions, setShowEmotions] = useState<boolean>(false);

  // Filter transactions by type if specified
  const transactions = React.useMemo(() => {
    let filtered = state.transactions;
    
    if (type && type !== "combined") {
      filtered = filtered.filter((t) => t.type === type);
    }
    
    // Sort by date (newest first)
    filtered = [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Apply limit if specified
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [state.transactions, type, limit]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
    }
  };

  const handleEdit = (transaction: TransactionType) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setSelectedTransaction(null);
    setShowEditModal(false);
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title || "Transactions"}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No transactions found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title || "Transactions"}</CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              id="show-emotions"
              checked={showEmotions}
              onCheckedChange={setShowEmotions}
            />
            <Label htmlFor="show-emotions">Show Emotions</Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                {showEmotions && <TableHead>Emotion</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const category = getCategoryById(transaction.categoryId);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {category ? (
                          <>
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.name}
                          </>
                        ) : (
                          "Unknown"
                        )}
                        {type === "combined" && (
                          <Badge
                            variant={transaction.type === "expense" ? "destructive" : "default"}
                            className="ml-2"
                          >
                            {transaction.type === "expense" ? "Expense" : "Income"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={
                        transaction.type === "expense"
                          ? "text-destructive font-medium"
                          : "text-green-600 font-medium"
                      }
                    >
                      {transaction.type === "expense" ? "-" : "+"}
                      {currencySymbol}
                      {transaction.amount.toFixed(2)}
                    </TableCell>
                    {showEmotions && (
                      <TableCell>
                        {transaction.emotionalState || "neutral"}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <EditTransactionModal
        transaction={selectedTransaction}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
      />
    </Card>
  );
};

export default TransactionList;
