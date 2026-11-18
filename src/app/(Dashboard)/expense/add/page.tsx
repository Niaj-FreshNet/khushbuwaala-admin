'use client';

/**
 * Add Expense — fast, compact, responsive, and robust financial entry.
 */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { 
    Calendar as CalendarIcon, 
    CreditCard, 
    Loader2, 
    Receipt, 
    RotateCcw, 
    Tag, 
    User, 
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAddExpenseMutation } from '@/redux/store/api/expense/expenseApi';
import { useAuth } from '@/redux/store/hooks/useAuth';

// ───────────────────────── Config & Schema ─────────────────────────

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'bkash', label: 'bKash' },
    { value: 'nagad', label: 'Nagad' },
    { value: 'rocket', label: 'Rocket' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'card', label: 'Card Payment' },
];

const STATUS_OPTIONS = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCEL', label: 'Cancel' },
];

const formSchema = z.object({
    expenseTime: z.string().min(1, 'Expense time is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    amount: z.number().min(0, 'Amount must be non-negative'),
    method: z.string().min(1, 'Payment method is required'),
    isPaid: z.boolean(),
    status: z.string().min(1, 'Status is required'),
    reference: z.string().optional(),
    expenseBy: z.string().min(1, 'Expense By is required'),
});

type FormValues = z.infer<typeof formSchema>;

// ───────────────────────── Helpers ─────────────────────────

const money = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const nowLocalInput = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

function Field({
    label,
    error,
    className,
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <Label className="mb-1 block text-xs font-semibold text-gray-700">{label}</Label>
            {children}
            {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
        </div>
    );
}

// ───────────────────────── Page Component ─────────────────────────

const AddExpensePage = () => {
    const { user } = useAuth();
    const [addExpense, { isLoading: submitting }] = useAddExpenseMutation();

    // Form States
    const [expenseTime, setExpenseTime] = useState(nowLocalInput());
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('cash');
    const [isPaid, setIsPaid] = useState(true);
    const [status, setStatus] = useState('COMPLETED');
    const [reference, setReference] = useState('');
    const [attempted, setAttempted] = useState(false);

    const expenseBy = user?.name ?? '';

    // Reset Form
    const handleReset = () => {
        setExpenseTime(nowLocalInput());
        setTitle('');
        setDescription('');
        setAmount('');
        setMethod('cash');
        setIsPaid(true);
        setStatus('COMPLETED');
        setReference('');
        setAttempted(false);
    };

    // Validation
    const errors = {
        title: !title.trim() ? 'Title is required' : '',
        amount: !(parseFloat(amount) > 0) ? 'Enter a valid amount' : '',
        method: !method ? 'Payment method is required' : '',
        status: !status ? 'Status is required' : '',
        expenseTime: !expenseTime ? 'Expense time is required' : '',
    };

    const hasErrors = Object.values(errors).some((err) => Boolean(err));

    const handleSubmit = async () => {
        setAttempted(true);
        if (hasErrors) {
            toast.error('Please fill out all required fields correctly.');
            return;
        }

        try {
            const payload = {
                expenseTime: new Date(expenseTime).toISOString(),
                title: title.trim(),
                description: description.trim() || undefined,
                amount: parseFloat(amount) || 0,
                method,
                isPaid,
                status,
                reference: reference.trim() || undefined,
                expenseBy,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            // Validate with Zod before dispatching
            const validated = formSchema.parse({
                ...payload,
                expenseTime, // keeping raw string for schema validation check if needed, or ISO
            });

            await addExpense({
                ...payload,
                expenseTime: new Date(validated.expenseTime).toISOString(),
            }).unwrap();

            toast.success('Expense recorded successfully!');
            handleReset();
        } catch (error: any) {
            console.error('Failed to add expense:', error);
            toast.error(error?.data?.message || error?.message || 'Failed to add expense');
        }
    };

    const submitRef = useRef(handleSubmit);
    submitRef.current = handleSubmit;

    // Keyboard Shortcut: Ctrl + Enter to save
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                submitRef.current();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const numericAmount = parseFloat(amount) || 0;
    const saveLabel = `Save Expense · ৳${money(numericAmount)}`;

    return (
        <div className="min-h-screen bg-gray-50/50 pb-24 lg:pb-6">
            <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 sm:py-4">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">New Expense</h1>
                        <p className="text-xs text-gray-500">
                            Recorded by {expenseBy || '—'}
                            <span className="hidden sm:inline"> · Press Ctrl + Enter to save quickly</span>
                        </p>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleReset} 
                        className="text-gray-600 hover:text-orange-600"
                    >
                        <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
                    </Button>
                </div>

                {/* Main Grid Layout */}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
                    {/* Left Column: Expense Info & Details */}
                    <section className="space-y-4">
                        {/* Core Details Card */}
                        <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-2xs">
                            <h2 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-orange-500" />
                                Core Information
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <Field 
                                    label="Expense Title *" 
                                    error={attempted ? errors.title : undefined}
                                    className="sm:col-span-2"
                                >
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Office Rent, Utility Bill, Packaging Supplies"
                                        className={cn('h-9 focus-visible:ring-orange-500', attempted && errors.title && 'border-red-500')}
                                    />
                                </Field>

                                <Field 
                                    label="Amount (৳) *" 
                                    error={attempted ? errors.amount : undefined}
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">৳</span>
                                        <Input
                                            type="number"
                                            inputMode="decimal"
                                            min={0}
                                            value={amount}
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className={cn('h-9 pl-7 font-bold text-gray-900 focus-visible:ring-orange-500', attempted && errors.amount && 'border-red-500')}
                                        />
                                    </div>
                                </Field>

                                <Field 
                                    label="Expense Date & Time *" 
                                    error={attempted ? errors.expenseTime : undefined}
                                >
                                    <Input
                                        type="datetime-local"
                                        value={expenseTime}
                                        onChange={(e) => setExpenseTime(e.target.value)}
                                        className={cn('h-9 focus-visible:ring-orange-500', attempted && errors.expenseTime && 'border-red-500')}
                                    />
                                </Field>

                                <Field label="Description (Optional)" className="sm:col-span-2">
                                    <Textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="Add descriptive notes regarding this expense..."
                                        className="min-h-0 resize-none py-2 text-sm focus-visible:ring-orange-500"
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* Reference & Personnel Card */}
                        <div className="rounded-xl border bg-white p-4 sm:p-5 shadow-2xs">
                            <h2 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-500" />
                                Reference
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <Field label="Voucher (Optional)">
                                    <Input
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="e.g. INV-9823 or Receipt Ref"
                                        className="h-9 focus-visible:ring-orange-500"
                                    />
                                </Field>

                                <Field label="Expense By">
                                    <Input
                                        disabled
                                        value={expenseBy}
                                        className="h-9 bg-gray-50 text-gray-600 cursor-not-allowed font-medium"
                                    />
                                </Field>
                            </div>
                        </div>
                    </section>

                    {/* Right Column: Payment & Sticky Summary Sidebar */}
                    <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto">
                        <section className="rounded-xl border bg-white p-4 shadow-2xs">
                            <h2 className="mb-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-orange-500" />
                                Payment & Status
                            </h2>

                            <div className="space-y-3.5">
                                {/* Paid / Due toggle */}
                                <div>
                                    <Label className="mb-1 block text-xs font-semibold text-gray-700">Payment Status</Label>
                                    <div
                                        role="radiogroup"
                                        aria-label="Payment status"
                                        className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1"
                                    >
                                        {[
                                            { v: true, label: 'Paid', on: 'bg-emerald-600 text-white shadow-xs' },
                                            { v: false, label: 'Due', on: 'bg-red-600 text-white shadow-xs' },
                                        ].map((o) => (
                                            <button
                                                key={o.label}
                                                type="button"
                                                role="radio"
                                                aria-checked={isPaid === o.v}
                                                onClick={() => setIsPaid(o.v)}
                                                className={cn(
                                                    'h-8 rounded-md text-xs font-bold transition',
                                                    isPaid === o.v ? o.on : 'text-gray-600 hover:bg-white'
                                                )}
                                            >
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Field 
                                    label="Payment Method *" 
                                    error={attempted ? errors.method : undefined}
                                >
                                    <Select value={method} onValueChange={setMethod}>
                                        <SelectTrigger className="h-9 w-full focus:ring-orange-500">
                                            <SelectValue placeholder="Select method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PAYMENT_METHODS.map((m) => (
                                                <SelectItem key={m.value} value={m.value}>
                                                    {m.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field 
                                    label="Approval Status *" 
                                    error={attempted ? errors.status : undefined}
                                >
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-9 w-full focus:ring-orange-500">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUS_OPTIONS.map((s) => (
                                                <SelectItem key={s.value} value={s.value}>
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>

                            {/* Summary Calculation Box */}
                            <dl className="mt-4 space-y-2 border-t pt-3 text-sm">
                                <div className="flex justify-between text-gray-600 text-xs">
                                    <dt>Payment Mode</dt>
                                    <dd className="font-semibold uppercase">{method}</dd>
                                </div>
                                <div className="flex justify-between text-gray-600 text-xs">
                                    <dt>Clearance</dt>
                                    <dd className={cn("font-bold", isPaid ? "text-emerald-600" : "text-red-600")}>
                                        {isPaid ? 'Fully Paid' : 'Due Balance'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2.5 text-base font-bold text-gray-900">
                                    <dt>Total Expense</dt>
                                    <dd className="tabular-nums text-orange-600 text-lg">৳{money(numericAmount)}</dd>
                                </div>
                            </dl>

                            {/* Desktop Submit Button */}
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="mt-4 hidden h-11 w-full bg-orange-500 text-base font-bold text-white hover:bg-orange-600 lg:flex shadow-xs"
                            >
                                {submitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Receipt className="mr-2 h-4 w-4" />
                                )}
                                {submitting ? 'Recording...' : saveLabel}
                            </Button>
                        </section>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Sticky Bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden shadow-lg">
                <div className="mx-auto flex max-w-7xl items-center gap-3">
                    <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500">
                            {isPaid ? 'Paid Expense' : 'Due Expense'}
                        </div>
                        <div className="text-lg font-bold leading-tight tabular-nums text-orange-600">
                            ৳{money(numericAmount)}
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="h-11 flex-1 bg-orange-500 text-base font-bold text-white hover:bg-orange-600 shadow-xs"
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Receipt className="mr-2 h-4 w-4" />
                        )}
                        {submitting ? 'Saving...' : 'Save Expense'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AddExpensePage;