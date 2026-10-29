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
  Receipt,
  Download,
} from 'lucide-react';
import {
  useGetAllSalesQuery,
  useUpdateSalesMutation,
  useGetSaleByIdQuery,
} from '@/redux/store/api/sales/salesApi';
import { Skeleton } from '@/components/ui/skeleton';
import SaleDetailsModal from './SaleDetailsModal';
import SalesInvoice from './SalesInvoice';

interface Sale {
  id: string;
  invoice: string;
  orderTime: string;
  orderSource: string;
  saleType: string;
  method: string;
  salesman?: { name: string; email: string } | null;
  amount: number;
  status: string;
  isPaid: boolean;
  name: string;
}

type SortField = 'orderTime' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

const SaleListClient = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState<string | null>(null);
  const [isInvoiceVisible, setIsInvoiceVisible] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('orderTime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data, isLoading } = useGetAllSalesQuery({ searchTerm, page, limit });
  const [updateSale] = useUpdateSalesMutation();

  // Fetch sale data for invoice
  const { data: invoiceData } = useGetSaleByIdQuery(invoiceSaleId || '', {
    skip: !invoiceSaleId,
  });

  const allSales: Sale[] = useMemo(() => data?.data?.data || [], [data]);
  const meta = data?.data?.meta;

  // Sorting Logic
  const sortedSales = useMemo(() => {
    const sorted = [...allSales];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'orderTime') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [allSales, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 text-[#FB923C]" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-[#FB923C]" />
    );
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updateSale({ id, status }).unwrap();
      if (res?.success) {
        toast.success(`Sale marked as ${status}`);
      } else {
        toast.error('Failed to update sale');
      }
    } catch (error) {
      toast.error('Error updating sale');
      console.error(error);
    }
  };

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleId(saleId);
    setIsModalVisible(true);
  };

  const handleViewInvoice = (saleId: string) => {
    setInvoiceSaleId(saleId);
    setIsInvoiceVisible(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <Input
            placeholder="Search by Customer or Salesman..."
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
              <TableHead>Sr.</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Type</TableHead>
              <TableHead
                onClick={() => toggleSort('orderTime')}
                className="cursor-pointer select-none"
              >
                Sale Time {renderSortIcon('orderTime')}
              </TableHead>
              <TableHead>Sold By</TableHead>
              <TableHead
                onClick={() => toggleSort('amount')}
                className="cursor-pointer select-none"
              >
                Amount {renderSortIcon('amount')}
              </TableHead>
              <TableHead>Method</TableHead>
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
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10}>
                    <Skeleton className="w-full h-6 my-2" />
                  </TableCell>
                </TableRow>
              ))
            ) : sortedSales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-6 text-gray-500"
                >
                  No sales found.
                </TableCell>
              </TableRow>
            ) : (
              sortedSales.map((sale, index) => (
                <TableRow key={sale.id}>
                  <TableCell>{index + 1}.</TableCell>
                  <TableCell>#{sale.invoice}</TableCell>
                  <TableCell>{sale.saleType}</TableCell>
                  <TableCell>
                    {sale.orderTime
                      ? new Date(sale.orderTime).toLocaleString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{sale.salesman?.name || 'N/A'}</TableCell>
                  <TableCell>{sale.amount} BDT</TableCell>
                  <TableCell>
                    {sale.method === 'cashOnDelivery'
                      ? 'Cash On Delivery'
                      : sale.method === 'cash'
                        ? 'Cash'
                        : sale.method === 'onlinePayment'
                          ? 'Online Payment'
                          : sale.method === 'bkashPayment'
                            ? 'Bkash Payment'
                            : sale.method === 'bkashPersonal'
                              ? 'Bkash Personal'
                              : sale.method === 'nagadPayment'
                                ? 'Nagad Payment'
                                : sale.method === 'nagadPersonal'
                                  ? 'Nagad Personal'
                                  : sale.method === 'rocketPayment'
                                    ? 'Rocket Payment'
                                    : sale.method === 'rocketPersonal'
                                      ? 'Rocket Personal'
                                      : sale.method === 'bankTransfer'
                                        ? 'Bank Transfer'
                                        : sale.method === 'cardPayment'
                                          ? 'Card Payment'
                                          : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sale.status === 'COMPLETED'
                          ? 'success'
                          : sale.status === 'CANCEL'
                            ? 'destructive'
                            : sale.status === 'DELIVERED'
                              ? 'outline'
                              : sale.status === 'PROCESSING'
                                ? 'secondary'
                                : 'default'
                      }
                      className={
                        sale.status === 'COMPLETED'
                          ? 'bg-[#4CD964] text-white'
                          : sale.status === 'CANCEL'
                            ? 'bg-red-500 text-white'
                            : sale.status === 'DELIVERED'
                              ? 'bg-blue-500 text-white'
                              : sale.status === 'PROCESSING'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-orange-500 text-white'
                      }
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={sale.isPaid ? 'success' : 'destructive'}
                      className={
                        sale.isPaid ? 'bg-[#4CD964]' : 'bg-red-500'
                      }
                    >
                      {sale.isPaid ? 'PAID' : 'DUE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            className='cursor-pointer bg-gray-100 hover:bg-gray-200'
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(sale.id, 'PROCESSING')
                            }
                          >
                            Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(sale.id, 'COMPLETED')
                            }
                          >
                            Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(sale.id, 'DELIVERED')
                            }
                          >
                            Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(sale.id, 'PENDING')
                            }
                          >
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(sale.id, 'CANCEL')
                            }
                          >
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        className='cursor-pointer bg-gray-100 hover:bg-gray-200'
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(sale.id)}
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        className='cursor-pointer bg-[#fda055] hover:bg-[#ff9742] text-white'
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewInvoice(sale.id)}
                        title="View Invoice"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
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
              Showing {sortedSales.length} of {meta.total} sales
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

        {/* Sale Details Modal */}
        <SaleDetailsModal
          saleId={selectedSaleId || ''}
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
        />

        {/* Invoice Modal */}
        {invoiceData?.data && (
          <SalesInvoice
            sale={invoiceData.data}
            visible={isInvoiceVisible}
            onClose={() => {
              setIsInvoiceVisible(false);
              setInvoiceSaleId(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SaleListClient;