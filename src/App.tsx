
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/context/transaction/provider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { BackupProvider } from "@/context/BackupContext";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import CommunityLink from "@/components/CommunityLink";
import LoadingScreen from "@/components/LoadingScreen";
import OverviewPage from "@/pages/OverviewPage";
import ExpensesPage from "@/pages/ExpensesPage";
import IncomePage from "@/pages/IncomePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating app initialization time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionProvider>
        <CurrencyProvider>
          <BackupProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnimatePresence>
                  {isLoading && <LoadingScreen />}
                </AnimatePresence>
                <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white overflow-x-hidden">
                  <Navbar />
                  <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                    <div className="max-w-7xl mx-auto w-full">
                      <Routes>
                        <Route path="/" element={<OverviewPage />} />
                        <Route path="/expenses" element={<ExpensesPage />} />
                        <Route path="/income" element={<IncomePage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </main>
                  <CommunityLink />
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </BackupProvider>
        </CurrencyProvider>
      </TransactionProvider>
    </QueryClientProvider>
  );
}

export default App;
