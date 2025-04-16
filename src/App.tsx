
import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import { TransactionProvider } from "./context/transaction";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import { Toaster } from "sonner";

// Lazy load pages
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const IncomePage = lazy(() => import("./pages/IncomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Index = lazy(() => import("./pages/Index"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/SignupPage")); // Changed to SignupPage
const DashboardPage = lazy(() => import("./pages/OverviewPage")); // Changed to OverviewPage 
const SettingsPage = lazy(() => import("./pages/ProfilePage")); // Using ProfilePage temporarily
const CategoriesPage = lazy(() => import("./pages/ExpensesPage")); // Using ExpensesPage temporarily
const ErrorPage = lazy(() => import("./pages/NotFound")); // Changed to NotFound

function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <CurrencyProvider>
          <Toaster position="bottom-center" />
          
          <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
            <Navbar />
            
            <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading...</div>}>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/login" element={<LoginPage />} />
                  <Route path="/auth/register" element={<RegisterPage />} />
                  
                  <Route path="/expenses" element={
                    <ProtectedRoute>
                      <ExpensesPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/income" element={
                    <ProtectedRoute>
                      <IncomePage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/categories" element={
                    <ProtectedRoute>
                      <CategoriesPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="*" element={<ErrorPage />} />
                </Routes>
              </main>
            </Suspense>
            
            {/* PWA Install Prompt */}
            <PwaInstallPrompt />
          </div>
        </CurrencyProvider>
      </TransactionProvider>
    </AuthProvider>
  );
}

export default App;
