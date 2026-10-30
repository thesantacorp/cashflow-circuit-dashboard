import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface BudgetItem {
  id: string;
  category_id: string;
  amount: number;
  month: number;
  year: number;
}

export function useBudgets(month: number, year: number) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  let user = null;
  try {
    const auth = useAuth();
    user = auth.user;
  } catch {
    // auth not ready
  }

  const fetchBudgets = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_email", user.email)
        .eq("month", month)
        .eq("year", year);

      if (error) throw error;
      setBudgets(
        (data || []).map((b: any) => ({
          id: b.id,
          category_id: b.category_id,
          amount: Number(b.amount),
          month: b.month,
          year: b.year,
        }))
      );
    } catch (err) {
      console.error("Error fetching budgets:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.email, month, year]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const upsertBudget = async (categoryId: string, amount: number) => {
    if (!user?.email) return false;
    try {
      const { error } = await supabase.from("budgets").upsert(
        {
          user_email: user.email,
          category_id: categoryId,
          amount,
          month,
          year,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email,category_id,month,year" }
      );
      if (error) throw error;
      await fetchBudgets();
      return true;
    } catch (err) {
      console.error("Error upserting budget:", err);
      toast.error("Failed to save budget");
      return false;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
      await fetchBudgets();
      return true;
    } catch (err) {
      console.error("Error deleting budget:", err);
      toast.error("Failed to delete budget");
      return false;
    }
  };

  return { budgets, loading, upsertBudget, deleteBudget, refetch: fetchBudgets };
}
