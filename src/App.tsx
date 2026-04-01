
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/context/transaction/provider";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { BackupProvider } from "@/context/BackupContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import CommunityLink from "@/components/CommunityLink";
import OverviewPageEnhanced from "@/pages/OverviewPageEnhanced";
import ExpensesPage from "@/pages/ExpensesPage";
import IncomePage from "@/pages/IncomePage";
import IdeasPage from "@/pages/IdeasPage";
import NotFound from "./pages/NotFound";
import AdminNotificationDashboard from "./pages/AdminNotificationDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminIdeasDashboard from "./pages/admin/AdminIdeasDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import VerificationSuccessPage from "./pages/auth/VerificationSuccessPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import ProfilePage from "./pages/ProfilePage";
import MobileNavbar from "./components/MobileNavbar";
import Index from "./pages/Index";
import OfflineIndicator from "./components/OfflineIndicator";
import ImportStatementPage from "./pages/ImportStatementPage";
import InstallPrompt from "./components/InstallPrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TransactionProvider>
            <BackupProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <div className="min-h-screen flex flex-col bg-gradient-to-b from-secondary to-background overflow-x-hidden">
                    <Routes>
                      {/* Auth routes */}
                      <Route path="/auth" element={<AuthPage />}>
                        <Route index element={<LoginPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="signup" element={<SignupPage />} />
                        <Route path="callback" element={<AuthCallbackPage />} />
                        <Route path="verify" element={<AuthCallbackPage />} />
                        <Route path="verify-email" element={<VerifyEmailPage />} />
                        <Route path="verification-success" element={<VerificationSuccessPage />} />
                        <Route path="forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="update-password" element={<UpdatePasswordPage />} />
                      </Route>

                      {/* Index route */}
                      <Route path="/" element={<Index />} />

                      {/* Admin routes */}
                      <Route path="/admin/notifications" element={<AdminNotificationDashboard />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/ideas" element={<AdminIdeasDashboard />} />

                      {/* Protected routes */}
                      <Route path="/expenses" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <ExpensesPage />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      <Route path="/overview" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <OverviewPageEnhanced />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      <Route path="/income" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <IncomePage />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      <Route path="/ideas" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <IdeasPage />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      <Route path="/import" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <ImportStatementPage />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      <Route path="/profile" element={
                        <ProtectedRoute>
                          <>
                            <Navbar />
                            <main className="flex-1 py-6 px-4 sm:px-6 w-full pb-16 md:pb-6">
                              <div className="max-w-7xl mx-auto w-full">
                                <ProfilePage />
                              </div>
                            </main>
                            <MobileNavbar />
                            <CommunityLink />
                          </>
                        </ProtectedRoute>
                      } />
                      
                      {/* 404 route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    
                    {/* PWA Components */}
                    <OfflineIndicator />
                  </div>
                </TooltipProvider>
              </NotificationProvider>
            </BackupProvider>
          </TransactionProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
