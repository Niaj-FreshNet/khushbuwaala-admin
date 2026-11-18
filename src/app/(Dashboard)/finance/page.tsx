'use client';

import { useAuth } from '@/redux/store/hooks/useAuth';
import { ShieldAlert, Loader2 } from 'lucide-react';
import FinanceHub from './_components/FinanceHub';

export default function LedgerPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm font-medium text-stone-500">Verifying secure access...</p>
      </div>
    );
  }

  // Only SUPER_ADMIN (or explicitly allowed financial controllers) can see the full raw company ledger
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'INVESTOR') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-stone-900">Access Restricted</h1>
        <p className="mt-2 max-w-sm text-sm text-stone-500">
          Only Super Administrators possess the security clearance required to view master store ledgers and raw financial records.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-stone-50/30">
      <FinanceHub />
    </main>
  );
}