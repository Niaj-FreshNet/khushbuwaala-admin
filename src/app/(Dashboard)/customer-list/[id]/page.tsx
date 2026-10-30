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
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: rawUser, isLoading, isError } = useGetUserByIdQuery(id, {
        skip: !id,
    });

    const user = rawUser?.data ? rawUser.data : rawUser;
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

    const handleRoleToggle = async () => {
        if (!user) return;
        const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (window.confirm(`Change role to ${nextRole}?`)) {
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
            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
                <Skeleton className="h-8 w-28" />
                <div className="bg-white p-5 rounded-lg border space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <div className="space-y-1.5"><Skeleton className="h-5 w-40" /><Skeleton className="h-3.5 w-24" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !user || !user.id) {
        return (
            <div className="p-4 md:p-6 max-w-4xl mx-auto text-center space-y-4">
                <Button variant="ghost" onClick={() => router.push('/customer-list')} className="gap-1.5 text-xs">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
                </Button>
                <div className="bg-white p-8 rounded-lg border shadow-xs">
                    <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-2" />
                    <h2 className="font-semibold text-gray-800">User Not Found</h2>
                </div>
            </div>
        );
    }

    const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
    const isGuest = user.email?.includes('khushbuwaala.local');

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4 text-sm bg-gray-50/50 min-h-screen">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border shadow-xs">
                <Button variant="ghost" size="sm" onClick={() => router.push('/customer-list')} className="gap-1.5 text-xs text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to List
                </Button>

                {user.role !== 'SUPER_ADMIN' && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRoleToggle}
                        disabled={isUpdating}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs h-8"
                    >
                        {isUpdating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                    </Button>
                )}
            </div>

            {/* Profile Overview Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 flex items-center gap-4">
                {user.imageUrl ? (
                    <Image src={user.imageUrl} alt={user.name || 'User'} width={64} height={64} className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-100" />
                ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 text-[#FB923C] font-bold text-lg flex items-center justify-center">
                        {initials}
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold text-gray-900">{user.name || 'Unnamed Customer'}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                            {user.role}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{isGuest ? 'Guest Customer (No Email)' : user.email}</p>
                </div>
            </div>

            {/* Account Details Compact Grid */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-5 space-y-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2 border-b">Account Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-orange-50 text-orange-600"><Mail className="w-4 h-4" /></div>
                        <div><p className="text-gray-400">Email Address</p><p className="font-medium text-gray-800 break-all">{isGuest ? 'N/A (Guest)' : user.email || 'N/A'}</p></div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-orange-50 text-orange-600"><Phone className="w-4 h-4" /></div>
                        <div><p className="text-gray-400">Phone Number</p><p className="font-medium text-gray-800">{user.phone || 'Not provided'}</p></div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-orange-50 text-orange-600"><MapPin className="w-4 h-4" /></div>
                        <div><p className="text-gray-400">District</p><p className="font-medium text-gray-800">{user.district || 'Not provided'}</p></div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-orange-50 text-orange-600"><Calendar className="w-4 h-4" /></div>
                        <div><p className="text-gray-400">Joined On</p><p className="font-medium text-gray-800">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p></div>
                    </div>

                    <div className="sm:col-span-2 flex items-start gap-2.5 pt-2 border-t">
                        <div className="p-2 rounded bg-orange-50 text-orange-600"><MapPin className="w-4 h-4" /></div>
                        <div><p className="text-gray-400">Full Address</p><p className="font-medium text-gray-800">{user.address || 'No street address provided'}</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
}