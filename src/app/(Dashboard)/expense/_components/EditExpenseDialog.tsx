'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useEditExpenseMutation,
  useGetExpenseCategoriesQuery,
  useGetExpenseDetailsQuery,
} from '@/redux/store/api/expense/expenseApi';

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bkash', label: 'bKash' },
  { value: 'nagad', label: 'Nagad' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'card', label: 'Card Payment' },
];
const STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELED', label: 'Canceled' },
];
const NONE = '__none__';

// datetime-local wants local time "YYYY-MM-DDTHH:mm"
const toLocalInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function EditExpenseDialog({
  expenseId,
  open,
  onOpenChange,
}: {
  expenseId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isFetching } = useGetExpenseDetailsQuery(expenseId, { skip: !expenseId || !open });
  const { data: categoriesRes } = useGetExpenseCategoriesQuery();
  const [editExpense, { isLoading: saving }] = useEditExpenseMutation();
  const categories = categoriesRes?.data ?? [];

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseTime, setExpenseTime] = useState('');
  const [method, setMethod] = useState('cash');
  const [category, setCategory] = useState(NONE);
  const [status, setStatus] = useState('COMPLETED');
  const [isPaid, setIsPaid] = useState(true);
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  // Load the expense into the form whenever a different one is opened
  useEffect(() => {
    const e = (data as any)?.data;
    if (!e || !open) return;
    setTitle(e.title ?? '');
    setAmount(String(e.amount ?? ''));
    setExpenseTime(toLocalInput(e.expenseTime));
    setMethod(e.method || 'cash');
    setCategory(e.category || NONE);
    setStatus(e.status === 'CANCEL' ? 'CANCELED' : e.status || 'COMPLETED');
    setIsPaid(!!e.isPaid);
    setReference(e.reference ?? '');
    setDescription(e.description ?? '');
  }, [data, open]);

  const amountNum = parseFloat(amount);
  const invalid = !title.trim() ? 'Title is required' : !(amountNum > 0) ? 'Enter an amount above 0' : !expenseTime ? 'Pick a date' : '';

  const save = async () => {
    if (!expenseId) return;
    if (invalid) {
      toast.error(invalid);
      return;
    }
    try {
      await editExpense({
        id: expenseId,
        data: {
          title: title.trim(),
          amount: amountNum,
          expenseTime: new Date(expenseTime).toISOString(),
          method,
          category: category === NONE ? null : category,
          status,
          isPaid,
          reference: reference.trim(),
          description: description.trim(),
        },
      }).unwrap();
      toast.success('Expense updated');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Could not update the expense');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto rounded-xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit expense</DialogTitle>
          <DialogDescription>Fix any detail. Changes update reports right away.</DialogDescription>
        </DialogHeader>

        {isFetching && !title ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs font-semibold">Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 sm:h-9" />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Amount (৳) *</Label>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                value={amount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 font-bold sm:h-9"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Date & time *</Label>
              <Input type="datetime-local" value={expenseTime} onChange={(e) => setExpenseTime(e.target.value)} className="h-11 sm:h-9" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs font-semibold">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11 w-full sm:h-9"><SelectValue placeholder="Uncategorized" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-11 w-full sm:h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs font-semibold">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 w-full sm:h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" role="radiogroup" aria-label="Paid status">
              {[{ v: true, l: 'Paid' }, { v: false, l: 'Due' }].map((o) => (
                <button
                  key={o.l}
                  type="button"
                  role="radio"
                  aria-checked={isPaid === o.v}
                  onClick={() => setIsPaid(o.v)}
                  className={`h-10 rounded-md text-sm font-bold transition ${isPaid === o.v ? (o.v ? 'bg-green-700 text-white' : 'bg-red-600 text-white') : 'text-gray-600'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs font-semibold">Voucher / reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} className="h-11 sm:h-9" />
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs font-semibold">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
            </div>
          </div>
        )}

        <DialogFooter className="sticky bottom-0 -mx-4 mt-2 gap-2 border-t bg-white px-4 pt-3 sm:-mx-6 sm:px-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 sm:h-9">Cancel</Button>
          <Button onClick={save} disabled={saving || isFetching} className="h-11 bg-orange-600 text-white hover:bg-orange-700 sm:h-9">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
