import React, { useState } from 'react';
import ReceiveStockForm from './ReceiveStockForm';
import PackagingCostSetup from './PackagingCostSetup';

interface CostingModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    variantSku: string;
    productName: string;
    variantSize: number;
    variantUnit: string;
}

export default function CostingModal({
    isOpen,
    onClose,
    productId,
    variantSku,
    productName,
    variantSize,
    variantUnit
}: CostingModalProps) {
    const [activeTab, setActiveTab] = useState<'packaging' | 'stock'>('packaging');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Modal Header */}
                <div className="flex justify-between items-start sm:items-center px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                    <div className="pr-4">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Financial Setup</h2>
                        <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                            {productName} - {variantSize}{variantUnit} (SKU: {variantSku})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center shrink-0 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-4 sm:px-6 pt-2 sm:pt-3 gap-4 overflow-x-auto scrollbar-hide">
                    <button
                        type="button"
                        onClick={() => setActiveTab('packaging')}
                        className={`pb-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === 'packaging'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        $ Fixed Packaging
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('stock')}
                        className={`pb-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === 'stock'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        📦 Receive Stock (WAC)
                    </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/30">
                    {activeTab === 'packaging' ? (
                        <PackagingCostSetup sku={variantSku} />
                    ) : (
                        <ReceiveStockForm 
                            productId={productId} 
                            productName={`${productName} (${variantSize}${variantUnit})`} 
                            unit={variantUnit}
                            onSuccess={onClose} 
                        />
                    )}
                </div>

            </div>
        </div>
    );
}