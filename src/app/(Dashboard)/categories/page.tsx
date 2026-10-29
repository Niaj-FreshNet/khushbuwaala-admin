'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import {
    useGetAllCategoriesAdminQuery,
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
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { FormCheckbox } from '@/components/ReusableUI/FormCheckbox';
import { categorySchema } from '@/schemas/category.schema';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormContext } from 'react-hook-form';

// -------------------------
// Base options + helpers
// -------------------------
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
        const key = typed.toLowerCase(); // uniqueness only
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(typed);
    }
    return out;
};

// -------------------------
// Custom adders (state-aware)
// -------------------------
function CustomSizeAdder({ addToOptions }: { addToOptions: (val: string) => void }) {
    const { getValues, setValue } = useFormContext();
    const [customSize, setCustomSize] = useState('');

    return (
        <div className="mt-2">
            <label className="text-sm font-medium text-gray-700">Type size → Add</label>

            <div className="mt-1 flex gap-2">
                <Input
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="e.g. 7.5"
                    className="border-orange-400"
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
                    className="bg-orange-400 hover:bg-orange-500"
                    onClick={() => {
                        const val = customSize.trim();

                        if (!/^\d+(\.\d+)?$/.test(val)) {
                            toast.error('Enter a valid size like 0.5 / 7.5 / 10');
                            return;
                        }

                        // ✅ add into checkbox list
                        addToOptions(val);

                        // ✅ select by default
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

            <p className="text-xs text-gray-500 mt-1">Saved exactly as typed (string)</p>
        </div>
    );
}

function CustomUnitAdder({ addToOptions }: { addToOptions: (val: string) => void }) {
    const { setValue } = useFormContext();
    const [customUnit, setCustomUnit] = useState('');

    return (
        <div className="mt-2">
            <label className="text-sm font-medium text-gray-700">Type unit → Add</label>

            <div className="mt-1 flex gap-2">
                <Input
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g. ML / GM / PACKAGE"
                    className="border-orange-400"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            (e.currentTarget.nextElementSibling as HTMLButtonElement | null)?.click();
                        }
                    }}
                />

                <Button
                    type="button"
                    className="bg-orange-400 hover:bg-orange-500"
                    onClick={() => {
                        const val = customUnit.trim();
                        if (!val) return;

                        // ✅ add into select list
                        addToOptions(val);

                        // ✅ select by default
                        setValue('unit', val, { shouldDirty: true, shouldValidate: true });

                        setCustomUnit('');
                        toast.success('Unit selected');
                    }}
                >
                    Add
                </Button>
            </div>

            <p className="text-xs text-gray-500 mt-1">Saved exactly as typed</p>
        </div>
    );
}

