'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    useGetUserByIdQuery,
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

export default function CustomerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const { data: rawUser, isLoading, isError } = useGetUserByIdQuery(id, {
        skip: !id,
    });

    const user = rawUser;

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-3">
                <Skeleton className="h-7 w-28" />
                <div className="bg-white p-4 rounded-xl border space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-1.5"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !user || !user.id) {
        return (
            <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 p-4 flex flex-col items-center justify-center text-xs space-y-3">
                <Button variant="ghost" onClick={() => router.push('/customer-list')} className="gap-1 text-xs">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
                </Button>
                <div className="bg-white p-6 rounded-xl border shadow-2xs text-center">
                    <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                    <h2 className="font-semibold text-gray-800 text-xs">User Not Found</h2>
                </div>
            </div>
        );
    }

    const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'U';
    const isGuest = user.email?.includes('khushbuwaala.local');

    return (
        <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col text-xs">
            {/* Top Bar */}
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/85 shadow-2xs mb-3">
                <Button variant="ghost" size="sm" onClick={() => router.push('/customer-list')} className="gap-1 text-xs text-gray-600 hover:text-gray-900 h-7 px-2">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to List
                </Button>
            </div>

            <div className="max-w-4xl w-full mx-auto space-y-3">
                {/* Profile Overview Card */}
                <div className="bg-white rounded-xl border border-gray-200/85 shadow-2xs p-4 flex items-center gap-3.5">
                    {user.imageUrl ? (
                        <Image src={user.imageUrl} alt={user.name || 'User'} width={52} height={52} className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-100 shrink-0" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-[#FB923C] font-bold text-sm flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{user.name || 'Unnamed Customer'}</h1>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                                {user.role}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">{isGuest ? 'Guest Customer (No Email)' : user.email}</p>
                    </div>
                </div>

                {/* Account Details Compact Grid */}
                <div className="bg-white rounded-xl border border-gray-200/85 shadow-2xs p-4 space-y-3">
                    <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pb-2 border-b border-gray-100">Account Information</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/60 border border-gray-100">
                            <div className="p-1.5 rounded bg-orange-50 text-orange-600 shrink-0"><Mail className="w-3.5 h-3.5" /></div>
                            <div className="min-w-0"><p className="text-[10px] text-gray-400">Email Address</p><p className="font-medium text-gray-800 truncate">{isGuest ? 'N/A (Guest)' : user.email || 'N/A'}</p></div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/60 border border-gray-100">
                            <div className="p-1.5 rounded bg-orange-50 text-orange-600 shrink-0"><Phone className="w-3.5 h-3.5" /></div>
                            <div className="min-w-0"><p className="text-[10px] text-gray-400">Phone Number</p><p className="font-medium text-gray-800 truncate">{user.phone || 'Not provided'}</p></div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/60 border border-gray-100">
                            <div className="p-1.5 rounded bg-orange-50 text-orange-600 shrink-0"><MapPin className="w-3.5 h-3.5" /></div>
                            <div className="min-w-0"><p className="text-[10px] text-gray-400">District</p><p className="font-medium text-gray-800 truncate">{user.district || 'Not provided'}</p></div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/60 border border-gray-100">
                            <div className="p-1.5 rounded bg-orange-50 text-orange-600 shrink-0"><Calendar className="w-3.5 h-3.5" /></div>
                            <div className="min-w-0"><p className="text-[10px] text-gray-400">Joined On</p><p className="font-medium text-gray-800 truncate">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p></div>
                        </div>

                        <div className="sm:col-span-2 flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/60 border border-gray-100">
                            <div className="p-1.5 rounded bg-orange-50 text-orange-600 shrink-0 mt-0.5"><MapPin className="w-3.5 h-3.5" /></div>
                            <div className="min-w-0"><p className="text-[10px] text-gray-400">Full Address</p><p className="font-medium text-gray-800 leading-relaxed">{user.address || 'No street address provided'}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}