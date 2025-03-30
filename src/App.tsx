
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/context/transaction/provider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { BackupProvider } from "@/context/BackupContext";
import Navbar from "@/components/Navbar";
import CommunityLink from "@/components/CommunityLink";
import OverviewPage from "@/pages/OverviewPage";
import ExpensesPage from "@/pages/ExpensesPage";
import IncomePage from "@/pages/IncomePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TransactionProvider>
      <CurrencyProvider>
        <BackupProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
                <Navbar />
                <main className="flex-1 py-6">
                  <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/income" element={<IncomePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
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

export default App;