// -------------------------
// Main component
// -------------------------
export default function CategoryList() {
    const { data, isLoading } = useGetAllCategoriesAdminQuery();
    const [deleteCategory] = useDeleteCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const router = useRouter();

    const allCategories = data?.data?.data || [];

    const [filteredCategories, setFilteredCategories] = useState(allCategories);
    const [searchTerm, setSearchTerm] = useState('');

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // ✅ options in STATE (so we can add dynamically)
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

    useEffect(() => {
        if (searchTerm) {
            const filtered = allCategories.filter((cat: any) =>
                String(cat.categoryName || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories(allCategories);
        }
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

    const handleEdit = (category: any) => {
        setEditingCategory(category);
        setEditModalOpen(true);

        setImagePreview(category.imageUrl || null);
        setImageFile(null);

        // ✅ include existing custom sizes/unit into options list
        const existingSizes = (category?.sizes || []).map((s: any) => String(s).trim());
        const existingUnit = category?.unit ? [String(category.unit).trim()] : [];

        setSizeOptions(uniqKeepTyped([...BASE_SIZES, ...existingSizes]));
        setUnitOptions(uniqKeepTyped([...BASE_UNITS, ...existingUnit]));
    };

    const handleUpdate = async (form: z.infer<typeof categorySchema>) => {
        try {
            if (!editingCategory?.id) return;

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
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isValidType = ['image/jpeg', 'image/png'].includes(file.type);
        const isValidSize = file.size <= 25 * 1024 * 1024;

        if (!isValidType) return toast.error('Only JPG/PNG files are allowed!');
        if (!isValidSize) return toast.error('Image must be smaller than 25MB!');

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-64">
                    <Input
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-orange-400"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                </div>

                <Link href="/dashboard/categories/add">
                    <Button className="bg-orange-400 hover:bg-orange-500">
                        <Plus className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                </Link>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Sizes</TableHead>
                        <TableHead>Publish</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-10 w-16 rounded" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                                <TableCell className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        filteredCategories.map((category: any) => (
                            <TableRow key={category.id}>
                                <TableCell className="capitalize">
                                    {String(category.categoryName || '')}
                                </TableCell>

                                <TableCell>
                                    <Image
                                        src={category.imageUrl || '/placeholder.svg'}
                                        alt="Category"
                                        width={60}
                                        height={40}
                                        className="rounded object-cover"
                                    />
                                </TableCell>

                                <TableCell>
                                    {(category.sizes || [])
                                        .map((size: string) => `${size} ${category.unit || ''}`)
                                        .join(', ')}
                                </TableCell>

                                <TableCell>
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
                                    />
                                </TableCell>

                                <TableCell>
                                    <Button variant="ghost" onClick={() => handleEdit(category)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-red-600"
                                        onClick={() => handleDelete(category.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Edit Modal */}
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
                <DialogContent className="sm:max-w-[600px] p-0">
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-orange-400">Edit Category</DialogTitle>
                    </DialogHeader>

                    <div className="px-6 pb-6 max-h-[80vh] overflow-y-auto">

                        <FormWrapper
                            resolver={zodResolver(categorySchema)}
                            defaultValues={{
                                categoryName: editingCategory?.categoryName || '',
                                sizes: editingCategory?.sizes || [],
                                unit: editingCategory?.unit || unitOptions[0] || 'ML',
                                published: editingCategory?.published || false,
                            }}
                            onSubmit={handleUpdate}
                            onReset={() => {
                                setEditModalOpen(false);
                                setImageFile(null);
                                setImagePreview(null);
                            }}
                            errorMessage="Failed to update category"
                            submitButtonText={isUpdating ? 'Updating...' : 'Update Category'}
                            resetButtonText="Reset"
                            submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                            resetButtonClassName="border-orange-400 text-orange-400"
                        >
                            <FormInput
                                name="categoryName"
                                label="Category Name"
                                placeholder="e.g., Floral, Woody"
                                required
                                inputClassName="border-orange-400"
                            />

                            <CustomSizeAdder
                                addToOptions={(val) => setSizeOptions((prev) => uniqKeepTyped([...prev, val]))}
                            />

                            <FormCheckboxGroup
                                name="sizes"
                                label="Sizes"
                                options={sizeCheckboxOptions}
                            />

                            <CustomUnitAdder
                                addToOptions={(val) => setUnitOptions((prev) => uniqKeepTyped([...prev, val]))}
                            />

                            <FormInput
                                name="unit"
                                label="Unit"
                                type="select"
                                required
                                options={unitSelectOptions}
                                inputClassName="border-orange-400 focus:ring-orange-300"
                            />

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Category Image <span className="text-red-500">*</span>
                                </label>

                                <div className="mt-1 border-2 border-dashed border-orange-400 rounded-md p-4 text-center">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        id="edit-category-image"
                                    />
                                    <label htmlFor="edit-category-image" className="cursor-pointer">
                                        <Upload className="mx-auto h-8 w-8 text-orange-400" />
                                        <p className="mt-2 text-sm text-gray-600">Drop file or click to upload</p>
                                        <p className="text-xs text-gray-500">JPG/PNG, Max: 25MB</p>
                                    </label>
                                </div>

                                {imagePreview && (
                                    <div className="mt-4">
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            width={80}
                                            height={80}
                                            className="max-h-20 rounded"
                                        />
                                    </div>
                                )}
                            </div>

                            <FormCheckbox name="published" label="Published" />
                        </FormWrapper>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
