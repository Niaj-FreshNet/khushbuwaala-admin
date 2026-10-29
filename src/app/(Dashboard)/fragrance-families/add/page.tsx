'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateFragranceMutation } from '@/redux/store/api/fragrance/fragranceApi';
import FormWrapper from '@/components/ReusableUI/FormWrapper';
import FormInput from '@/components/ReusableUI/FormInput';

const fragranceSchema = z.object({
    fragranceName: z.string().min(1, 'Fragrance name is required'),
});

export default function AddFragrancePage() {
    const [addFragrance, { isLoading }] = useCreateFragranceMutation();
    const router = useRouter();

    const onSubmit = async (data: z.infer<typeof fragranceSchema>) => {
        try {
            await addFragrance({ fragranceName: data.fragranceName }).unwrap();
            router.push('/dashboard/fragrance-families');
        } catch (error) {
            console.error('Error adding fragrance:', error);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add Perfume Fragrance</h2>
            <FormWrapper
                resolver={zodResolver(fragranceSchema)}
                defaultValues={{ name: '' }}
                onSubmit={onSubmit}
                // successMessage="Fragrance added successfully!"
                errorMessage="Failed to add fragrance"
                submitButtonText="Add Fragrance"
                submitButtonClassName="bg-orange-400 hover:bg-orange-500"
                resetButtonClassName="border-orange-400 text-orange-400"
            >
                <FormInput
                    name="fragranceName"
                    label="Fragrance Name"
                    placeholder="e.g., Oud, Amber, Sandalwood"
                    required
                    inputClassName="border-orange-400 focus:ring-orange-300"
                />
            </FormWrapper>
        </div>
    );
}