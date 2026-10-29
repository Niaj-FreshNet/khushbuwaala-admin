'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMaterialMutation } from '@/redux/store/api/material/materialApi';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';

const materialSchema = z.object({
    materialName: z.string().min(1, 'Material name is required'),
});

export default function AddMaterialPage() {
    const [addMaterial, { isLoading }] = useCreateMaterialMutation();
    const router = useRouter();

    const onSubmit = async (data: z.infer<typeof materialSchema>) => {
        try {
            await addMaterial({ materialName: data.materialName }).unwrap();
            router.push('/dashboard/materials');
        } catch (error) {
            console.error('Error adding material:', error);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add Perfume Material</h2>
            <FormWrapper
                resolver={zodResolver(materialSchema)}
                defaultValues={{ name: '' }}
                onSubmit={onSubmit}
                // successMessage="Material added successfully!"
                errorMessage="Failed to add material"
                submitButtonText="Add Material"
                submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                resetButtonClassName="border-orange-400 text-orange-400"
            >
                <FormInput
                    name="materialName"
                    label="Material Name"
                    placeholder="e.g., Oud, Amber, Sandalwood"
                    required
                    inputClassName="border-orange-400 focus:ring-orange-300"
                />
            </FormWrapper>
        </div>
    );
}