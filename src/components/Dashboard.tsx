
import React, { useMemo } from "react";
import { useTransactions } from "@/context/transaction";
import { Transaction, TransactionType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrency } from "@/context/CurrencyContext";
import EmotionInsights from "./EmotionInsights";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNumberWithCommas } from "@/lib/utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { TimePeriod } from "./TimePeriodSelect";

interface DashboardProps {
  type: TransactionType;
  filteredTransactions?: Transaction[];
  timePeriod?: TimePeriod;
}

const filterTransactionsByTimePeriod = (transactions: Transaction[], period: TimePeriod = "month"): Transaction[] => {
  if (!period || period === "all") return transactions;
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

const getPeriodLabel = (period?: TimePeriod) => {
  switch (period) {
    case "day": return "Today";
    case "week": return "This Week";
    case "month": return "This Month";
    case "year": return "This Year";
    default: return "All Time";
  }
};

const Dashboard: React.FC<DashboardProps> = ({ type, filteredTransactions, timePeriod="month" }) => {
  const { getTotalByType, state } = useTransactions();
  const { currencySymbol } = useCurrency();
  const isMobile = useIsMobile();

  // Calculate total based on filtered + time range if provided
  const transactionsForTotal = useMemo(() => {
    let txs = filteredTransactions ?? state.transactions;
    return filterTransactionsByTimePeriod(
      txs.filter(t => t.type === type),
      timePeriod
    );
  }, [filteredTransactions, state.transactions, type, timePeriod]);

  const total = useMemo(() => {
    return transactionsForTotal.reduce((sum, t) => sum + t.amount, 0);
  }, [transactionsForTotal]);

  return (
    <div className="grid gap-6 w-full pb-6">
      <Card className="bg-primary text-primary-foreground w-full overflow-hidden min-w-[250px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl md:text-2xl">
            Total {type === "expense" ? "Expenses" : "Income"}
            <span className="ml-2 text-base font-medium text-white/75">{getPeriodLabel(timePeriod)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl md:text-3xl font-bold break-words">
            {currencySymbol}{formatNumberWithCommas(total)}
          </div>
        </CardContent>
      </Card>
      {type === "expense" && (
        <div className="w-full">
          <EmotionInsights filteredTransactions={filteredTransactions} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
