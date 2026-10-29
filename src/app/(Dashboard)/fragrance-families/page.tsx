'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    useGetAllFragrancesQuery,
    useUpdateFragranceMutation,
    useDeleteFragranceMutation,
} from '@/redux/store/api/fragrance/fragranceApi';
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

const fragranceSchema = z.object({
    fragranceName: z.string().min(1, 'Fragrance name is required'),
});

export default function FragranceList() {
    const { data, isLoading } = useGetAllFragrancesQuery({});
    const [updateFragrance] = useUpdateFragranceMutation();
    const [deleteFragrance] = useDeleteFragranceMutation();
    const router = useRouter();

    const allFragrances = data?.data?.data || [];

    const [filteredFragrances, setFilteredFragrances] = useState(allFragrances);
    const [searchTerm, setSearchTerm] = useState('');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingFragrance, setEditingFragrance] = useState<any>(null);

    useEffect(() => {
        const fragrances = data?.data?.data || [];
        if (searchTerm) {
            setFilteredFragrances(
                fragrances.filter((mat: any) =>
                    mat.fragranceName.toLowerCase().includes(searchTerm.toLowerCase())
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

    const handleEdit = (fragrance: any) => {
        setEditingFragrance(fragrance);
        setEditModalOpen(true);
    };

    const handleUpdate = async (data: z.infer<typeof fragranceSchema>) => {
        try {
            await updateFragrance({
                id: editingFragrance.id,
                updatedData: { fragranceName: data.fragranceName }
            }).unwrap();
            setEditModalOpen(false);
        } catch (error) {
            console.error('Error updating fragrance:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                    <Input
                        placeholder="Search fragrances..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-orange-400"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>
                <Link href="/dashboard/fragrance-families/add">
                    <Button className="bg-orange-400 hover:bg-orange-500">
                        <Plus className="mr-2 h-4 w-4" /> Add Fragrance
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
                        filteredFragrances.map((fragrance: any) => (
                            <TableRow key={fragrance.id}>
                                <TableCell className="capitalize">{fragrance.fragranceName}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" onClick={() => handleEdit(fragrance)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" className="text-red-600" onClick={() => handleDelete(fragrance.id)}>
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
                        <DialogTitle className="text-orange-400">Edit Fragrance</DialogTitle>
                    </DialogHeader>
                    <FormWrapper
                        resolver={zodResolver(fragranceSchema)}
                        defaultValues={{ fragranceName: editingFragrance?.fragranceName || '' }}
                        onSubmit={handleUpdate}
                        successMessage="Fragrance updated successfully!"
                        errorMessage="Failed to update fragrance"
                        submitButtonText="Update Fragrance"
                        submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                        resetButtonClassName="border-orange-400 text-orange-400"
                    >
                        <FormInput
                            name="fragranceName"
                            label="Fragrance Name"
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
