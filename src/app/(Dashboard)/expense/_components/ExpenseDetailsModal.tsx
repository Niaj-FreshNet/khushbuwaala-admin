'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetExpenseDetailsQuery } from '@/redux/store/api/expense/expenseApi';

interface ExpenseDetailsModalProps {
  expenseId: string;
  visible: boolean;
  onClose: () => void;
}

interface Expense {
  id: string;
  expenseTime: string;
  title: string;
  description?: string;
  amount: number;
  method: string;
  isPaid: boolean;
  status: string;
  reference?: string;
  expenseBy: { name: string };
}

const ExpenseDetailsModal = ({ expenseId, visible, onClose }: ExpenseDetailsModalProps) => {
  const { data, isLoading } = useGetExpenseDetailsQuery(expenseId);
  const expense: Expense = data?.Data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[#4CD964]';
      case 'PENDING':
        return 'bg-orange-500';
      case 'CANCEL':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-[#FB923C]">Expense Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="text-center py-8">Loading expense details...</div>
        ) : (
          <div className="space-y-6">
            <Card className="border-[#FB923C]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Expense Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expense ID</p>
                    <p>{expense?.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expense Time</p>
                    <p>{expense?.expenseTime ? new Date(expense.expenseTime).toLocaleString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Title</p>
                    <p>{expense?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <Badge className={getStatusColor(expense?.status)}>{expense?.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Expense By</p>
                    <p>{expense?.expenseBy?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reference</p>
                    <p>{expense?.reference || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#FB923C]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Description</h3>
                <p>{expense?.description || 'No description provided'}</p>
              </CardContent>
            </Card>
            <Card className="border-[#FB923C]">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Method</p>
                    <p>{expense?.method}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Status</p>
                    <Badge className={expense?.isPaid ? 'bg-[#4CD964]' : 'bg-red-500'}>
                      {expense?.isPaid ? 'PAID' : 'DUE'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Amount</p>
                    <p className="font-semibold">{expense?.amount} BDT</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailsModal;