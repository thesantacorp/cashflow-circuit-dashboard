
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from '@/components/Navbar';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';
import { Card, CardContent } from '@/components/ui/card';
import CategoryList from '@/components/CategoryList';
import Dashboard from '@/components/Dashboard';
import { BackupManager } from '@/components/BackupManager';
import { useTransactions } from '@/context/transaction';
import DataExportImport from '@/components/DataExportImport';
import LocalStorageInfo from '@/components/LocalStorageInfo';
import { UuidStatus } from '@/components/CloudSync';
import DataRecovery from '@/components/DataRecovery';
import MobileNav from '@/components/MobileNav';

export default function Index() {
  // Using state directly from the transaction context instead of getAllTransactions
  const { state } = useTransactions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <MobileNav />

      <main className="container py-4 px-4 md:px-8">
        <Tabs defaultValue="transactions" className="space-y-4">
          <div className="sticky top-0 z-10 bg-gray-50 pb-2 pt-1">
            <TabsList className="w-full justify-start overflow-x-auto md:justify-center md:overflow-visible">
              <TabsTrigger value="transactions" className="text-sm">Transactions</TabsTrigger>
              <TabsTrigger value="expenses" className="text-sm">Add New</TabsTrigger>
              <TabsTrigger value="categories" className="text-sm">Categories</TabsTrigger>
              <TabsTrigger value="dashboard" className="text-sm">Dashboard</TabsTrigger>
              <TabsTrigger value="backup" className="text-sm relative">
                Backup/Recover
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="transactions" className="space-y-4">
            <TransactionList transactions={state.transactions} title="Recent Transactions" limit={20} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <TransactionForm />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryList />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <Dashboard type="expense" />
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <BackupManager />
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <DataExportImport />
                  </CardContent>
                </Card>

                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <LocalStorageInfo />
                  </CardContent>
                </Card>
                
                <DataRecovery />
              </div>

              <div>
                <UuidStatus />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
