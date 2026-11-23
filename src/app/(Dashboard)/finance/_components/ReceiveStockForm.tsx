import { CostLine, useGetLiveWACQuery, useReceiveStockPurchaseMutation } from '@/redux/store/api/finance/financeApi';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { apiErrorMessage } from "@/lib/apiError";

interface Props {
    productId: string;
    productName: string;
    unit: string;
    onSuccess?: () => void;
}

export default function ReceiveStockForm({ productId, productName, unit, onSuccess }: Props) {
    const { data: wacData } = useGetLiveWACQuery(productId);
    const [receiveStock, { isLoading: isSaving }] = useReceiveStockPurchaseMutation();
    const currentWAC = wacData?.data?.avgCostPerUnit || 0;

    const [quantity, setQuantity] = useState<number | ''>('');
    const [supplier, setSupplier] = useState('');
    const [billNo, setBillNo] = useState('');
    const [note, setNote] = useState('');
    
    const [costLines, setCostLines] = useState<CostLine[]>([
        { category: 'STOCK_BILL', amount: 0, label: 'Main Liquid Bill' },
        { category: 'CARRYING', amount: 0, label: 'Shipping to Warehouse' }
    ]);

    const handleUpdateLine = (index: number, amount: number) => {
        const updated = [...costLines];
        updated[index].amount = amount;
        setCostLines(updated);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantity || quantity <= 0) return toast.error('Valid quantity required');
        
        const totalCost = costLines.reduce((sum, line) => sum + line.amount, 0);
        if (totalCost <= 0) return toast.error('Total cost must be greater than 0');

        try {
            await receiveStock({
                productId,
                payload: {
                    quantity: Number(quantity),
                    unit: unit || 'ML',
                    supplier,
                    billNo,
                    note,
                    costLines
                }
            }).unwrap();
            
            toast.success(`Stock received for ${productName}; average cost updated`);
            setQuantity(''); setSupplier(''); setBillNo(''); setNote('');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to receive stock'));
        }
    };

    const totalCost = costLines.reduce((sum, line) => sum + (line.amount || 0), 0);
    const newCostPerUnit = quantity ? (totalCost / Number(quantity)) : 0;

    return (
        <form onSubmit={handleSave} className="p-4 sm:p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-5 sm:mb-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 break-words w-full sm:w-auto">Receive Stock</h2>
                <div className="text-left sm:text-right bg-blue-50 sm:bg-transparent p-2 sm:p-0 rounded-lg w-full sm:w-auto">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold">Current Avg Cost (WAC)</p>
                    <p className="text-base sm:text-lg font-black text-blue-700">
                        ৳ {currentWAC.toFixed(2)} <span className="text-xs sm:text-sm font-semibold text-gray-500">/ {unit || 'ML'}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Quantity ({unit || 'ML'}) *</label>
                    <input 
                        type="number" required
                        value={quantity} onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        className="border border-gray-300 p-2.5 rounded-lg w-full bg-gray-50 focus:bg-white text-sm" 
                        placeholder="e.g. 5000"
                    />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Supplier Name</label>
                    <input 
                        type="text" 
                        value={supplier} onChange={e => setSupplier(e.target.value)}
                        className="border border-gray-300 p-2.5 rounded-lg w-full bg-gray-50 focus:bg-white text-sm" 
                        placeholder="e.g. Lattafa UAE"
                    />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Bill / Invoice No</label>
                    <input 
                        type="text" 
                        value={billNo} onChange={e => setBillNo(e.target.value)}
                        className="border border-gray-300 p-2.5 rounded-lg w-full bg-gray-50 focus:bg-white text-sm" 
                        placeholder="e.g. INV-2024-991"
                    />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">Internal Note</label>
                    <input 
                        type="text" 
                        value={note} onChange={e => setNote(e.target.value)}
                        className="border border-gray-300 p-2.5 rounded-lg w-full bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Optional"
                    />
                </div>
            </div>

            <div className="bg-gray-50 p-4 sm:p-5 rounded-xl border border-gray-200 mb-5 sm:mb-6">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-3 border-b border-gray-200 pb-2">Purchase Financials</h3>
                {costLines.map((line, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-2 gap-1 sm:gap-0">
                        <span className="text-xs sm:text-sm font-semibold text-gray-600 w-full sm:w-1/2">{line.label}</span>
                        <div className="flex items-center gap-2 w-full sm:w-1/2">
                            <span className="text-gray-400 font-bold">৳</span>
                            <input
                                type="number" min="0" required
                                value={line.amount || ''}
                                onChange={(e) => handleUpdateLine(idx, Number(e.target.value))}
                                className="border border-gray-300 p-2 rounded-lg w-full text-right text-sm"
                            />
                        </div>
                    </div>
                ))}
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-bold text-gray-700 text-sm sm:text-base">Total Cost:</span>
                    <span className="font-black text-lg sm:text-xl text-black">৳ {totalCost.toFixed(2)}</span>
                </div>
                
                {quantity !== '' && Number(quantity) > 0 && (
                    <div className="text-right mt-2 text-xs sm:text-sm text-gray-500 font-medium">
                        This Batch Cost: <span className="font-bold text-emerald-700">৳ {newCostPerUnit.toFixed(2)} / {unit || 'ML'}</span>
                    </div>
                )}
            </div>

            <button 
                type="submit" disabled={isSaving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 sm:py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 text-sm sm:text-base"
            >
                {isSaving ? 'Processing...' : 'Receive Stock & Recalculate WAC'}
            </button>
        </form>
    );
}