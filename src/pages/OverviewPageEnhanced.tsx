
import React from "react";
import Dashboard from "@/components/Dashboard";
import TransactionList from "@/components/TransactionList";
import EmotionInsightsEnhanced from "@/components/EmotionInsightsEnhanced";
import { motion } from "framer-motion";
import { useTransactions } from "@/context/transaction";

const OverviewPageEnhanced: React.FC = () => {
  const { state } = useTransactions();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid gap-6">
        <Dashboard type="expense" />
        <EmotionInsightsEnhanced />
        <TransactionList 
          type="expense"
          showViewAll={true}
        />
      </div>
    </motion.div>
  );
};

export default OverviewPageEnhanced;
