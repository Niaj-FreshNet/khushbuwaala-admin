'use client';

import { useMemo } from 'react';
import {
  Receipt,
  Loader2,
  CalendarDays,
  ShieldCheck,
  CreditCard,
  UserCheck,
  FileText,
  AlignLeft,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetExpenseDetailsQuery } from '@/redux/store/api/expense/expenseApi';

interface ExpenseDetailsModalProps {
  expenseId: string;
  visible: boolean;
  onClose: () => void;
}

interface Expense {
  id: string;
  expenseTime?: string;
  createdAt?: string;
  title: string;
  description?: string;
  amount: number;
  method: string;
  isPaid: boolean;
  status: string;
  reference?: string;
  expenseBy: { name: string } | string;
}

const formatBDT = (amount: number) =>
  new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(amount || 0))));

const getStatusStyle = (status: string) => {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCEL: 'bg-rose-50 text-rose-700 border-rose-200',
    CANCELED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return styles[status?.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const methodLabel = (method?: string) => {
  if (!method) return 'N/A';

  const methods: Record<string, string> = {
    cash: 'Cash',
    bkash: 'bKash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    bank: 'Bank Transfer',
    card: 'Card Payment',
  };

  return methods[method] || method;
};

const SectionTitle = ({
  icon: Icon,
  children,
  right,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  right?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-800">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h3>
    {right}
  </div>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-semibold text-gray-800 sm:text-right">
      {value || 'N/A'}
    </span>
  </div>
);

const ExpenseDetailsModal = ({ expenseId, visible, onClose }: ExpenseDetailsModalProps) => {
  const { data, isLoading } = useGetExpenseDetailsQuery(expenseId, {
    skip: !expenseId || !visible,
  });

  // Safely extract the expense object regardless of whether the API returns { data: ... }, { Data: ... }, or the object directly
  const expense: Expense | undefined = useMemo(() => {
    if (!data) return undefined;
    if (data.data && typeof data.data === 'object') return data.data;
    if (data.Data && typeof data.Data === 'object') return data.Data;
    return data as Expense;
  }, [data]);

  const expenseDate = useMemo(() => {
    if (!expense) return 'N/A';
    const date = expense.expenseTime || expense.createdAt;
    return date
      ? new Date(date).toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'N/A';
  }, [expense]);

  const expenseByName = useMemo(() => {
    if (!expense) return 'N/A';
    if (typeof expense.expenseBy === 'object' && expense.expenseBy !== null) {
      return expense.expenseBy.name;
    }
    return String(expense.expenseBy || 'N/A');
  }, [expense]);

  const expenseIdDisplay = expense?.id ? `#${expense.id.slice(0, 8)}...` : 'EXP-DETAILS';
  const totalAmount = expense?.amount ?? 0;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl">
        
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                    Expense Details
                  </span>
                </div>
                <DialogTitle className="text-lg font-black tracking-tight text-gray-900 mt-0.5">
                  {expense?.title || expenseIdDisplay}
                </DialogTitle>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {expense && (
                <Badge
                  variant="outline"
                  className={`${getStatusStyle(expense.status)} px-2.5 py-1 text-xs font-bold uppercase tracking-wide`}
                >
                  {expense.status}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Loading expense details...
            </p>
          </div>
        ) : !expense ? (
          <div className="flex flex-1 flex-col items-center justify-center py-24 bg-white">
            <Receipt className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">
              No expense details found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              This record may have been removed or is unavailable.
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5 bg-gray-50/50">

            {/* Overview Cards */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    Expense Time
                  </span>
                  <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {expenseDate}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500">
                    Payment
                  </span>
                  <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Badge
                    className={`text-[9px] font-bold px-1.5 py-0 ${
                      expense.isPaid
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    {expense.isPaid ? 'PAID' : 'DUE'}
                  </Badge>
                  <span className="truncate text-[11px] font-medium text-gray-700">
                    {methodLabel(expense.method)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-3.5 shadow-sm col-span-2 xl:col-span-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-800">
                    Total Amount
                  </span>
                  <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <p className="text-base font-black tracking-tight text-orange-900 truncate">
                  ৳{formatBDT(totalAmount)}
                </p>
              </div>
            </div>

            {/* Information & Authorization Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <SectionTitle icon={FileText}>
                Expense Information
              </SectionTitle>
              <div className="space-y-2.5 pt-1">
                <InfoRow label="Expense ID" value={expense.id} />
                <InfoRow label="Title" value={expense.title} />
                <InfoRow label="Reference / Voucher" value={expense.reference} />
                <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4 pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Recorded By</span>
                  <span className="text-xs font-semibold text-gray-800 sm:text-right flex items-center gap-1 justify-end">
                    <UserCheck className="h-3.5 w-3.5 text-orange-500" />
                    {expenseByName}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
              <SectionTitle icon={AlignLeft}>
                Description & Notes
              </SectionTitle>
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                {expense.description || 'No description provided for this expense.'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-gray-200 bg-white pt-3 pb-1 sm:flex-row sm:items-center sm:justify-between px-1">
              <p className="text-[11px] text-gray-400 font-mono">
                ID: {expense.id}
              </p>

              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-8 border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Close Details
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsModal;