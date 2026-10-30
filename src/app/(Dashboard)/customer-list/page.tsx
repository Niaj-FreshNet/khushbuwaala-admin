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
} from 'lucide-react';
import { useGetAllUsersQuery } from '@/redux/store/api/user/userApi';

export default function CustomerListPage() {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPage(1);
        }, 300);

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
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 text-sm bg-gray-50/50 min-h-screen">
            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-lg border shadow-xs">
                <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight">Customers</h1>
                    <p className="text-xs text-gray-500">Manage registered customer accounts and roles.</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9 text-xs border-gray-200 focus-visible:ring-[#FB923C]"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-1/4" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-7 w-20 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/80 border-b border-gray-200">
                                <TableHead className="font-semibold text-gray-600 text-xs py-3">Customer</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-xs">Phone</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-xs">Location</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-xs">Role</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-xs">Joined</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600 text-xs pr-4">Action</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-xs text-gray-500">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user: any) => {
                                    const initials = user.name
                                        ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                                        : 'U';

                                    return (
                                        <TableRow key={user.id} className="hover:bg-orange-50/20 transition-colors border-b border-gray-100">
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    {user.imageUrl ? (
                                                        <Image
                                                            src={user.imageUrl}
                                                            alt={user.name || 'User'}
                                                            width={32}
                                                            height={32}
                                                            className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FB923C] font-semibold text-xs flex items-center justify-center">
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-xs text-gray-900 truncate">{user.name || 'Unnamed User'}</p>
                                                        {user.email?.includes('khushbuwaala.local') ? (
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-gray-100 text-gray-500 font-medium">
                                                                Guest
                                                            </span>
                                                        ) : (
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]" title={user.email}>
                                                                {user.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-xs text-gray-600">
                                                {user.phone ? (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        <span>{user.phone}</span>
                                                    </div>
                                                ) : '—'}
                                            </TableCell>

                                            <TableCell className="text-xs text-gray-600">
                                                {user.district || user.address ? (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                                        <span className="truncate max-w-[130px]">
                                                            {[user.district, user.address].filter(Boolean).join(', ')}
                                                        </span>
                                                    </div>
                                                ) : '—'}
                                            </TableCell>

                                            <TableCell>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                    user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                    {user.role}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-xs text-gray-500">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </TableCell>

                                            <TableCell className="text-right pr-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => router.push(`/customer-list/${user.id}`)}
                                                    className="text-xs h-7 px-2.5 border-gray-200 hover:border-[#FB923C] hover:text-[#FB923C]"
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

                {/* Pagination Footer */}
                {meta && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 gap-3 text-xs text-gray-500 bg-white">
                        <div className="flex items-center gap-3">
                            <span>
                                Showing <span className="font-semibold text-gray-800">{meta.total > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                                <span className="font-semibold text-gray-800">{Math.min(page * limit, meta.total || 0)}</span> of{' '}
                                <span className="font-semibold text-gray-800">{meta.total || 0}</span>
                            </span>

                            <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                                <span>Rows:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(1);
                                    }}
                                    className="border border-gray-200 rounded px-1.5 py-0.5 bg-white text-gray-700 text-xs focus:ring-[#FB923C] outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || isFetching}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                className="h-7 text-xs px-2.5"
                            >
                                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                            </Button>
                            <span className="font-medium text-gray-700">Page {page} / {totalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages || isFetching}
                                onClick={() => setPage((prev) => prev + 1)}
                                className="h-7 text-xs px-2.5"
                            >
                                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}