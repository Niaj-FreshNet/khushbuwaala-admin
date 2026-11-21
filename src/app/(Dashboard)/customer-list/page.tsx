/* eslint-disable @typescript-eslint/no-explicit-any */
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
    Users,
} from 'lucide-react';
import { MobileCard, MobileCardList, MobileField } from '@/components/admin/MobileCards';
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
        <div className="w-full min-h-[calc(100vh-60px)] bg-gray-50/50 px-3 sm:px-4 py-2.5 flex flex-col text-xs">
            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/85 shadow-2xs shrink-0 mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg text-orange-700 border border-orange-100">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Customers Management</h1>
                        <p className="text-[10px] text-gray-500">Manage registered customer accounts and system roles</p>
                    </div>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 border-gray-300 text-xs h-7 bg-white focus-visible:ring-[#FB923C]"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="rounded-xl border border-gray-200/85 bg-white overflow-hidden shadow-2xs">
                {/* PHONE: cards */}
                <MobileCardList
                    className="bg-gray-50/60 p-2"
                    isLoading={isLoading}
                    isEmpty={!isLoading && users.length === 0}
                    emptyText="No customers found."
                >
                    {users.map((user: any) => (
                        <MobileCard
                            key={user.id}
                            onOpen={() => router.push(`/customer-list/${user.id}`)}
                            title={user.name || 'Unnamed User'}
                            subtitle={user.email?.includes('khushbuwaala.local') ? 'Guest customer' : user.email}
                            badge={<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">{user.role}</span>}
                            actions={
                                <>
                                    {user.phone && (
                                        <a href={`tel:${user.phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-md border border-green-200 bg-green-50 text-xs font-semibold text-green-700">
                                            <Phone className="h-4 w-4" /> Call
                                        </a>
                                    )}
                                    <Button variant="outline" size="sm" className="h-10 flex-1 text-xs" onClick={() => router.push(`/customer-list/${user.id}`)}>
                                        View
                                    </Button>
                                </>
                            }
                        >
                            <MobileField label="Phone">{user.phone || '—'}</MobileField>
                            <MobileField label="Joined">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</MobileField>
                            {(user.district || user.address) && (
                                <MobileField label="Address" full>{[user.district, user.address].filter(Boolean).join(', ')}</MobileField>
                            )}
                        </MobileCard>
                    ))}
                </MobileCardList>

                {/* DESKTOP: table */}
                <div className="hidden md:block overflow-x-auto w-full">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-1/4" />
                                        <Skeleton className="h-2.5 w-1/3" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-7 w-20 rounded" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-gray-50/80">
                                <TableRow>
                                    <TableHead className="text-[11px] font-bold text-gray-700 py-2.5">Customer</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700">Phone</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700">Location</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700">Role</TableHead>
                                    <TableHead className="text-[11px] font-bold text-gray-700">Joined</TableHead>
                                    <TableHead className="text-right text-[11px] font-bold text-gray-700 pr-4">Action</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-xs text-gray-500">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user: any) => {
                                        const initials = user.name
                                            ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                                            : 'U';
                                        const isGuest = user.email?.includes('khushbuwaala.local');

                                        return (
                                            <TableRow key={user.id} className="hover:bg-orange-50/20 transition-colors border-b border-gray-100">
                                                <TableCell className="py-2">
                                                    <div className="flex items-center gap-2.5">
                                                        {user.imageUrl ? (
                                                            <Image
                                                                src={user.imageUrl}
                                                                alt={user.name || 'User'}
                                                                width={30}
                                                                height={30}
                                                                className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-orange-100 text-[#FB923C] font-bold text-[10px] flex items-center justify-center shrink-0">
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate text-xs">{user.name || 'Unnamed User'}</p>
                                                            {isGuest ? (
                                                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-gray-100 text-gray-500 font-medium">
                                                                    Guest
                                                                </span>
                                                            ) : (
                                                                <p className="text-[10px] text-gray-400 truncate max-w-[160px]" title={user.email}>
                                                                    {user.email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="text-xs text-gray-600 py-2">
                                                    {user.phone ? (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-gray-400" />
                                                            <span>{user.phone}</span>
                                                        </div>
                                                    ) : '—'}
                                                </TableCell>

                                                <TableCell className="text-xs text-gray-600 py-2">
                                                    {user.district || user.address ? (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                                            <span className="truncate max-w-[130px]">
                                                                {[user.district, user.address].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                    ) : '—'}
                                                </TableCell>

                                                <TableCell className="py-2">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                                        user.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                        user.role === 'ADMIN' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-gray-100 text-gray-600 border-gray-200'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="text-[11px] text-gray-500 py-2 whitespace-nowrap">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </TableCell>

                                                <TableCell className="text-right pr-4 py-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => router.push(`/customer-list/${user.id}`)}
                                                        className="text-xs h-6 px-2.5 border-gray-200 hover:border-[#FB923C] hover:text-[#FB923C]"
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
                </div>
            </div>

            {/* Pagination Footer */}
            {meta && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-1 pt-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>
                            Showing <span className="font-semibold text-gray-800">{meta.total > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
                            <span className="font-semibold text-gray-800">{Math.min(page * limit, meta.total || 0)}</span> of{' '}
                            <span className="font-semibold text-gray-800">{meta.total || 0}</span>
                        </span>

                        <div className="flex items-center gap-1.5 border-l border-gray-200 pl-2">
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
                            className="h-7 text-xs px-2.5 border-gray-300"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                        </Button>
                        <span className="font-medium text-gray-700 text-xs">Page {page} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isFetching}
                            onClick={() => setPage((prev) => prev + 1)}
                            className="h-7 text-xs px-2.5 border-gray-300"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}