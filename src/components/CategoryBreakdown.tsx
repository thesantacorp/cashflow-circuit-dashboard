import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/context/transaction";
import { Transaction, TransactionType } from "@/types";
import { useCurrency } from "@/context/CurrencyContext";
import { formatNumberWithCommas } from "@/lib/utils";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  startOfQuarter, endOfQuarter, subMonths, isWithinInterval,
} from "date-fns";
import { TimePeriod } from "./TimePeriodSelect";

interface Props {
  type: TransactionType;
  filteredTransactions?: Transaction[];
  timePeriod?: TimePeriod;
}

const filterByPeriod = (txs: Transaction[], period: TimePeriod = "month"): Transaction[] => {
  if (!period || period === "all") return txs;
  const now = new Date();
  let start: Date, end: Date;
  switch (period) {
    case "day": start = startOfDay(now); end = endOfDay(now); break;
    case "week": start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); break;
    case "month": start = startOfMonth(now); end = endOfMonth(now); break;
    case "last_month": { const lm = subMonths(now, 1); start = startOfMonth(lm); end = endOfMonth(lm); break; }
    case "quarter": start = startOfQuarter(now); end = endOfQuarter(now); break;
    case "year": start = startOfYear(now); end = endOfYear(now); break;
    default: return txs;
  }
  return txs.filter(t => isWithinInterval(new Date(t.date), { start, end }));
};

const periodLabel = (p?: TimePeriod) => {
  switch (p) {
    case "day": return "Today";
    case "week": return "This Week";
    case "month": return "This Month";
    case "last_month": return "Last Month";
    case "quarter": return "This Quarter";
    case "year": return "This Year";
    default: return "All Time";
  }
};

const CategoryBreakdown: React.FC<Props> = ({ type, filteredTransactions, timePeriod = "month" }) => {
  const { state, getCategoriesByType } = useTransactions();
  const { currencySymbol } = useCurrency();
  const categories = getCategoriesByType(type);

  const rows = useMemo(() => {
    const source = filteredTransactions ?? state.transactions;
    const scoped = filterByPeriod(source.filter(t => t.type === type), timePeriod);
    const totals = new Map<string, number>();
    for (const t of scoped) {
      totals.set(t.categoryId, (totals.get(t.categoryId) || 0) + t.amount);
    }
    const grand = Array.from(totals.values()).reduce((a, b) => a + b, 0);
    const list = Array.from(totals.entries()).map(([id, amount]) => {
      const cat = categories.find(c => c.id === id);
      return {
        id,
        name: cat?.name ?? "Uncategorized",
        color: cat?.color ?? "#94a3b8",
        amount,
        percent: grand > 0 ? (amount / grand) * 100 : 0,
      };
    });
    list.sort((a, b) => b.amount - a.amount);
    return { list, grand };
  }, [filteredTransactions, state.transactions, categories, type, timePeriod]);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg md:text-xl">
          {type === "expense" ? "Spending" : "Income"} by Category
          <span className="ml-2 text-sm font-medium text-muted-foreground">{periodLabel(timePeriod)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.list.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No {type === "expense" ? "expenses" : "income"} in this period yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.list.map((r, idx) => (
              <li key={r.id}>
                <div className="flex justify-between items-center mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs w-5 text-muted-foreground shrink-0">#{idx + 1}</span>
                    <span
                      className="inline-block w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-medium truncate">{r.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-sm">
                      {currencySymbol}{formatNumberWithCommas(r.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.percent.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${r.percent}%`, backgroundColor: r.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
