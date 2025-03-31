
import React from "react";
import Dashboard from "@/components/Dashboard";
import TransactionList from "@/components/TransactionList";
import EmotionInsightsEnhanced from "@/components/EmotionInsightsEnhanced";
import { motion } from "framer-motion";
import { useTransaction } from "@/context/transaction";

const OverviewPageEnhanced: React.FC = () => {
  const { transactions } = useTransaction();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-6">
        <Dashboard />
        <EmotionInsightsEnhanced />
        <TransactionList 
          title="Recent Transactions" 
          transactions={transactions.slice(0, 5)} 
          showViewAll 
        />
      </div>
    </motion.div>
  );
};

export default OverviewPageEnhanced;
