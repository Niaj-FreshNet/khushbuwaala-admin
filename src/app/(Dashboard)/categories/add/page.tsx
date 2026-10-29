'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateCategoryMutation } from '@/redux/store/api/category/categoryApi';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';
import { FormCheckbox } from '@/components/ReusableUI/FormCheckbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { categorySchema } from '@/schemas/category.schema';
import { FormCheckboxGroup } from '@/components/ReusableUI/FormCheckboxGroup';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const BASE_SIZES = [
    "0.5", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13",
    "15", "18", "20", "25", "30", "45", "50", "60", "75", "100",
    "125", "200", "250", "300", "450", "500", "1000",
];

const BASE_UNITS = [
    'ML', 'GM', 'TOLA', 'OUNCE', 'PIECE', 'PACKAGE',
    'SET', 'BOX', 'GIFT', 'CAN', 'BOTTLE', 'CARTON', 'BAG'
];

function normalizeUniqueKeepTyped(list: string[]) {
    // uniqueness check using a normalized key, but KEEP original typed value
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of list) {
        const typed = item.trim();
        const key = typed.toLowerCase(); // only for uniqueness check
        if (!typed) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(typed);
    }
    return out;
}

export default function AddCategoryPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [addCategory, { isLoading }] = useCreateCategoryMutation();
    const router = useRouter();

    // ✅ OPTIONS IN STATE (this is the key)
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const isValidType = ['image/jpeg', 'image/png'].includes(selectedFile.type);
            const isValidSize = selectedFile.size <= 25 * 1024 * 1024;
            if (!isValidType) return toast.error('Only JPG/PNG files are allowed!');
            if (!isValidSize) return toast.error('Image must be smaller than 25MB!');
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const onSubmit = async (data: z.infer<typeof categorySchema>) => {
        if (!file) return toast.error('Please upload an image');

        try {
            const formData = new FormData();
            formData.append('categoryName', data.categoryName);
            formData.append('image', file);
            formData.append('published', data.published.toString());

            // ✅ DO NOT lowercase sizes
            formData.append('sizes', JSON.stringify((data.sizes || []).map((s) => String(s).trim())));

            // ✅ unit as typed
            formData.append('unit', String(data.unit).trim());

            await addCategory(formData).unwrap();
            router.push('/dashboard/categories');
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error("Failed to add category");
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                        Add Perfume Category
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    <FormWrapper
                        resolver={zodResolver(categorySchema)}
                        defaultValues={{
                            categoryName: '',
                            sizes: [],
                            unit: unitOptions[0] || 'ML',
                            published: true,
                        }}
                        onSubmit={onSubmit}
                        errorMessage="Failed to add category"
                        submitButtonText={isLoading ? "Adding..." : "Add Category"}
                        submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                        resetButtonClassName="border-orange-400 text-orange-400"
                    >
                        <FormInput
                            name="categoryName"
                            label="Category Name"
                            placeholder="e.g., Floral, Woody"
                            required
                            inputClassName="border-orange-400 focus:ring-orange-300"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ✅ Custom size adds to list and selects by default */}
                            <SizeAndUnitManagers
                                sizeOptions={sizeOptions}
                                setSizeOptions={setSizeOptions}
                                unitOptions={unitOptions}
                                setUnitOptions={setUnitOptions}
                                sizeCheckboxOptions={sizeCheckboxOptions}
                                unitSelectOptions={unitSelectOptions}
                            />
                        </div>

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
                                    id="category-image"
                                />
                                <label htmlFor="category-image" className="cursor-pointer">
                                    <Upload className="mx-auto h-8 w-8 text-orange-400" />
                                    <p className="mt-2 text-sm text-gray-600">Drop file or click to upload</p>
                                    <p className="text-xs text-gray-500">JPG/PNG, Max: 25MB</p>
                                </label>
                            </div>

                            {preview && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-500">Preview:</p>
                                    <Image
                                        src={preview}
                                        alt="Preview"
                                        width={192}
                                        height={192}
                                        className="mt-1 max-h-48 rounded border border-gray-200 shadow"
                                    />
                                </div>
                            )}
                        </div>

                        <FormCheckbox name="published" label="Published" />
                    </FormWrapper>
                </CardContent>
            </Card>
        </div>
    );
}

function SizeAndUnitManagers(props: {
    sizeOptions: string[];
    setSizeOptions: React.Dispatch<React.SetStateAction<string[]>>;
    unitOptions: string[];
    setUnitOptions: React.Dispatch<React.SetStateAction<string[]>>;
    sizeCheckboxOptions: { label: string; value: string }[];
    unitSelectOptions: { label: string; value: string }[];
}) {
    const { setValue, getValues } = useFormContext();

    const addSizeToOptionsAndSelect = (val: string) => {
        // ✅ add to options list if new (case-insensitive), keep typed
        props.setSizeOptions((prev) => normalizeUniqueKeepTyped([...prev, val]));

        // ✅ select by default (checkbox)
        const current: string[] = getValues("sizes") || [];
        if (!current.includes(val)) {
            setValue("sizes", [...current, val], { shouldDirty: true, shouldValidate: true });
        }
    };

    const addUnitToOptionsAndSelect = (val: string) => {
        props.setUnitOptions((prev) => normalizeUniqueKeepTyped([...prev, val]));
        setValue("unit", val, { shouldDirty: true, shouldValidate: true });
    };

    return (
        <>
            {/* Sizes */}
            <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Type size → Add</label>
                <div className="mt-2">
                    <TypedAddSize onAdd={addSizeToOptionsAndSelect} />
                </div>

                <FormCheckboxGroup
                    name="sizes"
                    label="Sizes"
                    options={props.sizeCheckboxOptions}
                />
            </div>

            <TypedAddUnit onAdd={addUnitToOptionsAndSelect} />

            {/* Unit */}
            <div className="md:col-span-2">
                <FormInput
                    name="unit"
                    label="Unit"
                    type="select"
                    required
                    options={props.unitSelectOptions}
                    inputClassName="border-orange-400 focus:ring-orange-300"
                />
            </div>
        </>
    );
}

function TypedAddSize({ onAdd }: { onAdd: (val: string) => void }) {
    const [v, setV] = useState("");
    return (
        <div className="flex gap-2">
            <Input
                value={v}
                onChange={(e) => setV(e.target.value)}
                placeholder="e.g. 7.5"
                className="border-orange-400"
                inputMode="decimal"
            />
            <Button
                type="button"
                className="mt-2 bg-orange-400 hover:bg-orange-500"
                onClick={() => {
                    const val = v.trim();
                    if (!/^\d+(\.\d+)?$/.test(val)) {
                        toast.error("Enter a valid size like 0.5 / 7.5 / 10");
                        return;
                    }
                    onAdd(val);
                    setV("");
                }}
            >
                Add
            </Button>
        </div>
    );
}

function TypedAddUnit({ onAdd }: { onAdd: (val: string) => void }) {
    const [v, setV] = useState("");
    return (
        <div className="mt-2 flex gap-2">
            <Input
                value={v}
                onChange={(e) => setV(e.target.value)}
                placeholder="e.g. ML / GM / PIECE"
                className="border-orange-400"
            />
            <Button
                type="button"
                className="bg-orange-400 hover:bg-orange-500"
                onClick={() => {
                    const val = v.trim();
                    if (!val) return;
                    onAdd(val);
                    setV("");
                    toast.success("Unit selected");
                }}
            >
                Add
            </Button>
        </div>
    );
}
