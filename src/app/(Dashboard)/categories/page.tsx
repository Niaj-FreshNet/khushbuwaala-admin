/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
    useGetAllCategoriesAdminQuery,
    useCreateCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation,
} from '@/redux/store/api/category/categoryApi';

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
import { Search, Plus, Edit, Trash2, Upload, Sparkles, FolderTree, Package, Calendar } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { FormCheckbox } from '@/components/ReusableUI/FormCheckbox';
import { categorySchema } from '@/schemas/category.schema';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const BASE_SIZES = [
    "0.5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
    "15", "18", "20", "25", "30", "45", "50", "60", "75", "100",
    "125", "200", "250", "300", "450", "500", "1000",
];

const BASE_UNITS = [
    'ML', 'GM', 'TOLA', 'OUNCE', 'PIECE', 'PACKAGE',
    'SET', 'BOX', 'GIFT', 'CAN', 'BOTTLE', 'CARTON', 'BAG'
];

const uniqKeepTyped = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const x of arr) {
        const typed = String(x ?? '').trim();
        if (!typed) continue;
        const key = typed.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(typed);
    }
    return out;
};

function CustomSizeAdder({ addToOptions }: { addToOptions: (val: string) => void }) {
    const { getValues, setValue } = useFormContext();
    const [customSize, setCustomSize] = useState('');

    return (
        <div className="mt-2 space-y-1">
            <label className="text-xs font-semibold text-gray-700">Type custom size → Add</label>
            <div className="flex gap-2">
                <Input
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="border-gray-300 text-xs h-8 bg-white"
                    inputMode="decimal"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.click();
                        }
                    }}
                />
                <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 font-semibold shrink-0"
                    onClick={() => {
                        const val = customSize.trim();
                        if (!/^\d+(\.\d+)?$/.test(val)) {
                            toast.error('Enter a valid size like 0.5 / 7.5 / 10');
                            return;
                        }
                        addToOptions(val);
                        const current: string[] = getValues('sizes') || [];
                        if (!current.includes(val)) {
                            setValue('sizes', [...current, val], { shouldDirty: true, shouldValidate: true });
                        }
                        setCustomSize('');
                    }}
                >
                    Add
                </Button>
            </div>
        </div>
    );
}

function CustomUnitAdder({ addToOptions }: { addToOptions: (val: string) => void }) {
    const { setValue } = useFormContext();
    const [customUnit, setCustomUnit] = useState('');

    return (
        <div className="mt-2 space-y-1">
            <label className="text-xs font-semibold text-gray-700">Type custom unit → Add</label>
            <div className="flex gap-2">
                <Input
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g. ML / GM / PACKAGE"
                    className="border-gray-300 text-xs h-8 bg-white uppercase"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.click();
                        }
                    }}
                />
                <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 px-3 font-semibold shrink-0"
                    onClick={() => {
                        const val = customUnit.trim().toUpperCase();
                        if (!val) return;
                        addToOptions(val);
                        setValue('unit', val, { shouldDirty: true, shouldValidate: true });
                        setCustomUnit('');
                        toast.success('Unit selected');
                    }}
                >
                    Add
                </Button>
            </div>
        </div>
    );
}

