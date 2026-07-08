import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTransactions } from "@/context/transaction";
import { Transaction, TransactionType } from "@/types";
import { useCurrency } from "@/context/CurrencyContext";
import { formatNumberWithCommas } from "@/lib/utils";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  startOfQuarter, endOfQuarter, subMonths, isWithinInterval, format,
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
  const [selected, setSelected] = useState<{ id: string; name: string; color: string } | null>(null);

  const scopedTxs = useMemo(() => {
    const source = filteredTransactions ?? state.transactions;
    return filterByPeriod(source.filter(t => t.type === type), timePeriod);
  }, [filteredTransactions, state.transactions, type, timePeriod]);

  const rows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of scopedTxs) {
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
  }, [scopedTxs, categories]);

  const detailTxs = useMemo(() => {
    if (!selected) return [];
    return scopedTxs
      .filter(t => t.categoryId === selected.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [scopedTxs, selected]);

  const detailTotal = useMemo(
    () => detailTxs.reduce((s, t) => s + t.amount, 0),
    [detailTxs]
  );

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
                <button
                  type="button"
                  onClick={() => setSelected({ id: r.id, name: r.name, color: r.color })}
                  className="w-full text-left rounded-md p-1 -m-1 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  aria-label={`View transactions in ${r.name}`}
                >
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selected?.color }}
              />
              <span className="truncate">{selected?.name}</span>
              <span className="ml-auto text-sm font-medium text-muted-foreground">
                {periodLabel(timePeriod)}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-between items-center border-b pb-2 text-sm">
            <span className="text-muted-foreground">
              {detailTxs.length} transaction{detailTxs.length === 1 ? "" : "s"}
            </span>
            <span className="font-semibold">
              {currencySymbol}{formatNumberWithCommas(detailTotal)}
            </span>
          </div>

          <div className="overflow-y-auto flex-1 -mx-2">
            {detailTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No transactions found.
              </p>
            ) : (
              <ul className="divide-y">
                {detailTxs.map(t => (
                  <li key={t.id} className="flex justify-between items-start gap-3 px-2 py-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {t.description || selected?.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.date), "MMM d, yyyy")}
                        {t.emotionalState ? ` · ${t.emotionalState}` : ""}
                      </div>
                    </div>
                    <div className="font-semibold text-sm whitespace-nowrap">
                      {currencySymbol}{formatNumberWithCommas(t.amount)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CategoryBreakdown;
