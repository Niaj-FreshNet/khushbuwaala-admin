'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import FormInput from '@/components/ReusableUI/FormInput';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import { useAddExpenseMutation } from '@/redux/store/api/expense/expenseApi';
import { useAuth } from '@/redux/store/hooks/useAuth';

// Define form schema using Zod
const formSchema = z.object({
    expenseTime: z.string().min(1, 'Expense Time is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    amount: z.number().min(0, 'Amount must be non-negative'),
    method: z.string().min(1, 'Payment Method is required'),
    isPaid: z.boolean(),
    status: z.string().min(1, 'Status is required'),
    reference: z.string().optional(),
    expenseBy: z.string().min(1, 'Expense By is required'),
});

interface FormValues {
    expenseTime: string;
    title: string;
    description?: string;
    amount: number;
    method: string;
    isPaid: boolean;
    status: string;
    reference?: string;
    expenseBy: string;
}

const AddExpensePage = () => {
    const { user } = useAuth();
    const [addExpense, { isLoading }] = useAddExpenseMutation();
    const [isPaid, setIsPaid] = useState(true);

    const handleSubmit = async (values: FormValues) => {
        try {
            const payload = {
                ...values,
                expenseTime: new Date(values.expenseTime).toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await addExpense(payload).unwrap();
            toast.success('Expense added successfully!');
        } catch (error) {
            console.error('Failed to add expense:', error);
            toast.error('Failed to add expense');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-semibold text-[#FB923C] mb-6">Add Expense</h1>
                <FormWrapper
                    defaultValues={{
                        expenseTime: new Date().toISOString(),
                        title: '',
                        description: '',
                        amount: 0,
                        method: '',
                        isPaid: true,
                        status: '',
                        reference: '',
                        expenseBy: '',
                    }}
                    onSubmit={handleSubmit}
                    submitButtonText="Add Expense"
                    submitButtonClassName="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
                    resetButtonText="Cancel"
                    resetButtonClassName="border-[#FB923C] text-[#FB923C]"
                    resetOnSuccess={true}
                    schema={formSchema}
                >
                    <Card className="border-[#FB923C]">
                        <CardHeader>
                            <CardTitle>Expense Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormInput
                                name="expenseTime"
                                label="Expense Time"
                                type="datetime-local"
                                required
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="title"
                                label="Title"
                                placeholder="Enter expense title"
                                required
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="description"
                                label="Description"
                                type="textarea"
                                placeholder="Enter description (optional)"
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="amount"
                                label="Amount"
                                type="number"
                                placeholder="Enter amount"
                                required
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="method"
                                label="Payment Method"
                                type="select"
                                placeholder="Select Method"
                                options={[
                                    { value: 'cash', label: 'Cash' },
                                    { value: 'bkash', label: 'bKash' },
                                    { value: 'nagad', label: 'Nagad' },
                                    { value: 'rocket', label: 'Rocket' },
                                    { value: 'bank', label: 'Bank' },
                                    { value: 'card', label: 'Card' },
                                ]}
                                required
                                inputClassName="border-[#FB923C]"
                            />
                            <div>
                                <Label className="text-sm font-medium text-gray-700">Is Paid?</Label>
                                <Switch
                                    checked={isPaid}
                                    onCheckedChange={setIsPaid}
                                    className={`${isPaid ? 'bg-[#4CD964]' : 'bg-red-500'}`}
                                />
                                <span className="ml-2 text-sm text-gray-600">{isPaid ? 'Paid' : 'Due'}</span>
                            </div>
                            <FormInput
                                name="status"
                                label="Status"
                                type="select"
                                placeholder="Select Status"
                                options={[
                                    { value: 'PENDING', label: 'Pending' },
                                    { value: 'COMPLETED', label: 'Completed' },
                                    { value: 'CANCEL', label: 'Cancel' },
                                ]}
                                required
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="reference"
                                label="Reference"
                                placeholder="Enter reference (optional)"
                                inputClassName="border-[#FB923C]"
                            />
                            <FormInput
                                name="expenseBy"
                                label="Expense By"
                                type="text"
                                disabled
                                value={user?.name}
                                required
                                inputClassName="border-[#FB923C] cursor-not-allowed"
                            />

                        </CardContent>
                    </Card>
                </FormWrapper>
            </div>
        </div>
    );
};

export default AddExpensePage;