'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    useGetAllMaterialsQuery,
    useCreateMaterialMutation,
    useUpdateMaterialMutation,
    useDeleteMaterialMutation,
} from '@/redux/store/api/material/materialApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Sparkles, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import type { Material } from '@/types/material.types';

const materialSchema = z.object({
    materialName: z.string().min(1, 'Material name is required'),
});

export default function MaterialList() {
    const { data, isLoading } = useGetAllMaterialsQuery({});
    const [createMaterial] = useCreateMaterialMutation();
    const [updateMaterial] = useUpdateMaterialMutation();
    const [deleteMaterial] = useDeleteMaterialMutation();

    const allMaterials = data?.data?.data || [];

    const [filteredMaterials, setFilteredMaterials] = useState(allMaterials);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal Controls
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    useEffect(() => {
        const materials = data?.data?.data || [];
        if (searchTerm.trim()) {
            setFilteredMaterials(
                materials.filter((mat) =>
                    mat.materialName.toLowerCase().includes(searchTerm.toLowerCase().trim())
                )
            );
        } else {
            setFilteredMaterials(materials);
        }
    }, [searchTerm, data]);

    const confirmDialog = useConfirm();
    const handleDelete = async (id: string) => {
        const confirmed = (await confirmDialog({ title: "Delete this material?", danger: true }));
        if (confirmed) {
            try {
                await deleteMaterial(id).unwrap();
                toast.success('Material deleted successfully');
            } catch {
                toast.error('Failed to delete material');
            }
        }
    };

    const handleCreate = async (formData: z.infer<typeof materialSchema>) => {
        try {
            await createMaterial({ materialName: formData.materialName }).unwrap();
            toast.success('Material added successfully!');
            setAddModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error adding material:', error);
            toast.error('Failed to add material');
            return false;
        }
    };

    const handleEdit = (material: Material) => {
        setEditingMaterial(material);
        setEditModalOpen(true);
    };

    const handleUpdate = async (formData: z.infer<typeof materialSchema>) => {
        if (!editingMaterial) return;
        try {
            await updateMaterial({
                id: editingMaterial.id,
                updatedData: { materialName: formData.materialName }
            }).unwrap();
            toast.success('Material updated successfully!');
            setEditModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error updating material:', error);
            toast.error('Failed to update material');
            return false;
        }
    };

    return (
        <div className="w-full h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col overflow-hidden">
            {/* Top Header & Search Bar (Compact & Fixed) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs shrink-0 mb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-50 rounded-lg text-green-700 border border-green-100">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-xs sm:text-sm font-bold tracking-tight text-gray-900 leading-tight">Perfume Materials</h1>
                        <p className="text-[10px] text-gray-500">Manage fragrance raw materials & ingredients</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                        <Input
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-8 h-10 sm:h-7 text-xs bg-white transition-colors shadow-2xs",
                                searchTerm.trim() ? "border-green-600 text-green-900 font-semibold bg-green-50/20" : "border-gray-300 text-gray-700"
                            )}
                        />
                    </div>
                    <Button
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white h-10 sm:h-7 text-xs px-3 font-semibold shrink-0 shadow-2xs transition-colors"
                        onClick={() => setAddModalOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add
                    </Button>
                </div>
            </div>

            {/* Scrollable Compact Grid Container */}
            <div className="flex-1 bg-white border border-gray-200/80 rounded-xl shadow-2xs p-3 overflow-y-auto max-h-[calc(100vh-130px)]">
                {isLoading ? (
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                        <p className="font-semibold text-xs">No materials found.</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Try searching for something else or add a new material.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {filteredMaterials.map((material) => (
                            <div
                                key={material.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/40 hover:bg-green-50/30 hover:border-green-200 transition-all group"
                            >
                                <span className="capitalize font-semibold text-sm sm:text-xs text-gray-900 truncate pr-2">
                                    {material.materialName}
                                </span>
                                <div className="flex items-center gap-0.5 opacity-95 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 sm:h-7 sm:w-7 text-blue-600 hover:bg-blue-50"
                                        onClick={() => handleEdit(material)}
                                        title="Edit"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 sm:h-7 sm:w-7 text-rose-600 hover:bg-rose-50"
                                        onClick={() => handleDelete(material.id)}
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

            {/* Add Material Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[400px] rounded-xl p-4">
                    <DialogHeader className="border-b pb-2 mb-2">
                        <DialogTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-green-600" /> Add New Material
                        </DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(materialSchema)}
                        defaultValues={{ materialName: '' }}
                        onSubmit={handleCreate}
                        errorMessage="Failed to add material"
                        submitButtonText="Save Material"
                        submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-7 px-3 shadow-2xs transition-colors"
                        showResetButton={false}
                    >
                        <FormInput
                            name="materialName"
                            label="Material Name"
                            placeholder="e.g., Oud, Amber, Sandalwood"
                            required
                            inputClassName="border-gray-300 text-xs h-10 sm:h-7 bg-white"
                        />
                    </FormWrapper>
                </DialogContent>
            </Dialog>

            {/* Edit Material Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[400px] rounded-xl p-4">
                    <DialogHeader className="border-b pb-2 mb-2">
                        <DialogTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                            <Edit className="w-3.5 h-3.5 text-green-600" /> Edit Material
                        </DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(materialSchema)}
                        defaultValues={{ materialName: editingMaterial?.materialName || '' }}
                        onSubmit={handleUpdate}
                        errorMessage="Failed to update material"
                        submitButtonText="Update Material"
                        submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-7 px-3 shadow-2xs transition-colors"
                        showResetButton={false}
                    >
                        <FormInput
                            name="materialName"
                            label="Material Name"
                            placeholder="e.g., Oud, Amber"
                            required
                            inputClassName="border-gray-300 text-xs h-10 sm:h-7 bg-white"
                        />
                    </FormWrapper>
                </DialogContent>
            </Dialog>
        </div>
    );
}