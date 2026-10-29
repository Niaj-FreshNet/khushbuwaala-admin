'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Search,
  Printer,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  useGetAllExpensesQuery,
  useUpdateExpenseMutation,
} from '@/redux/store/api/expense/expenseApi';
import ExpenseDetailsModal from './_components/ExpenseDetailsModal';
import { Skeleton } from '@/components/ui/skeleton';

interface Expense {
  id: string;
  expenseTime: string;
  expenseBy: { name: string };
  method: string;
  amount: number;
  status: string;
  isPaid: boolean;
  title: string;
}

type SortField = 'expenseTime' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

const ExpenseListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // ✅ Sorting state
  const [sortField, setSortField] = useState<SortField>('expenseTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading } = useGetAllExpensesQuery({ searchTerm, page, limit });
  const [updateExpense] = useUpdateExpenseMutation();

  // ✅ Access nested data correctly
  const allExpenses: Expense[] = useMemo(() => data?.data?.data || [], [data]);
  const meta = data?.data?.meta;

  // ✅ Handle sorting logic
  const sortedExpenses = useMemo(() => {
    const sorted = [...allExpenses];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'expenseTime') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allExpenses, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updateExpense({ id, status }).unwrap();
      if (res?.success) {
        toast.success(`Expense marked as ${status}`);
      } else {
        toast.error('Failed to update expense');
      }
    } catch (error) {
      toast.error('Error updating expense');
      console.error(error);
    }
  };

  const handleViewDetails = (expenseId: string) => {
    setSelectedExpenseId(expenseId);
    setIsModalVisible(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 text-[#FB923C]" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-[#FB923C]" />
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search by Title or Expense By..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-80 border-[#FB923C] focus:ring-[#FB923C]"
            prefix={<Search className="w-4 h-4 text-gray-500" />}
          />
          <Button
            className="bg-[#FB923C] hover:bg-[#ff8a29] text-white"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" /> Print / Download
          </Button>
        </div>

        {/* Table Section */}
        <Table className="border-[#FB923C]">
          <TableHeader>
            <TableRow>
              <TableHead>Expense ID</TableHead>
              <TableHead
                onClick={() => toggleSort('expenseTime')}
                className="cursor-pointer select-none flex"
              >
                Expense Time {renderSortIcon('expenseTime')}
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Expense By</TableHead>
              <TableHead>Method</TableHead>
              <TableHead
                onClick={() => toggleSort('amount')}
                className="cursor-pointer select-none"
              >
                Amount {renderSortIcon('amount')}
              </TableHead>
              <TableHead
                onClick={() => toggleSort('status')}
                className="cursor-pointer select-none"
              >
                Status {renderSortIcon('status')}
              </TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="w-full h-6 my-2" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedExpenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                  No expenses found.
                </TableCell>
              </TableRow>
            ) : (
              sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    {expense.expenseTime
                      ? new Date(expense.expenseTime).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{expense.title}</TableCell>
                  <TableCell>{expense.expenseBy?.name || 'N/A'}</TableCell>
                  <TableCell>{expense.method}</TableCell>
                  <TableCell>{expense.amount} BDT</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        expense.status === 'COMPLETED'
                          ? 'success'
                          : expense.status === 'CANCEL'
                          ? 'destructive'
                          : 'default'
                      }
                      className={
                        expense.status === 'COMPLETED'
                          ? 'bg-[#4CD964]'
                          : expense.status === 'CANCEL'
                          ? 'bg-red-500'
                          : 'bg-orange-500'
                      }
                    >
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={expense.isPaid ? 'success' : 'destructive'}
                      className={
                        expense.isPaid ? 'bg-[#4CD964]' : 'bg-red-500'
                      }
                    >
                      {expense.isPaid ? 'PAID' : 'DUE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(expense.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(expense.id, 'COMPLETED')
                            }
                          >
                            Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(expense.id, 'PENDING')
                            }
                          >
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(expense.id, 'CANCEL')
                            }
                          >
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {meta && (
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-600">
              Showing {sortedExpenses.length} of {meta.total} expenses
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={page >= (meta.totalPage || 1)}
                onClick={() => setPage((prev) => prev + 1)}
                className="border-[#FB923C] text-[#FB923C]"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Expense Details Modal */}
        <ExpenseDetailsModal
          expenseId={selectedExpenseId || ''}
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />
      </div>
    </div>
  );
};

export default ExpenseListPage;
