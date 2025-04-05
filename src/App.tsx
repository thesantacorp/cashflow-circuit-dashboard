
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ExpensesPage from './pages/ExpensesPage';
import IncomePage from './pages/IncomePage';
import OverviewPage from './pages/OverviewPage';
import OverviewPageEnhanced from './pages/OverviewPageEnhanced';
import NotFound from './pages/NotFound';
import { initializeSupabase } from '@/utils/supabaseInit';
import { useEffect } from 'react';
import AdminDashboard from './pages/AdminDashboard';
import AdminNotificationDashboard from './pages/AdminNotificationDashboard';
import RecoverPage from './pages/RecoverPage';
import Index from './pages/Index';
import './App.css';
import { TransactionProvider } from '@/context/transaction';

function App() {
  useEffect(() => {
    // Initialize Supabase on app load
    const initDb = async () => {
      await initializeSupabase();
    };
    
    initDb();
  }, []);
  
  return (
    <TransactionProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/income" element={<IncomePage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/overview-enhanced" element={<OverviewPageEnhanced />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/notifications" element={<AdminNotificationDashboard />} />
          <Route path="/recover" element={<RecoverPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TransactionProvider>
  );
}

export default App;
