/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    useGetAllFragrancesQuery,
    useCreateFragranceMutation,
    useUpdateFragranceMutation,
    useDeleteFragranceMutation,
} from '@/redux/store/api/fragrance/fragranceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Sparkles, Tags } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const fragranceSchema = z.object({
    fragranceName: z.string().min(1, 'Fragrance name is required'),
});

export default function FragranceList() {
    const { data, isLoading } = useGetAllFragrancesQuery({});
    const [createFragrance] = useCreateFragranceMutation();
    const [updateFragrance] = useUpdateFragranceMutation();
    const [deleteFragrance] = useDeleteFragranceMutation();

    const allFragrances = data?.data?.data || [];

    const [filteredFragrances, setFilteredFragrances] = useState(allFragrances);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Controls
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingFragrance, setEditingFragrance] = useState<any>(null);

    useEffect(() => {
        const fragrances = data?.data?.data || [];
        if (searchTerm.trim()) {
            setFilteredFragrances(
                fragrances.filter((frag: any) =>
                    frag.fragranceName.toLowerCase().includes(searchTerm.toLowerCase().trim())
                )
            );
        } else {
            setFilteredFragrances(fragrances);
        }
    }, [searchTerm, data]);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this fragrance?');
        if (confirmed) {
            try {
                await deleteFragrance(id).unwrap();
                toast.success('Fragrance deleted successfully');
            } catch {
                toast.error('Failed to delete fragrance');
            }
        }
    };

    const handleCreate = async (formData: z.infer<typeof fragranceSchema>) => {
        try {
            await createFragrance({ fragranceName: formData.fragranceName }).unwrap();
            toast.success('Fragrance added successfully!');
            setAddModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error adding fragrance:', error);
            toast.error('Failed to add fragrance');
            return false;
        }
    };

    const handleEdit = (fragrance: any) => {
        setEditingFragrance(fragrance);
        setEditModalOpen(true);
    };

    const handleUpdate = async (formData: z.infer<typeof fragranceSchema>) => {
        try {
            await updateFragrance({
                id: editingFragrance.id,
                updatedData: { fragranceName: formData.fragranceName }
            }).unwrap();
            toast.success('Fragrance updated successfully!');
            setEditModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error updating fragrance:', error);
            toast.error('Failed to update fragrance');
            return false;
        }
    };

    return (
        <div className="w-full h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col overflow-hidden">
            {/* Top Header & Search Bar (Compact & Fixed) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-50 rounded-lg text-green-700 border border-green-100">
                        <Tags className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-xs sm:text-sm font-bold tracking-tight text-gray-900 leading-tight">Fragrance Families</h1>
                        <p className="text-[10px] text-gray-500">Manage perfume classification categories</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <Input
                            placeholder="Search fragrances..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-8 h-7 text-xs bg-white transition-colors shadow-2xs",
                                searchTerm.trim() ? "border-green-600 text-green-900 font-semibold bg-green-50/20" : "border-gray-300 text-gray-700"
                            )}
                        />
                    </div>
                    <Button
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white h-7 text-xs px-3 font-semibold shrink-0 shadow-2xs transition-colors"
                        onClick={() => setAddModalOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                </div>
            </div>

            {/* Scrollable Compact Grid Container */}
            <div className="flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs p-3 overflow-y-auto max-h-[calc(100vh-130px)]">
                {isLoading ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : filteredFragrances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                        <p className="font-semibold text-xs">No fragrance families found.</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Try searching for something else or add a new family.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {filteredFragrances.map((fragrance: any) => (
                            <div
                                key={fragrance.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/40 hover:bg-green-50/30 hover:border-green-200 transition-all group"
                            >
                                <span className="capitalize font-semibold text-xs text-gray-900 truncate pr-2">
                                    {fragrance.fragranceName}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                        onClick={() => handleEdit(fragrance)}
                                        title="Edit"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDelete(fragrance.id)}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Fragrance Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-xl p-4">
                    <DialogHeader className="border-b pb-2 mb-2">
                        <DialogTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-green-600" /> Add New Fragrance Family
                        </DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(fragranceSchema)}
                        defaultValues={{ fragranceName: '' }}
                        onSubmit={handleCreate}
                        successMessage="Fragrance added successfully!"
                        errorMessage="Failed to add fragrance"
                        submitButtonText="Save Fragrance"
                        submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-7 px-3 shadow-2xs transition-colors"
                        showResetButton={false}
                    >
                        <FormInput
                            name="fragranceName"
                            label="Fragrance Name"
                            placeholder="e.g., Woody, Floral, Oriental"
                            required
                            inputClassName="border-gray-300 text-xs h-7 bg-white"
                        />
                    </FormWrapper>
                </DialogContent>
            </Dialog>

            {/* Edit Fragrance Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-xl p-4">
                    <DialogHeader className="border-b pb-2 mb-2">
                        <DialogTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Edit className="w-3.5 h-3.5 text-green-600" /> Edit Fragrance Family
                        </DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(fragranceSchema)}
                        defaultValues={{ fragranceName: editingFragrance?.fragranceName || '' }}
                        onSubmit={handleUpdate}
                        successMessage="Fragrance updated successfully!"
                        errorMessage="Failed to update fragrance"
                        submitButtonText="Update Fragrance"
                        submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-7 px-3 shadow-2xs transition-colors"
                        showResetButton={false}
                    >
                        <FormInput
                            name="fragranceName"
                            label="Fragrance Name"
                            placeholder="e.g., Woody, Floral"
                            required
                            inputClassName="border-gray-300 text-xs h-7 bg-white"
                        />
                    </FormWrapper>
                </DialogContent>
            </Dialog>
        </div>
    );
}