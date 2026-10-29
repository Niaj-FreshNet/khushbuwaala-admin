'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    Phone,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
} from 'lucide-react';
import { useGetAllUsersQuery } from '@/redux/store/api/user/userApi';

export default function CustomerListPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search query so backend isn't spammed on every keypress
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1); // Reset back to page 1 on new search
        }, 400);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const { data, isLoading, isFetching } = useGetAllUsersQuery({
        page,
        limit,
        searchTerm: debouncedSearch || undefined,
    });

    const users = data?.data || [];
    const meta = data?.meta;
    const totalPages = meta?.totalPage || Math.ceil((meta?.total || 0) / limit) || 1;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Customers
                        </h1>
                        <p className="text-sm text-gray-500">
                            Manage all registered customer accounts and their details.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-white border-gray-200 focus-visible:ring-[#FB923C] focus-visible:border-[#FB923C]"
                            />
                        </div>
                    </div>
                </div>

                {/* Customer Table Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-24 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/75 border-b border-gray-200">
                                    <TableHead className="font-semibold text-gray-700 py-3.5">Customer</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Location</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Role</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Joined</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-700 pr-6">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user: any) => {
                                        const initials = user.name
                                            ? user.name
                                                .split(' ')
                                                .map((n: string) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase()
                                            : 'U';

                                        return (
                                            <TableRow
                                                key={user.id}
                                                className="hover:bg-orange-50/20 transition-colors border-b border-gray-100"
                                            >
                                                {/* Avatar & Name */}
                                                <TableCell className="py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {user.imageUrl ? (
                                                            <Image
                                                                src={user.imageUrl}
                                                                alt={user.name || 'User'}
                                                                width={36}
                                                                height={36}
                                                                className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-orange-100 text-[#FB923C] font-semibold text-xs flex items-center justify-center">
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-medium text-gray-900 leading-snug">
                                                                {user.name || 'Unnamed User'}
                                                            </p>
                                                            {user.email?.includes('khushbuwaala.local') ? (
                                                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] bg-gray-100 text-gray-500 font-medium border border-gray-200">
                                                                    Guest User
                                                                </span>
                                                            ) : (
                                                                <p
                                                                    className="text-xs text-gray-400 max-w-50 truncate"
                                                                    title={user.email}
                                                                >
                                                                    {user.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Phone */}
                                                <TableCell>
                                                    {user.phone ? (
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{user.phone}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Location */}
                                                <TableCell>
                                                    {user.district || user.address ? (
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            <span className="truncate max-w-[150px]">
                                                                {[user.district, user.address].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Role */}
                                                <TableCell>
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'SUPER_ADMIN'
                                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                            : user.role === 'ADMIN'
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                                            }`}
                                                    >
                                                        {user.role}
                                                    </span>
                                                </TableCell>

                                                {/* Date Joined */}
                                                <TableCell className="text-sm text-gray-500">
                                                    {user.createdAt
                                                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })
                                                        : '—'}
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right pr-6">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/dashboard/customer-list/${user.id}`)}
                                                        className="text-xs h-8 border-gray-200 hover:border-[#FB923C] hover:text-[#FB923C]"
                                                    >
                                                        Details
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination Controls */}
                    {meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 gap-4">
                            {/* Rows Per Page & Item Count */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                    Showing{' '}
                                    <span className="font-semibold text-gray-800">
                                        {meta.total > 0 ? (page - 1) * limit + 1 : 0}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-semibold text-gray-800">
                                        {Math.min(page * limit, meta.total || 0)}
                                    </span>{' '}
                                    of <span className="font-semibold text-gray-800">{meta.total || 0}</span> customers
                                </span>

                                <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                                    <span>Per page:</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        className="border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 text-xs focus:ring-[#FB923C] focus:border-[#FB923C] outline-none"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>

                            {/* Prev / Page / Next */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1 || isFetching}
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    className="h-8 gap-1 border-gray-200 text-xs hover:border-[#FB923C] hover:text-[#FB923C]"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Previous
                                </Button>

                                <span className="text-xs font-medium text-gray-600 px-2">
                                    Page {page} of {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages || isFetching}
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="h-8 gap-1 border-gray-200 text-xs hover:border-[#FB923C] hover:text-[#FB923C]"
                                >
                                    Next
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}