export default function CategoryList() {
    const { data, isLoading } = useGetAllCategoriesAdminQuery();
    const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    // useMemo keeps the same array between renders (a fresh `[]` every render looped forever)
    const allCategories = useMemo(() => data?.data?.data || [], [data]);

    const [searchTerm, setSearchTerm] = useState('');

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [sizeOptions, setSizeOptions] = useState<string[]>(BASE_SIZES);
    const [unitOptions, setUnitOptions] = useState<string[]>(BASE_UNITS);

    const sizeCheckboxOptions = useMemo(
        () => sizeOptions.map((s) => ({ label: s, value: s })),
        [sizeOptions]
    );

    const unitSelectOptions = useMemo(
        () => unitOptions.map((u) => ({ label: u, value: u })),
        [unitOptions]
    );

    // Derived, not copied into state
    const filteredCategories = useMemo(() => {
        const q = searchTerm.toLowerCase().trim();
        if (!q) return allCategories;
        return allCategories.filter((cat: any) => String(cat.categoryName || '').toLowerCase().includes(q));
    }, [searchTerm, allCategories]);

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this category?');
        if (!confirmed) return;

        try {
            await deleteCategory(id).unwrap();
            toast.success('Category deleted successfully');
        } catch {
            toast.error('Failed to delete category');
        }
    };

    const handleCreate = async (form: z.infer<typeof categorySchema>) => {
        try {
            if (!imageFile) {
                toast.error('Category image is required');
                return false;
            }

            const formData = new FormData();
            formData.append('categoryName', form.categoryName);
            formData.append('image', imageFile);
            formData.append('published', JSON.stringify(form.published ?? true));
            formData.append('sizes', JSON.stringify((form.sizes || []).map((s) => String(s).trim())));
            formData.append('unit', String(form.unit || 'ML').trim());

            await createCategory(formData).unwrap();
            toast.success('Category added successfully!');
            setAddModalOpen(false);
            setImageFile(null);
            setImagePreview(null);
            return true;
        } catch (error) {
            console.error('Error creating category:', error);
            toast.error('Failed to add category');
            return false;
        }
    };

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setEditModalOpen(true);
        setImagePreview(category.imageUrl || null);
        setImageFile(null);

        const existingSizes = (category?.sizes || []).map((s: any) => String(s).trim());
        const existingUnit = category?.unit ? [String(category.unit).trim()] : [];

        setSizeOptions(uniqKeepTyped([...BASE_SIZES, ...existingSizes]));
        setUnitOptions(uniqKeepTyped([...BASE_UNITS, ...existingUnit]));
    };

    const handleUpdate = async (form: z.infer<typeof categorySchema>) => {
        try {
            if (!editingCategory?.id) return false;

            if (imageFile) {
                const formData = new FormData();
                formData.append('categoryName', form.categoryName);
                formData.append('image', imageFile);
                formData.append('published', JSON.stringify(form.published));
                formData.append('sizes', JSON.stringify((form.sizes || []).map((s) => String(s).trim())));
                formData.append('unit', String(form.unit).trim());

                if (editingCategory?.imageUrl) {
                    formData.append('existingImageUrl', editingCategory.imageUrl);
                }

                await updateCategory({ id: editingCategory.id, updatedData: formData }).unwrap();
            } else {
                await updateCategory({
                    id: editingCategory.id,
                    updatedData: {
                        categoryName: form.categoryName,
                        published: form.published,
                        sizes: (form.sizes || []).map((s) => String(s).trim()),
                        unit: String(form.unit).trim(),
                        imageUrl: editingCategory.imageUrl,
                    },
                }).unwrap();
            }

            toast.success('Category updated successfully');
            setEditModalOpen(false);
            setImageFile(null);
            setImagePreview(null);
            return true;
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
            return false;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        const isValidSize = file.size <= 25 * 1024 * 1024;

        if (!isValidType) return toast.error('Only JPG/PNG/WebP files are allowed!');
        if (!isValidSize) return toast.error('Image must be smaller than 25MB!');

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="w-full min-h-screen bg-gray-50/50 px-3 sm:px-6 py-4 space-y-3">
            {/* Top Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-green-50 rounded-lg text-green-700 border border-green-100">
                        <FolderTree className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-sm sm:text-base font-bold tracking-tight text-gray-900 leading-tight">Product Categories</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Manage fragrance category taxonomy, sizes, units, and product counts</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn(
                                "pl-9 h-8 text-xs bg-white transition-colors shadow-2xs",
                                searchTerm.trim() ? "border-green-600 text-green-900 font-semibold bg-green-50/20" : "border-gray-300 text-gray-700"
                            )}
                        />
                    </div>
                    <Button
                        className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white h-8 text-xs px-4 font-semibold shrink-0 shadow-2xs transition-colors"
                        onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setSizeOptions(BASE_SIZES);
                            setUnitOptions(BASE_UNITS);
                            setAddModalOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Category
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <Table>
                        <TableHeader className="bg-gray-50/80 border-b border-gray-200 text-gray-700">
                            <TableRow>
                                <TableHead className="font-bold py-3 text-xs sm:text-sm pl-4">Category Details</TableHead>
                                <TableHead className="font-bold py-3 text-xs sm:text-sm">Configured Sizes & Unit</TableHead>
                                <TableHead className="font-bold py-3 text-xs sm:text-sm">Products Count</TableHead>
                                <TableHead className="font-bold py-3 text-xs sm:text-sm hidden lg:table-cell">Created Date</TableHead>
                                <TableHead className="font-bold py-3 text-xs sm:text-sm">Status</TableHead>
                                <TableHead className="text-right font-bold pr-4 py-3 text-xs sm:text-sm w-[1%] whitespace-nowrap">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 text-xs sm:text-sm">
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="py-3 pl-4"><Skeleton className="h-10 w-44 rounded" /></TableCell>
                                        <TableCell className="py-3"><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell className="py-3"><Skeleton className="h-5 w-16 rounded" /></TableCell>
                                        <TableCell className="py-3 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="py-3"><Skeleton className="h-6 w-10 rounded-full" /></TableCell>
                                        <TableCell className="text-right pr-4 py-3">
                                            <div className="inline-flex justify-end gap-1">
                                                <Skeleton className="h-8 w-8 rounded" />
                                                <Skeleton className="h-8 w-8 rounded" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                        <p className="font-semibold text-sm">No categories found.</p>
                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or add a new category.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCategories.map((category: any) => {
                                    const productCount = category._count?.Product ?? 0;
                                    return (
                                        <TableRow key={category.id} className="hover:bg-gray-50/80 transition-colors">
                                            {/* Thumbnail & Name */}
                                            <TableCell className="py-3 pl-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-gray-200 bg-gray-100 shrink-0 overflow-hidden shadow-2xs">
                                                        <Image
                                                            src={category.imageUrl || '/placeholder.svg'}
                                                            alt={category.categoryName || 'Category'}
                                                            fill
                                                            sizes="44px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-xs sm:text-sm text-gray-900 block truncate">
                                                            {String(category.categoryName || '')}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 block font-mono">ID: {category.id}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Configured Sizes */}
                                            <TableCell className="py-3 text-gray-600 font-medium max-w-[220px]">
                                                <div className="flex flex-wrap gap-1">
                                                    {(category.sizes || []).length > 0 ? (
                                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-mono">
                                                            {(category.sizes || []).join(', ')} {category.unit || ''}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">No sizes</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Products Count Badge */}
                                            <TableCell className="py-3 whitespace-nowrap">
                                                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 font-bold text-xs px-2.5 py-0.5 inline-flex items-center gap-1">
                                                    <Package className="w-3 h-3 text-green-600" />
                                                    {productCount} {productCount === 1 ? 'Product' : 'Products'}
                                                </Badge>
                                            </TableCell>

                                            {/* Created Date */}
                                            <TableCell className="py-3 text-xs text-gray-600 whitespace-nowrap font-medium hidden lg:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>{formatDate(category.createdAt)}</span>
                                                </div>
                                            </TableCell>

                                            {/* Status Switch */}
                                            <TableCell className="py-3">
                                                <Switch
                                                    checked={!!category.published}
                                                    onCheckedChange={async (checked) => {
                                                        try {
                                                            await updateCategory({
                                                                id: category.id,
                                                                updatedData: { published: checked },
                                                            }).unwrap();
                                                            toast.success('Status updated successfully');
                                                        } catch {
                                                            toast.error('Failed to update status');
                                                        }
                                                    }}
                                                    className="data-[state=checked]:bg-[#4CD964]"
                                                />
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="text-right pr-3 py-3 whitespace-nowrap">
                                                <div className="inline-flex justify-end items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => handleEdit(category)}
                                                        title="Edit Category"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={cn(
                                                            "h-8 w-8 text-rose-600 hover:bg-rose-50",
                                                            productCount > 0 && "opacity-45 hover:opacity-100"
                                                        )}
                                                        onClick={() => handleDelete(category.id)}
                                                        title={productCount > 0 ? "Cannot delete category with linked products" : "Delete Category"}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add Category Modal */}
            <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
                <DialogContent className="sm:max-w-[600px] p-0 rounded-xl overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-3 border-b bg-gray-50/75">
                        <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-green-600" /> Add New Category
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
                        <FormWrapper
                            resolver={zodResolver(categorySchema)}
                            defaultValues={{
                                categoryName: '',
                                sizes: [],
                                unit: unitOptions[0] || 'ML',
                                published: true,
                            }}
                            onSubmit={handleCreate}
                            successMessage="Category added successfully!"
                            errorMessage="Failed to add category"
                            submitButtonText={isCreating ? 'Creating...' : 'Save Category'}
                            submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-8 px-5 shadow-2xs transition-colors"
                            showResetButton={false}
                        >
                            <div className="space-y-4 text-xs">
                                <FormInput
                                    name="categoryName"
                                    label="Category Name"
                                    placeholder="e.g., Oriental Attar, Brand Perfumes"
                                    required
                                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                                />

                                <CustomSizeAdder
                                    addToOptions={(val) => setSizeOptions((prev) => uniqKeepTyped([...prev, val]))}
                                />

                                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 max-h-40 overflow-y-auto">
                                    <FormCheckboxGroup
                                        name="sizes"
                                        label="Select Applicable Sizes"
                                        options={sizeCheckboxOptions}
                                    />
                                </div>

                                <CustomUnitAdder
                                    addToOptions={(val) => setUnitOptions((prev) => uniqKeepTyped([...prev, val]))}
                                />

                                <FormInput
                                    name="unit"
                                    label="Default Measurement Unit"
                                    type="select"
                                    required
                                    options={unitSelectOptions}
                                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                                />

                                <div>
                                    <label className="text-xs font-semibold text-gray-700">
                                        Category Thumbnail <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 border-2 border-dashed border-gray-300 hover:border-green-600 transition-colors rounded-lg p-4 text-center bg-gray-50/40">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="add-category-image"
                                        />
                                        <label htmlFor="add-category-image" className="cursor-pointer">
                                            <Upload className="mx-auto h-7 w-7 text-green-600" />
                                            <p className="mt-1.5 text-xs font-medium text-gray-700">Drop file or click to upload</p>
                                            <p className="text-[10px] text-gray-400">JPG, PNG or WebP (Max 25MB)</p>
                                        </label>
                                    </div>

                                    {imagePreview && (
                                        <div className="mt-2.5">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                width={60}
                                                height={60}
                                                className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-2xs"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <FormCheckbox name="published" label="Publish Category Immediately" />
                                </div>
                            </div>
                        </FormWrapper>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Category Modal */}
            <Dialog
                open={editModalOpen}
                onOpenChange={(open) => {
                    setEditModalOpen(open);
                    if (!open) {
                        setImageFile(null);
                        setImagePreview(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px] p-0 rounded-xl overflow-hidden">
                    <DialogHeader className="px-6 pt-5 pb-3 border-b bg-gray-50/75">
                        <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Edit className="w-4 h-4 text-green-600" /> Edit Category
                        </DialogTitle>
                    </DialogHeader>

                    <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
                        <FormWrapper
                            resolver={zodResolver(categorySchema)}
                            defaultValues={{
                                categoryName: editingCategory?.categoryName || '',
                                sizes: editingCategory?.sizes || [],
                                unit: editingCategory?.unit || unitOptions[0] || 'ML',
                                published: editingCategory?.published ?? true,
                            }}
                            onSubmit={handleUpdate}
                            successMessage="Category updated successfully!"
                            errorMessage="Failed to update category"
                            submitButtonText={isUpdating ? 'Updating...' : 'Update Category'}
                            submitButtonClassName="bg-green-600 hover:bg-green-700 active:bg-green-800 text-xs font-bold h-8 px-5 shadow-2xs transition-colors"
                            showResetButton={false}
                        >
                            <div className="space-y-4 text-xs">
                                <FormInput
                                    name="categoryName"
                                    label="Category Name"
                                    placeholder="e.g., Oriental Attar"
                                    required
                                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                                />

                                <CustomSizeAdder
                                    addToOptions={(val) => setSizeOptions((prev) => uniqKeepTyped([...prev, val]))}
                                />

                                <div className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 max-h-40 overflow-y-auto">
                                    <FormCheckboxGroup
                                        name="sizes"
                                        label="Select Applicable Sizes"
                                        options={sizeCheckboxOptions}
                                    />
                                </div>

                                <CustomUnitAdder
                                    addToOptions={(val) => setUnitOptions((prev) => uniqKeepTyped([...prev, val]))}
                                />

                                <FormInput
                                    name="unit"
                                    label="Default Measurement Unit"
                                    type="select"
                                    required
                                    options={unitSelectOptions}
                                    inputClassName="border-gray-300 text-xs h-8 bg-white"
                                />

                                <div>
                                    <label className="text-xs font-semibold text-gray-700">
                                        Category Thumbnail
                                    </label>
                                    <div className="mt-1 border-2 border-dashed border-gray-300 hover:border-green-600 transition-colors rounded-lg p-4 text-center bg-gray-50/40">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="edit-category-image"
                                        />
                                        <label htmlFor="edit-category-image" className="cursor-pointer">
                                            <Upload className="mx-auto h-7 w-7 text-green-600" />
                                            <p className="mt-1.5 text-xs font-medium text-gray-700">Drop file or click to update</p>
                                            <p className="text-[10px] text-gray-400">JPG, PNG or WebP (Max 25MB)</p>
                                        </label>
                                    </div>

                                    {imagePreview && (
                                        <div className="mt-2.5">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                width={60}
                                                height={60}
                                                className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-2xs"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <FormCheckbox name="published" label="Publish Category" />
                                </div>
                            </div>
                        </FormWrapper>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}