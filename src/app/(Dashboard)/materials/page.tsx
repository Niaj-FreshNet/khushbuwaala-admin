'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    useGetAllMaterialsQuery,
    useUpdateMaterialMutation,
    useDeleteMaterialMutation,
} from '@/redux/store/api/material/materialApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const materialSchema = z.object({
    materialName: z.string().min(1, 'Material name is required'),
});

export default function MaterialList() {
    const { data, isLoading } = useGetAllMaterialsQuery({});
    const [updateMaterial] = useUpdateMaterialMutation();
    const [deleteMaterial] = useDeleteMaterialMutation();
    const router = useRouter();

    const allMaterials = data?.data?.data || [];

    const [filteredMaterials, setFilteredMaterials] = useState(allMaterials);
    const [searchTerm, setSearchTerm] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<any>(null);

    useEffect(() => {
        const materials = data?.data?.data || [];
        if (searchTerm) {
            setFilteredMaterials(
                materials.filter((mat: any) =>
                    mat.materialName.toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        } else {
            setFilteredMaterials(materials);
        }
    }, [searchTerm, data]);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this material?');
        if (confirmed) {
            try {
                await deleteMaterial(id).unwrap();
                toast.success('Material deleted successfully');
            } catch {
                toast.error('Failed to delete material');
            }
        }
    };

    const handleEdit = (material: any) => {
        setEditingMaterial(material);
        setEditModalOpen(true);
    };

    const handleUpdate = async (data: z.infer<typeof materialSchema>) => {
        try {
            await updateMaterial({
                id: editingMaterial.id,
                updatedData: { materialName: data.materialName }
            }).unwrap();
            setEditModalOpen(false);
        } catch (error) {
            console.error('Error updating material:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                    <Input
                        placeholder="Search materials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-orange-400"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
                <Link href="/dashboard/materials/add">
                    <Button className="bg-orange-400 hover:bg-orange-500">
                        <Plus className="mr-2 h-4 w-4" /> Add Material
                    </Button>
                </Link>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        filteredMaterials.map((material: any) => (
                            <TableRow key={material.id}>
                                <TableCell className="capitalize">{material.materialName}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" onClick={() => handleEdit(material)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" className="text-red-600" onClick={() => handleDelete(material.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-orange-400">Edit Material</DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(materialSchema)}
                        defaultValues={{ materialName: editingMaterial?.materialName || '' }}
                        onSubmit={handleUpdate}
                        successMessage="Material updated successfully!"
                        errorMessage="Failed to update material"
                        submitButtonText="Update Material"
                        submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                        resetButtonClassName="border-orange-400 text-orange-400"
                    >
                        <FormInput
                            name="materialName"
                            label="Material Name"
                            placeholder="e.g., Oud, Amber"
                            required
                            inputClassName="border-orange-400"
                        />
                    </FormWrapper>
                </DialogContent>
            </Dialog>
        </div>
    );
}
