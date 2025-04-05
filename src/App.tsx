
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import NotFound from "./pages/NotFound";
import AdminNotificationDashboard from "./pages/AdminNotificationDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/auth/AuthPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/auth/UpdatePasswordPage";
import ProfilePage from "./pages/ProfilePage";

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
      <BrowserRouter>
        <AuthProvider>
          <TransactionProvider>
            <CurrencyProvider>
              <BackupProvider>
                <NotificationProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white overflow-x-hidden">
                      <Routes>
                        {/* Auth routes */}
                        <Route path="/auth" element={<AuthPage />}>
                          <Route index element={<LoginPage />} />
                          <Route path="login" element={<LoginPage />} />
                          <Route path="signup" element={<SignupPage />} />
                          <Route path="verify-email" element={<VerifyEmailPage />} />
                          <Route path="forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="update-password" element={<UpdatePasswordPage />} />
                        </Route>

                        {/* Admin routes */}
                        <Route path="/admin/notifications" element={<AdminNotificationDashboard />} />
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />

                        {/* Protected routes */}
                        <Route path="/" element={
                          <ProtectedRoute>
                            <>
                              <Navbar />
                              <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                                <div className="max-w-7xl mx-auto w-full">
                                  <OverviewPageEnhanced />
                                </div>
                              </main>
                              <CommunityLink />
                            </>
                          </ProtectedRoute>
                        } />
                        <Route path="/expenses" element={
                          <ProtectedRoute>
                            <>
                              <Navbar />
                              <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                                <div className="max-w-7xl mx-auto w-full">
                                  <ExpensesPage />
                                </div>
                              </main>
                              <CommunityLink />
                            </>
                          </ProtectedRoute>
                        } />
                        <Route path="/income" element={
                          <ProtectedRoute>
                            <>
                              <Navbar />
                              <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                                <div className="max-w-7xl mx-auto w-full">
                                  <IncomePage />
                                </div>
                              </main>
                              <CommunityLink />
                            </>
                          </ProtectedRoute>
                        } />
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <>
                              <Navbar />
                              <main className="flex-1 py-6 px-4 sm:px-6 w-full">
                                <div className="max-w-7xl mx-auto w-full">
                                  <ProfilePage />
                                </div>
                              </main>
                              <CommunityLink />
                            </>
                          </ProtectedRoute>
                        } />
                        
                        {/* 404 route */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </TooltipProvider>
                </NotificationProvider>
              </BackupProvider>
            </CurrencyProvider>
          </TransactionProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
