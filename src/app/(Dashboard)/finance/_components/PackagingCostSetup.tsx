import React, { useState, useEffect } from 'react';
import { 
  useGetPackagingCostsQuery, 
  useSetPackagingCostsMutation, 
  CostLine, 
  CostCategory 
} from '@/redux/store/api/finance/financeApi';
import { toast } from 'sonner';
import { apiErrorMessage } from "@/lib/apiError";

interface Props {
  sku: string;
}

const CATEGORIES: CostCategory[] = ['BOTTLE', 'PACKAGING', 'LABEL', 'OTHER'];

export default function PackagingCostSetup({ sku }: Props) {
  const { data, isLoading: fetching } = useGetPackagingCostsQuery(sku);
  const [setPackagingCosts, { isLoading: isSaving }] = useSetPackagingCostsMutation();
  const [costLines, setCostLines] = useState<CostLine[]>([]);

  useEffect(() => {
    if (data?.data?.costLines) {
      setCostLines(data.data.costLines);
    }
  }, [data]);

  const handleAddLine = () => setCostLines([...costLines, { category: 'BOTTLE', amount: 0, label: '' }]);

  const handleUpdateLine = <K extends keyof CostLine>(index: number, field: K, value: CostLine[K]) => {
    const updated = [...costLines];
    updated[index] = { ...updated[index], [field]: value };
    setCostLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setCostLines(costLines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await setPackagingCosts({ sku, costLines }).unwrap();
      toast.success('Packaging costs saved successfully');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to save costs'));
    }
  };

  const totalCost = costLines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  if (fetching) return <div className="animate-pulse h-32 bg-gray-200 rounded-xl"></div>;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-800">Fixed Packaging Costs</h3>
      
      <div className="space-y-3 mb-4">
        {costLines.map((line, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-gray-100">
            <select
              value={line.category}
              onChange={(e) => handleUpdateLine(idx, 'category', e.target.value as CostCategory)}
              className="border border-gray-300 p-2 rounded-md w-full sm:w-1/3 text-sm bg-white"
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            
            <input
              type="text"
              placeholder="Note (Optional)"
              value={line.label || ''}
              onChange={(e) => handleUpdateLine(idx, 'label', e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full sm:w-1/3 text-sm bg-white"
            />
            
            <div className="flex items-center gap-2 w-full sm:w-1/3">
              <span className="text-gray-500 font-bold hidden sm:inline">৳</span>
              <div className="relative w-full">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold sm:hidden">৳</span>
                <input
                  type="number"
                  min="0"
                  value={line.amount || ''}
                  onChange={(e) => handleUpdateLine(idx, 'amount', Number(e.target.value))}
                  className="border border-gray-300 p-2 pl-7 sm:pl-2 rounded-md w-full text-sm bg-white"
                  placeholder="0.00"
                />
              </div>
              <button 
                onClick={() => handleRemoveLine(idx)} 
                className="text-rose-500 hover:bg-rose-50 border border-rose-100 sm:border-transparent bg-white sm:bg-transparent p-2 rounded-md shrink-0 transition-colors"
                title="Remove Item"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {costLines.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4 italic">No packaging costs added yet.</p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100">
        <button 
            onClick={handleAddLine} 
            className="text-blue-600 text-sm font-bold hover:underline w-full sm:w-auto text-center sm:text-left bg-blue-50 sm:bg-transparent py-2 sm:py-0 rounded-md"
        >
          + Add Cost Item
        </button>
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto">
          <div className="flex justify-between w-full sm:w-auto text-sm sm:text-base">
            <span className="text-gray-500 font-semibold mr-2 sm:mr-0">Total Cost:</span>
            <span className="text-black font-black">৳ {totalCost.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold disabled:opacity-50 transition-colors text-sm"
          >
            {isSaving ? 'Saving...' : 'Save Costs'}
          </button>
        </div>
      </div>
    </div>
  );
}