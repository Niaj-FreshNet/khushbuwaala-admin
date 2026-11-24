'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Check, Calculator, DollarSign } from 'lucide-react';
import { useOverrideOrderProfitMutation } from '@/redux/store/api/finance/financeApi';
import { apiErrorMessage } from "@/lib/apiError";
import type { Order } from "@/types/order.types";

/** One line of the profit editor (from the order's Finance cost snapshot) */
type ProfitLine = {
    id?: string;
    cartItemId?: string | null;
    productName: string;
    quantity: number;
    sellingUnitPrice: number;
    liquidUnitCost: number;
    packagingUnitCost: number;
};
type NumberField = 'quantity' | 'sellingUnitPrice' | 'liquidUnitCost' | 'packagingUnitCost';

const lineProfit = (l: ProfitLine) => (l.sellingUnitPrice - l.liquidUnitCost - l.packagingUnitCost) * l.quantity;

interface OrderProfitEditorModalProps {
    sale: Order | null;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function OrderProfitEditorModal({
    sale,
    visible,
    onClose,
    onSuccess,
}: OrderProfitEditorModalProps) {
    const [overrideProfit, { isLoading: isSaving }] = useOverrideOrderProfitMutation();

    const [editableItems, setEditableItems] = useState<ProfitLine[]>([]);
    const [manualOverrideProfit, setManualOverrideProfit] = useState<string>('');

    useEffect(() => {
        if (sale && sale.orderItemCosts) {
            const initialItems: ProfitLine[] = sale.orderItemCosts.map((ic) => {
                const itemObj = sale.orderItems?.find((oi) => oi.id === ic.cartItemId);
                return {
                    id: ic.id,
                    cartItemId: ic.cartItemId,
                    productName: itemObj?.product?.name || 'Product Item',
                    quantity: ic.quantity || 1,
                    sellingUnitPrice: ic.sellingUnitPrice || 0,
                    liquidUnitCost: ic.liquidUnitCost || 0,
                    packagingUnitCost: ic.packagingUnitCost || 0,
                };
            });
            setEditableItems(initialItems);

            const totalCalcProfit = initialItems.reduce((acc, item) => acc + lineProfit(item), 0);

            setManualOverrideProfit(totalCalcProfit.toString());
        }
    }, [sale]);

    const handleItemChange = (index: number, field: NumberField, value: string) => {
        const num = parseFloat(value);
        const updated = [...editableItems];
        updated[index] = {
            ...updated[index],
            [field]: isNaN(num) ? 0 : num,
        };
        setEditableItems(updated);

        const newTotal = updated.reduce((acc, item) => acc + lineProfit(item), 0);
        setManualOverrideProfit(newTotal.toFixed(2));
    };

    const handleSave = async () => {
        if (!sale?.id) return;
        const finalProfit = parseFloat(manualOverrideProfit);
        if (isNaN(finalProfit)) {
            toast.error('Please enter a valid profit amount');
            return;
        }

        try {
            await overrideProfit({
                orderId: sale.id,
                profit: finalProfit,
            }).unwrap();

            toast.success('Order profit updated successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            const errorMsg = apiErrorMessage(err, '');
            if (errorMsg.includes('No cost snapshot found')) {
                toast.error('Please click "Sync Old Profits" on the main page for this order first to create its cost snapshot.');
            } else {
                toast.error(errorMsg || 'Failed to update profit calculation');
            }
        }
    };

    // Submit on pressing Enter from any input field
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    if (!sale) return null;

    return (
        <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
            {/* Responsive width, padding, and max-height for mobile/PC screens */}
            <DialogContent className="w-[95vw] max-w-[700px] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-xl">
                <DialogHeader className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                                Financial Breakdown & Profit Editor — #{sale.invoice}
                            </DialogTitle>
                            <DialogDescription className="text-[11px] sm:text-xs text-gray-500">
                                Review and recalculate unit costs, selling prices, and net margins. Press Enter to save.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 my-2">
                    {/* Summary Banner */}
                    <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3 sm:p-3.5 flex items-center justify-between shadow-2xs">
                        <div>
                            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Calculated Net Profit</p>
                            <h3 className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">
                                ৳{parseFloat(manualOverrideProfit || '0').toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                                {sale.orderItemCosts?.length || 0} Item(s)
                            </span>
                        </div>
                    </div>

                    {/* Editable Items List */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Order Items & Cost Parameters</h4>

                        {editableItems.length === 0 ? (
                            <p className="text-xs text-gray-500 italic py-6 text-center border rounded-lg bg-gray-50">
                                No cost snapshots found for this order. Click &quot;Sync Old Profits&quot; on the main page first.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {editableItems.map((item, index) => {
                                    const itemRevenue = item.sellingUnitPrice * item.quantity;
                                    const itemTotalCost = (item.liquidUnitCost + item.packagingUnitCost) * item.quantity;
                                    const itemProfit = itemRevenue - itemTotalCost;

                                    return (
                                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs space-y-3">
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                                <span className="text-xs font-bold text-gray-900 truncate max-w-[220px] sm:max-w-[350px]" title={item.productName}>
                                                    {item.productName}
                                                </span>
                                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shrink-0">
                                                    Qty: {item.quantity}
                                                </span>
                                            </div>

                                            {/* 2-col on mobile, 4-col on desktop */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                                                <div>
                                                    <label className="text-[10px] font-medium text-gray-500 block mb-1">Selling Price </label>
                                                    <Input
                                                        type="number"
                                                        value={item.sellingUnitPrice}
                                                        onChange={(e) => handleItemChange(index, 'sellingUnitPrice', e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        className="h-8 text-xs bg-gray-50/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-gray-500 block mb-1">Product Cost</label>
                                                    <Input
                                                        type="number"
                                                        value={item.liquidUnitCost}
                                                        onChange={(e) => handleItemChange(index, 'liquidUnitCost', e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        className="h-8 text-xs bg-gray-50/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-gray-500 block mb-1">Packaging Cost</label>
                                                    <Input
                                                        type="number"
                                                        value={item.packagingUnitCost}
                                                        onChange={(e) => handleItemChange(index, 'packagingUnitCost', e.target.value)}
                                                        onKeyDown={handleKeyDown}
                                                        className="h-8 text-xs bg-gray-50/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-medium text-gray-500 block mb-1">Line Profit </label>
                                                    <div className={`h-8 px-2.5 flex items-center font-bold rounded text-xs border ${itemProfit >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                        ৳{itemProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Direct Manual Override Input */}
                    <div className="border-t border-gray-200 pt-3 space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Override Final Net Profit
                        </label>
                        <Input
                            type="number"
                            value={manualOverrideProfit}
                            onChange={(e) => setManualOverrideProfit(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter precise net profit..."
                            className="h-9 font-bold text-sm border-emerald-300 focus-visible:ring-emerald-500"
                        />
                        <p className="text-[10px] sm:text-[11px] text-gray-400">
                            Press Enter inside any input field to instantly submit and update.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto h-9 text-xs">
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save & Recalculate Profit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}