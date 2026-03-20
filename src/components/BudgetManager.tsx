import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactions } from "@/context/transaction";
import { useCurrency } from "@/context/CurrencyContext";
import { useBudgets } from "@/hooks/useBudgets";
import { Plus, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Category } from "@/types";

const BudgetManager: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#f97316");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);

  const { state, getCategoriesByType, addCategory } = useTransactions();
  const { currencySymbol } = useCurrency();
  const { budgets, loading, upsertBudget, deleteBudget } = useBudgets(month, year);

  const expenseCategories = getCategoriesByType("expense");

  // Categories that already have a budget this month
  const budgetedCategoryIds = useMemo(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets]
  );

  // Available categories (not yet budgeted)
  const availableCategories = useMemo(
    () => expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id)),
    [expenseCategories, budgetedCategoryIds]
  );

  // Spending per category for the current month
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    const monthStr = String(month).padStart(2, "0");
    const prefix = `${year}-${monthStr}`;

    state.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(prefix))
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [state.transactions, month, year]);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendingByCategory[b.category_id] || 0), 0);

  const monthLabel = new Date(year, month - 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const handleAddBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (!selectedCategoryId || isNaN(amount) || amount <= 0) {
      toast.error("Select a category and enter a valid amount");
      return;
    }
    const success = await upsertBudget(selectedCategoryId, amount);
    if (success) {
      toast.success("Budget added");
      setSelectedCategoryId("");
      setBudgetAmount("");
    }
  };

  const handleCreateCategoryAndBudget = async () => {
    const amount = parseFloat(budgetAmount);
    if (!newCategoryName.trim() || isNaN(amount) || amount <= 0) {
      toast.error("Enter a category name and valid amount");
      return;
    }

    // Create the expense category via the transaction context (syncs to Supabase)
    const success = addCategory({
      name: newCategoryName.trim(),
      type: "expense",
      color: newCategoryColor,
    });

    if (!success) return;

    // Wait a tick for state to update, then find the new category
    setTimeout(async () => {
      const cats = getCategoriesByType("expense");
      const created = cats.find(
        (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      if (created) {
        await upsertBudget(created.id, amount);
        toast.success(`Category "${created.name}" created & budget set`);
      }
      setNewCategoryName("");
      setBudgetAmount("");
      setShowNewCategory(false);
    }, 500);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = expenseCategories.find((c) => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = expenseCategories.find((c) => c.id === categoryId);
    return cat?.color || "#94a3b8";
  };

  return (
    <div className="space-y-6">
      {/* Month navigation + summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">{monthLabel}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-primary">
                {currencySymbol}{totalBudget.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className={`text-2xl font-bold ${totalSpent > totalBudget ? "text-destructive" : "text-foreground"}`}>
                {currencySymbol}{totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
          {totalBudget > 0 && (
            <div className="mt-4">
              <Progress
                value={Math.min((totalSpent / totalBudget) * 100, 100)}
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {((totalSpent / totalBudget) * 100).toFixed(0)}% used
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add budget form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showNewCategory ? (
            <>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="link"
                size="sm"
                className="px-0 text-xs"
                onClick={() => setShowNewCategory(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Create new category
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>New Category Name</Label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Subscriptions"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="h-10 w-16 rounded border border-input cursor-pointer"
                />
              </div>
              <Button
                variant="link"
                size="sm"
                className="px-0 text-xs"
                onClick={() => setShowNewCategory(false)}
              >
                Use existing category
              </Button>
            </>
          )}

          <div className="space-y-2">
            <Label>Budget Amount ({currencySymbol})</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button
            className="w-full"
            onClick={showNewCategory ? handleCreateCategoryAndBudget : handleAddBudget}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showNewCategory ? "Create Category & Set Budget" : "Add Budget"}
          </Button>
        </CardContent>
      </Card>

      {/* Budget list */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading budgets…</div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-1">No budgets set for {monthLabel}</p>
            <p className="text-sm">Add a budget above to start tracking your spending against your plan.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const spent = spendingByCategory[b.category_id] || 0;
            const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
            const remaining = b.amount - spent;
            const isOver = spent > b.amount;

            return (
              <Card key={b.id} className="overflow-hidden">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(b.category_id) }}
                      />
                      <span className="font-medium truncate">
                        {getCategoryName(b.category_id)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteBudget(b.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Progress
                    value={Math.min(pct, 100)}
                    className={`h-2 ${isOver ? "[&>div]:bg-destructive" : ""}`}
                  />

                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {currencySymbol}{spent.toFixed(2)} / {currencySymbol}{b.amount.toFixed(2)}
                    </span>
                    <span className={isOver ? "text-destructive font-medium flex items-center gap-1" : ""}>
                      {isOver && <AlertTriangle className="h-3 w-3" />}
                      {isOver
                        ? `Over by ${currencySymbol}${Math.abs(remaining).toFixed(2)}`
                        : `${currencySymbol}${remaining.toFixed(2)} left`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
