// src/app/admin/ledger/page.tsx
'use client';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { ShieldAlert, Loader2 } from 'lucide-react';
import FinancePage from './_components/FInanceHub';

export default function LedgerPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-2 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-2" />
        <p className="text-xs text-gray-500">Verifying authorization...</p>
      </div>
    );
  }

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-2 text-center">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-base font-bold text-gray-900">Access Denied</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          Only Super Administrators are authorized to view store ledgers, profit margins, and financial records.
        </p>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gray-50/50">
      <FinancePage />
    </main>
  );
}