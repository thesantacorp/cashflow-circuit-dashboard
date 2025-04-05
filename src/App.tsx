
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/context/transaction/provider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { BackupProvider } from "@/context/BackupContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import CommunityLink from "@/components/CommunityLink";
import LoadingScreen from "@/components/LoadingScreen";
import OverviewPageEnhanced from "@/pages/OverviewPageEnhanced";
import ExpensesPage from "@/pages/ExpensesPage";
import IncomePage from "@/pages/IncomePage";
import RecoverPage from "@/pages/RecoverPage";
import NotFound from "./pages/NotFound";
import AdminNotificationDashboard from "./pages/AdminNotificationDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { initSessionTracking } from "./utils/sessionTracking";
import { initRecoverySystem } from "./utils/userDataRecovery";
import { initializeSupabase } from "./utils/supabaseInit";
import { toast } from "sonner";

const queryClient = new QueryClient();
const MAX_LOADING_TIME = 5000; // Max loading time before force continuing

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      setInitAttempted(true);
      
      // Ensure we don't get stuck on loading screen
      const forceLoadTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn("Force continuing app initialization after timeout");
          setIsLoading(false);
          toast.warning("Some features initialized slowly", {
            description: "The app will continue in local mode"
          });
        }
      }, MAX_LOADING_TIME);
      
      // Initialize Supabase connection first
      try {
        console.log("Initializing Supabase connection...");
        const success = await initializeSupabase();
        setSupabaseInitialized(success);
        
        if (!success) {
          console.warn("Continuing without full Supabase initialization");
        }
      } catch (error) {
        console.error("Failed to initialize Supabase:", error);
        toast.error("Could not connect to the database", {
          description: "Your data will be stored locally only",
          duration: 5000,
        });
      }
      
      // Initialize session tracking
      initSessionTracking();
      
      // Initialize recovery system
      initRecoverySystem();
      
      // Simulating app initialization time - use shorter time for better UX
      setTimeout(() => {
        clearTimeout(forceLoadTimeout); // Clear the force timeout if normal init completes
        setIsLoading(false);
      }, 1500);
    };
    
    if (!initAttempted) {
      initApp();
    }
    
    // Auto-sync check on app focus or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && supabaseInitialized) {
        console.log("App is visible again, checking for sync needs...");
        // This will trigger the TransactionProvider to check if syncing is needed
        window.dispatchEvent(new Event('app-visible'));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabaseInitialized, isLoading, initAttempted]);

  return (
    <QueryClientProvider client={queryClient}>
      <TransactionProvider>
        <CurrencyProvider>
          <BackupProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AnimatePresence>
                    {isLoading && <LoadingScreen />}
                  </AnimatePresence>
                  
                  <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white overflow-x-hidden">
                    <Routes>
                      <Route path="/admin/notifications" element={<AdminNotificationDashboard />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/recover/:recoveryId" element={<RecoverPage />} />
                      <Route path="/*" element={
                        <>
                          <Navbar />
                          <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                            <div className="max-w-7xl mx-auto w-full">
                              <Routes>
                                <Route path="/" element={<OverviewPageEnhanced />} />
                                <Route path="/expenses" element={<ExpensesPage />} />
                                <Route path="/income" element={<IncomePage />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </div>
                          </main>
                          <CommunityLink />
                        </>
                      } />
                    </Routes>
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </BackupProvider>
        </CurrencyProvider>
      </TransactionProvider>
    </QueryClientProvider>
  );
}

export default App;
