
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
import GrowPage from "@/pages/GrowPage";
import NotFound from "./pages/NotFound";
import AdminNotificationDashboard from "./pages/AdminNotificationDashboard";
import AdminGrowPage from "./pages/AdminGrowPage";
import AdminDashboard from "./pages/AdminDashboard";
import { initSessionTracking } from "./utils/sessionTracking";
import { initRecoverySystem } from "./utils/userDataRecovery";
import { initializeSupabase, checkSupabaseConnection } from "./utils/supabaseInit";
import { toast } from "sonner";

const queryClient = new QueryClient();
const MAX_LOADING_TIME = 4000; // Reduced max loading time to improve UX

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseInitialized, setSupabaseInitialized] = useState(false);
  const [initAttempted, setInitAttempted] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online'|'offline'>(
    navigator.onLine ? 'online' : 'offline'
  );

  // Keep track of network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      // If we're already initialized, check Supabase connection on reconnect
      if (initAttempted) {
        checkSupabaseConnection()
          .then(connected => {
            if (connected && !supabaseInitialized) {
              console.log('Network reconnected, initializing Supabase...');
              initializeSupabase().then(setSupabaseInitialized);
            }
          })
          .catch(console.error);
      }
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
      if (isLoading) {
        // Speed up initialization if we're offline
        setIsLoading(false);
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [initAttempted, supabaseInitialized, isLoading]);

  // App initialization
  useEffect(() => {
    const initApp = async () => {
      setInitAttempted(true);
      
      // Ensure we don't get stuck on loading screen
      const forceLoadTimeout = setTimeout(() => {
        if (isLoading) {
          console.warn("Force continuing app initialization after timeout");
          setIsLoading(false);
          toast.warning("Some features initialized slowly", {
            description: "The app will continue in local mode",
            duration: 5000
          });
        }
      }, MAX_LOADING_TIME);
      
      try {
        // Initialize session tracking first (doesn't require connection)
        initSessionTracking();
        initRecoverySystem();
        
        // If we're offline, skip Supabase initialization
        if (networkStatus === 'offline') {
          console.log('Device is offline, skipping Supabase initialization');
          toast.warning("You're currently offline", {
            description: "Running in local mode - your data will be stored on this device",
            duration: 5000
          });
          clearTimeout(forceLoadTimeout);
          setIsLoading(false);
          return;
        }
      
        // Check connection to Supabase
        console.log("Initializing Supabase connection...");
        const success = await initializeSupabase();
        setSupabaseInitialized(success);
        
        if (!success) {
          console.warn("Continuing without full Supabase initialization");
        }
        
        // Continue app initialization regardless of Supabase connection
        setTimeout(() => {
          clearTimeout(forceLoadTimeout); // Clear the force timeout
          setIsLoading(false);
        }, 800); // Short delay to allow UI to update
        
      } catch (error) {
        console.error("Failed during app initialization:", error);
        toast.error("Error during app initialization", {
          description: "Continuing in local mode",
          duration: 5000,
        });
        clearTimeout(forceLoadTimeout);
        setIsLoading(false);
      }
    };
    
    if (!initAttempted) {
      initApp();
    }
    
    // Auto-sync check on app focus or visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("App is visible again, checking for sync needs...");
        // This will trigger the TransactionProvider to check if syncing is needed
        window.dispatchEvent(new Event('app-visible'));
        
        // Also check Supabase connection if not already initialized
        if (initAttempted && !supabaseInitialized) {
          checkSupabaseConnection().then(connected => {
            if (connected) {
              console.log('Connection restored, initializing Supabase...');
              initializeSupabase().then(setSupabaseInitialized);
            }
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [initAttempted, supabaseInitialized, isLoading, networkStatus]);

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
                      <Route path="/admin/grow" element={<AdminGrowPage />} />
                      <Route path="/recover/:recoveryId" element={<RecoverPage />} />
                      <Route path="/*" element={
                        <>
                          <Navbar />
                          <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                            <div className="max-w-7xl mx-auto w-full">
                              {networkStatus === 'offline' && (
                                <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-md mb-4 text-sm flex items-center gap-2 shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="1" x2="23" y1="1" y2="23"></line>
                                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                                    <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                                    <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                                    <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                                    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                                    <line x1="12" x2="12.01" y1="20" y2="20"></line>
                                  </svg>
                                  You're currently offline. Your data is being saved locally and will sync when you're back online.
                                </div>
                              )}
                              <Routes>
                                <Route path="/" element={<OverviewPageEnhanced />} />
                                <Route path="/expenses" element={<ExpensesPage />} />
                                <Route path="/income" element={<IncomePage />} />
                                <Route path="/grow" element={<GrowPage />} />
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
