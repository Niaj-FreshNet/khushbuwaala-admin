'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useGetSaleByIdQuery } from '@/redux/store/api/sales/salesApi';
import { useEffect, useState } from 'react';
import { useLazyGetProductQuery } from '@/redux/store/api/product/productApi';
import { Receipt } from 'lucide-react';
import SalesInvoice from './SalesInvoice'; // Import the new invoice component

interface SaleDetailsModalProps {
    saleId: string;
    visible: boolean;
    onClose: () => void;
}

interface Sale {
    id: string;
    invoice: string;
    orderTime: string;
    status: string;
    salesman?: { name: string; email: string } | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    name?: string | null;
    orderSource: string;
    saleType: string;
    isPaid: boolean;
    method: string;
    amount: number;
    cartItems: Array<{
        productId: string;
        product?: { name: string; primaryImage?: string };
        size?: number;
        unit?: string;
        price: number;
        quantity: number;
    }>;
}

const SaleDetailsModal = ({ saleId, visible, onClose }: SaleDetailsModalProps) => {
    const { data, isLoading } = useGetSaleByIdQuery(saleId);
    const sale: Sale | undefined = data?.data;

    const [fetchProduct] = useLazyGetProductQuery();
    const [productMap, setProductMap] = useState<Record<string, { name: string; primaryImage?: string }>>({});
    const [showInvoice, setShowInvoice] = useState(false);

    useEffect(() => {
        if (sale?.cartItems?.length) {
            sale.cartItems.forEach(async (item) => {
                const id = item.productId;
                if (id && !productMap[id]) {
                    try {
                        const res = await fetchProduct(id).unwrap();
                        const product = res?.data;
                        if (product) {
                            setProductMap((prev) => ({
                                ...prev,
                                [id]: { name: product.name, primaryImage: product.primaryImage },
                            }));
                        }
                    } catch (err) {
                        console.error('Error fetching product', err);
                    }
                }
            });
        }
    }, [sale]);

    // Update sale object with product names
    const updatedSale = sale ? {
        ...sale,
        cartItems: sale.cartItems.map(item => ({
            ...item,
            product: productMap[item.productId]
        }))
    } : undefined;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING':
                return 'bg-orange-500';
            case 'PROCESSING':
                return 'bg-yellow-500';
            case 'DELIVERED':
                return 'bg-blue-500';
            case 'COMPLETED':
                return 'bg-[#4CD964]';
            case 'CANCEL':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <>
            <Dialog open={visible} onOpenChange={onClose}>
                <DialogContent className="max-w-8xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-[#FB923C] flex items-center justify-between">
                            <span>Sale Details</span>
                            {sale && (
                                <Button
                                    onClick={() => setShowInvoice(true)}
                                    className="bg-[#FB923C] hover:bg-[#ff8a29]"
                                    size="sm"
                                >
                                    <Receipt className="w-4 h-4 mr-2" />
                                    View Invoice
                                </Button>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="text-center py-8">Loading sale details...</div>
                    ) : !sale ? (
                        <div className="text-center py-8">No sale details found.</div>
                    ) : (
                        <div className="space-y-6">
                            {/* Sale Info */}
                            <Card className="border-[#FB923C]">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Sale Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Invoice</p>
                                            <p>#{sale.invoice}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Sale Time</p>
                                            <p>{sale.orderTime ? new Date(sale.orderTime).toLocaleString() : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Sale Type</p>
                                            <p>{sale.saleType || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Order Source</p>
                                            <p>{sale.orderSource || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Status</p>
                                            <Badge className={getStatusColor(sale.status)}>{sale.status}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Sold By</p>
                                            <p>{sale.salesman?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Customer Info */}
                            <Card className="border-[#FB923C]">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Name</p>
                                            <p>{sale.name || 'Walk-in Customer'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                            <p>{sale.email || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Phone</p>
                                            <p>{sale.phone || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Address</p>
                                            <p>{sale.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Info */}
                            <Card className="border-[#FB923C]">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Payment Method</p>
                                            <p className='font-semibold'>
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
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Payment Status</p>
                                            <Badge className={sale.isPaid ? 'bg-[#13db34]' : 'bg-red-500'}>
                                                <p className='font-bold'>{sale.isPaid ? 'PAID' : 'DUE'}</p>
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Total Amount</p>
                                            <p className="font-semibold">{sale.amount} BDT</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sale Items */}
                            <Card className="border-[#FB923C]">
                                <CardContent className="pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Sale Items</h3>
                                    {sale.cartItems?.map((item, index) => (
                                        <div key={index} className="border rounded-lg p-4 mb-4">
                                            <div className="flex gap-4">
                                                <Image
                                                    src={productMap[item.productId]?.primaryImage || '/placeholder.svg'}
                                                    alt={productMap[item.productId]?.name || 'Product'}
                                                    width={100}
                                                    height={80}
                                                    className="rounded object-cover"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-lg">{productMap[item.productId]?.name || 'Product Name...'}</h4>
                                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                                        <p><span className="text-gray-600">Size:</span> {item.size} {item.unit || 'N/A'}</p>
                                                        <p><span className="text-gray-600">Price:</span> {item.price} BDT</p>
                                                        <p><span className="text-gray-600">Quantity:</span> {item.quantity}</p>
                                                        <p className="col-span-2"><span className="text-gray-600">Subtotal:</span> {item.price * item.quantity} BDT</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Invoice Modal */}
            {updatedSale && (
                <SalesInvoice
                    sale={updatedSale}
                    visible={showInvoice}
                    onClose={() => setShowInvoice(false)}
                />
            )}
        </>
    );
};

export default SaleDetailsModal;