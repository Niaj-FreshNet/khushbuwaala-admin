import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface InvoiceProps {
    sale: {
        id: string;
        invoice: string;
        orderTime: string;
        amount: number;
        isPaid: boolean;
        method: string;
        cartItems: Array<{
            productId: string;
            product?: { name: string; primaryImage?: string };
            size?: number;
            unit?: string;
            price: number;
            quantity: number;
        }>;
        status: string;
        salesman?: { name: string; email: string } | null;
        name?: string | null;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        saleType: string;
    };
    visible: boolean;
    onClose: () => void;
}

const SalesInvoice: React.FC<InvoiceProps> = ({ sale, visible, onClose }) => {
    const invoiceRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!invoiceRef.current) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(invoiceRef.current.innerHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const handleDownloadPDF = () => {
        if (!invoiceRef.current) return;
        html2pdf()
            .set({
                margin: 10,
                filename: `Invoice-${sale.invoice}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    allowTaint: true,
                    useCORS: true,
                    backgroundColor: '#ffffff', // force white background
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(invoiceRef.current)
            .save();
    };

    const calculateSubtotal = () =>
        sale.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const getStatusClass = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING':
                return 'bg-[#FEF3C7] text-[#92400E]';
            case 'PROCESSING':
                return 'bg-[#DBEAFE] text-[#1E40AF]';
            case 'COMPLETED':
                return 'bg-[#DCFCE7] text-[#166534]';
            case 'DELIVERED':
                return 'bg-[#D0E7FF] text-[#1E3A8A]';
            case 'CANCEL':
                return 'bg-[#FECACA] text-[#991B1B]';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatText = (text: string) =>
        text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    return (
        <Dialog open={visible} onOpenChange={onClose}>
            <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between text-[#FB923C]">
                        <span>Sales Invoice</span>
                        <div className="flex gap-2">
                            <Button
                                onClick={handlePrint}
                                className="bg-[#FB923C] hover:bg-[#ff8a29]"
                                size="sm"
                            >
                                <Printer className="w-4 h-4 mr-2" /> Print
                            </Button>
                            <Button
                                onClick={handleDownloadPDF}
                                className="bg-[#FB923C] hover:bg-[#ff8a29]"
                                size="sm"
                            >
                                <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div
                    ref={invoiceRef}
                    className="invoice-container w-full p-8 bg-white shadow-lg rounded-lg text-black"
                    style={{ color: '#000000', backgroundColor: '#FFFFFF' }}
                >
                    {/* Header */}
                    <div className="header text-center mb-8 border-b-4 border-[#FB923C] pb-4">
                        <div className="company-name text-3xl font-bold text-[#FB923C]">
                            KHUSHBUWAALA
                        </div>
                        <div className="company-details text-sm text-gray-700">
                            <p>G/138, Eastern Banabithi Shopping Complex, South Banasree, Khilgaon, Dhaka-1219</p>
                            <p>Phone: +880 1566-395807</p>
                            <p>Email: khushbuwaala@gmail.com</p>
                        </div>
                    </div>

                    {/* Invoice Info */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="invoice-title text-2xl font-bold text-gray-800">INVOICE</div>
                        <div className="text-right text-gray-700">
                            <p className="font-semibold">#{sale.invoice}</p>
                            <p className="text-sm">
                                Date:{' '}
                                {new Date(sale.orderTime).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <h3 className="text-[#FB923C] font-semibold mb-2">Bill To:</h3>
                            <p className="font-semibold">{sale.name || 'Walk-in Customer'}</p>
                            {sale.email && <p>{sale.email}</p>}
                            {sale.phone && <p>{sale.phone}</p>}
                            {sale.address && <p>{sale.address}</p>}
                        </div>

                        <div>
                            <h3 className="text-[#FB923C] font-semibold mb-2">Sale Details:</h3>
                            <p>
                                <strong>Sale Type:</strong> {formatText(sale.saleType)}
                            </p>
                            <p>
                                <strong>Payment Method:</strong> {formatText(sale.method)}
                            </p>
                            <p>
                                <strong>Payment Status:</strong>{' '}
                                <span
                                    className={`ml-2 px-2 py-1 rounded text-xs font-bold ${sale.isPaid
                                        ? 'bg-[#DCFCE7] text-[#166534]'
                                        : 'bg-[#FECACA] text-[#991B1B]'
                                        }`}
                                >
                                    {sale.isPaid ? 'Paid' : 'Due'}
                                </span>
                            </p>
                            <p>
                                <strong>Order Status:</strong>{' '}
                                <span
                                    className={`ml-2 px-2 py-1 rounded text-xs font-bold ${getStatusClass(
                                        sale.status
                                    )}`}
                                >
                                    {formatText(sale.status)}
                                </span>
                            </p>
                        </div>

                        <div>
                            <h3 className="text-[#FB923C] font-semibold mb-2">Sold By:</h3>
                            <p className="font-semibold">{sale.salesman?.name || 'N/A'}</p>
                            {sale.salesman?.email && <p>{sale.salesman.email}</p>}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-[#FB923C] text-white">
                                    <th className="py-3 px-2 text-left">Item</th>
                                    {/* <th className="py-3 px-2 text-center">Image</th> */}
                                    <th className="py-3 px-2 text-center">Size</th>
                                    <th className="py-3 px-2 text-right">Unit Price</th>
                                    <th className="py-3 px-2 text-center">Qty</th>
                                    <th className="py-3 px-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.cartItems.map((item, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="py-2 px-2">{item.product?.name || 'Product'}</td>
                                        {/* <td className="py-2 px-2 text-center">
                                            {item.product?.primaryImage ? (
                                                <img
                                                    src={item.product.primaryImage}
                                                    alt="product"
                                                    className="w-12 h-12 object-cover mx-auto rounded"
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </td> */}
                                        <td className="py-2 px-2 text-center">
                                            {item.size} {item.unit || ''}
                                        </td>
                                        <td className="py-2 px-2 text-right">{item.price.toFixed(2)} BDT</td>
                                        <td className="py-2 px-2 text-center">{item.quantity}</td>
                                        <td className="py-2 px-2 text-right">
                                            {(item.price * item.quantity).toFixed(2)} BDT
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex flex-col items-end space-y-1">
                        {/* Subtotal */}
                        <div className="flex justify-between w-6/12 border-t-2 pt-2 border-gray-300">
                            <span className="font-semibold">Subtotal:</span>
                            <span>{calculateSubtotal().toFixed(2)} BDT</span>
                        </div>

                        {/* Received */}
                        <div className="flex justify-between w-6/12 border-[#FB923C] text-lg font-bold text-[#FB923C]">
                            <span className="font-semibold">Received:</span>
                            <span>
                                {sale.isPaid ? `${sale.amount.toFixed(2)} BDT` : '0.00 BDT'}
                            </span>
                        </div>

                        {/* Due */}
                        <div className="flex justify-between w-6/12 border-[#FB923C] text-lg font-bold text-[#FB923C]">
                            <span className="font-semibold">Due:</span>
                            <span>
                                {(
                                    calculateSubtotal() -
                                    (sale.isPaid ? sale.amount : 0)
                                ).toFixed(2)} BDT
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-10 text-center text-gray-700 text-xs">
                        <p>Thank you for your business!</p>
                        <p>For any queries, contact khushbuwaala@gmail.com</p>
                        {/* <p className="mt-1">
                            This is a computer-generated invoice and does not require a signature.
                        </p> */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SalesInvoice;
