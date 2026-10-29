'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    useGetUserByIdQuery,
    useUpdateUserProfileMutation,
} from '@/redux/store/api/user/userApi';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: rawUser, isLoading, isError } = useGetUserByIdQuery(id, {
        skip: !id,
    });

    // Handles both wrapped and unwrapped response shapes safely
    const user = rawUser?.data ? rawUser.data : rawUser;

    const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    const handleRoleToggle = async () => {
        if (!user) return;
        const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        const confirmChange = window.confirm(
            `Are you sure you want to change this customer's role to ${nextRole}?`
        );

        if (confirmChange) {
            try {
                await updateUser({
                    id: user.id || id,
                    updates: { role: nextRole },
                }).unwrap();
                toast.success(`Role updated to ${nextRole}`);
            } catch (err: any) {
                toast.error(err?.data?.message || 'Failed to update role');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-9 w-32" />
                    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                            <Skeleton className="h-14 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !user || !user.id) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/customer-list')}
                        className="mb-4 gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Customers
                    </Button>
                    <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
                        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            The customer account you are looking for does not exist or could not be loaded.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const initials = user.name
        ? user.name
            .split(' ')
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()
        : 'U';

    const isGuest = user.email?.includes('khushbuwaala.local');

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Navigation Breadcrumb / Top Bar */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/customer-list')}
                        className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Customer List
                    </Button>

                    {user.role !== 'SUPER_ADMIN' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRoleToggle}
                            disabled={isUpdating}
                            className="border-[#FB923C] text-[#FB923C] hover:bg-[#FB923C]/10 text-xs"
                        >
                            {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                        </Button>
                    )}
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {user.imageUrl ? (
                            <Image
                                src={user.imageUrl}
                                alt={user.name || 'User'}
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-full object-cover ring-2 ring-[#FB923C]/30"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-orange-100 text-[#FB923C] font-bold text-2xl flex items-center justify-center ring-2 ring-[#FB923C]/20">
                                {initials}
                            </div>
                        )}

                        <div className="text-center sm:text-left flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {user.name || 'Unnamed Customer'}
                                </h1>
                                <span
                                    className={`inline-block self-center sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'SUPER_ADMIN'
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : user.role === 'ADMIN'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                        }`}
                                >
                                    {user.role}
                                </span>
                            </div>

                            <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                                {isGuest ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-500 font-medium border border-gray-200">
                                        Guest Account
                                    </span>
                                ) : (
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                )}
                            </div>

                            {/* <p className="text-xs text-gray-400 mt-2 font-mono">
                                User ID: {user.id}
                            </p> */}
                        </div>
                    </div>
                </div>

                {/* Detailed Information Grid */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                    <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">
                        Account Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FB923C]">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400">Email Address</p>
                                <p className="text-sm font-medium text-gray-800 break-all">
                                    {isGuest ? 'Guest Customer (No Email)' : user.email || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Contact Number */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FB923C]">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400">Contact Number</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {user.phone || 'Not provided'}
                                </p>
                            </div>
                        </div>

                        {/* District */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FB923C]">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400">District</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {user.district || 'Not provided'}
                                </p>
                            </div>
                        </div>

                        {/* Created At */}
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FB923C]">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400">Joined On</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })
                                        : 'Not available'}
                                </p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="sm:col-span-2 flex items-start gap-3 pt-3 border-t border-gray-50">
                            <div className="p-2.5 rounded-lg bg-orange-50 text-[#FB923C]">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-400">Street Address</p>
                                <p className="text-sm font-medium text-gray-800">
                                    {user.address || 'No street address provided'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}