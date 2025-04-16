
import React, { useEffect, useState } from "react";
import AppLogo from "./AppLogo";
import { motion } from "framer-motion";
import { useTransactions } from "@/context/transaction";
import { useAuth } from "@/context/AuthContext";

const LoadingScreen = () => {
  const [showLoadingText, setShowLoadingText] = useState(false);
  const { isLoading: isAuthLoading, user } = useAuth();
  const { isOnline } = useTransactions();
  
  // Show additional loading text after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingText(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <AppLogo size={80} className="text-white mb-6" />
        <motion.h1 
          className="text-4xl font-bold text-white mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Stack'd
        </motion.h1>
        <motion.div
          className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: "4rem" }}
          transition={{ delay: 0.6, duration: 1 }}
        >
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "loop",
              duration: 1.5,
              ease: "linear"
            }}
          />
        </motion.div>
        
        {showLoadingText && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-white text-center px-4"
          >
            <p className="text-sm">
              {isAuthLoading ? "Authenticating..." : 
               !user ? "Preparing application..." : 
               !isOnline ? "Offline mode, loading local data..." : 
               "Syncing your data..."}
            </p>
            <p className="text-xs mt-2 max-w-xs">
              If this screen persists, try refreshing the page or checking your connection.
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
