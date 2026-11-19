/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    useGetAllProductsAdminQuery,
    useQuickUpdateCellMutation,
} from '@/redux/store/api/product/productApi';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Search,
    Filter,
    Palette,
    Download,
    Check,
    Loader2,
    AlertCircle,
    SlidersHorizontal,
    Grid3X3,
    ListTree,
    X,
    RotateCcw,
    Eye,
    EyeOff,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// ==========================================
// 🎨 THEME DEFINITIONS
// ==========================================
type SheetThemeKey = 'sheets' | 'emerald' | 'dark' | 'royal';

interface SheetTheme {
    name: string;
    wrapper: string;
    toolbar: string;
    headerBg: string;
    headerText: string;
    rowEven: string;
    rowOdd: string;
    rowHover: string;
    border: string;
    stickyBg: string;
    activeCellRing: string;
    textPrimary: string;
    textMuted: string;
    badgeBg: string;
}

const SHEET_THEMES: Record<SheetThemeKey, SheetTheme> = {
    sheets: {
        name: 'Google Sheets Classic',
        wrapper: 'bg-[#f8f9fa] text-gray-900',
        toolbar: 'bg-white border-gray-300',
        headerBg: 'bg-[#f1f3f4]',
        headerText: 'text-gray-700',
        rowEven: 'bg-white',
        rowOdd: 'bg-[#fcfdfd]',
        rowHover: 'hover:bg-[#e8f0fe]/60',
        border: 'border-gray-300',
        stickyBg: 'bg-white',
        activeCellRing: 'ring-2 ring-[#1a73e8] bg-white z-30',
        textPrimary: 'text-gray-900',
        textMuted: 'text-gray-500',
        badgeBg: 'bg-gray-100 text-gray-700 border-gray-300',
    },
    emerald: {
        name: 'Khushbuwaala Emerald',
        wrapper: 'bg-emerald-50/30 text-gray-900',
        toolbar: 'bg-white border-emerald-200',
        headerBg: 'bg-emerald-900',
        headerText: 'text-emerald-50',
        rowEven: 'bg-white',
        rowOdd: 'bg-emerald-50/25',
        rowHover: 'hover:bg-emerald-100/50',
        border: 'border-emerald-200/90',
        stickyBg: 'bg-white',
        activeCellRing: 'ring-2 ring-emerald-600 bg-emerald-50/40 z-30',
        textPrimary: 'text-gray-900',
        textMuted: 'text-emerald-700/70',
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    dark: {
        name: 'Midnight Pro (Dark)',
        wrapper: 'bg-[#0f1117] text-gray-100',
        toolbar: 'bg-[#161922] border-gray-800',
        headerBg: 'bg-[#1c202b]',
        headerText: 'text-gray-200',
        rowEven: 'bg-[#13161f]',
        rowOdd: 'bg-[#171b26]',
        rowHover: 'hover:bg-indigo-950/50',
        border: 'border-gray-800',
        stickyBg: 'bg-[#13161f]',
        activeCellRing: 'ring-2 ring-indigo-500 bg-[#1e2330] z-30',
        textPrimary: 'text-gray-100',
        textMuted: 'text-gray-400',
        badgeBg: 'bg-gray-800 text-gray-300 border-gray-700',
    },
    royal: {
        name: 'Amber Gold Atelier',
        wrapper: 'bg-amber-50/30 text-stone-900',
        toolbar: 'bg-white border-amber-200',
        headerBg: 'bg-stone-900',
        headerText: 'text-amber-200',
        rowEven: 'bg-white',
        rowOdd: 'bg-amber-50/20',
        rowHover: 'hover:bg-amber-100/50',
        border: 'border-amber-200/80',
        stickyBg: 'bg-white',
        activeCellRing: 'ring-2 ring-amber-600 bg-amber-50/40 z-30',
        textPrimary: 'text-stone-900',
        textMuted: 'text-stone-500',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    },
};

type DensityMode = 'ultra' | 'compact' | 'comfortable';
type ViewMode = 'matrix' | 'flat';
type SortField = 'name' | 'category' | 'stock' | 'minPrice' | 'salesCount' | string;
type SortOrder = 'asc' | 'desc';

interface EditingCell {
    rowKey: string;
    colKey: string;
    entity: 'PRODUCT' | 'VARIANT';
    id: string;
    field: string;
    initialValue: string | number;
}

// ==========================================
// ⚡ EDITABLE SPREADSHEET CELL COMPONENT
// ==========================================
const EditableSheetCell = ({
    value,
    displayPrefix = '',
    displaySuffix = '',
    type = 'number',
    isEditing,
    saveState,
    theme,
    densityClass,
    align = 'right',
    disabled = false,
    onStartEdit,
    onCommit,
    onCancel,
    onNavigate,
}: {
    value: string | number | null | undefined;
    displayPrefix?: string;
    displaySuffix?: string;
    type?: 'number' | 'text';
    isEditing: boolean;
    saveState?: 'saving' | 'saved' | 'error';
    theme: SheetTheme;
    densityClass: string;
    align?: 'left' | 'right' | 'center';
    disabled?: boolean;
    onStartEdit: () => void;
    onCommit: (newVal: string | number) => void;
    onCancel: () => void;
    onNavigate: (direction: 'down' | 'up' | 'right' | 'left') => void;
}) => {
    const [draft, setDraft] = useState<string>(value !== null && value !== undefined ? String(value) : '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            setDraft(value !== null && value !== undefined ? String(value) : '');
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [isEditing, value]);

    const handleCommit = (navAfter?: 'down' | 'up' | 'right' | 'left') => {
        const trimmed = draft.trim();
        const parsed = type === 'number' ? (trimmed === '' ? 0 : Number(trimmed)) : trimmed;

        if (type === 'number' && Number.isNaN(parsed)) {
            toast.error('Please enter a valid number');
            onCancel();
            return;
        }

        if (String(parsed) !== String(value ?? '')) {
            onCommit(parsed);
        } else {
            onCancel();
        }

        if (navAfter) {
            onNavigate(navAfter);
        }
    };

    if (disabled) {
        return (
            <div
                className={cn(
                    'w-full h-full flex items-center px-2 select-none opacity-35',
                    densityClass,
                    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
                )}
            >
                —
            </div>
        );
    }

    return (
        <div
            onClick={() => !isEditing && onStartEdit()}
            className={cn(
                'relative w-full flex items-center cursor-cell transition-colors duration-150 select-none group',
                densityClass,
                isEditing && theme.activeCellRing,
                saveState === 'saved' && 'bg-emerald-500/20 transition-colors duration-700',
                saveState === 'error' && 'bg-rose-500/20 ring-1 ring-rose-500'
            )}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    type={type === 'number' ? 'number' : 'text'}
                    step={type === 'number' ? 'any' : undefined}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => handleCommit()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCommit(e.shiftKey ? 'up' : 'down');
                        } else if (e.key === 'Tab') {
                            e.preventDefault();
                            handleCommit(e.shiftKey ? 'left' : 'right');
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            onCancel();
                        }
                    }}
                    className={cn(
                        'w-full h-full px-1.5 text-xs font-bold outline-none bg-transparent',
                        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
                        theme.textPrimary
                    )}
                />
            ) : (
                <div
                    className={cn(
                        'w-full px-2 flex items-center gap-1 truncate text-xs',
                        align === 'right' ? 'justify-end font-mono font-semibold' : align === 'center' ? 'justify-center' : 'justify-start font-medium'
                    )}
                    title="Click to edit instantly"
                >
                    {value !== null && value !== undefined && value !== '' ? (
                        <>
                            {displayPrefix && <span className={cn('text-[10px]', theme.textMuted)}>{displayPrefix}</span>}
                            <span>{value}</span>
                            {displaySuffix && <span className={cn('text-[10px]', theme.textMuted)}>{displaySuffix}</span>}
                        </>
                    ) : (
                        <span className={cn('text-[10px] italic opacity-50', theme.textMuted)}>empty</span>
                    )}

                    {/* Subtle status indicator */}
                    {saveState === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0 ml-0.5" />}
                    {saveState === 'saved' && <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-0.5" />}
                    {saveState === 'error' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0 ml-0.5" />}
                </div>
            )}
        </div>
    );
};

// ==========================================
// 📊 MAIN DEDICATED PRICE LIST PAGE
// ==========================================
export default function DedicatedPriceListPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    // Fetch all products (high limit so the spreadsheet shows the complete catalog cleanly)
    const { data: productsRes, isLoading, isFetching, refetch } = useGetAllProductsAdminQuery(
        { page: 1, limit: 500 },
        { refetchOnMountOrArgChange: true }
    );
    const { data: categoriesRes } = useGetAllCategoriesAdminQuery();
    const [quickUpdateCell] = useQuickUpdateCellMutation();

    const rawProducts: any[] = useMemo(() => (productsRes as any)?.data || [], [productsRes]);
    const categories: any[] = useMemo(() => categoriesRes?.data?.data || [], [categoriesRes]);

    // Local optimistic cache so edits reflect in 0ms
    const [optimisticOverrides, setOptimisticOverrides] = useState<Record<string, any>>({});
    const [cellStates, setCellStates] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

    // View, Theme & Density Preferences (persisted)
    const [themeKey, setThemeKey] = useState<SheetThemeKey>('sheets');
    const [density, setDensity] = useState<DensityMode>('ultra');
    const [viewMode, setViewMode] = useState<ViewMode>('matrix');
    const [showFiltersBar, setShowFiltersBar] = useState(true);

    // Multi-Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'HIDDEN'>('ALL');
    const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
    const [minPriceFilter, setMinPriceFilter] = useState('');
    const [maxPriceFilter, setMaxPriceFilter] = useState('');

    // Sorting States
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const searchRef = useRef<HTMLInputElement>(null);

    // Hydrate user preferences from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('kw_sheet_theme') as SheetThemeKey | null;
        const savedDensity = localStorage.getItem('kw_sheet_density') as DensityMode | null;
        const savedView = localStorage.getItem('kw_sheet_view') as ViewMode | null;
        if (savedTheme && SHEET_THEMES[savedTheme]) setThemeKey(savedTheme);
        if (savedDensity) setDensity(savedDensity);
        if (savedView) setViewMode(savedView);
    }, []);

    const changeTheme = (t: SheetThemeKey) => {
        setThemeKey(t);
        localStorage.setItem('kw_sheet_theme', t);
    };

    const changeDensity = (d: DensityMode) => {
        setDensity(d);
        localStorage.setItem('kw_sheet_density', d);
    };

    const changeViewMode = (v: ViewMode) => {
        setViewMode(v);
        localStorage.setItem('kw_sheet_view', v);
        setEditingCell(null);
    };

    // '/' Shortcut to focus search when not editing a cell
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === '/' &&
                !editingCell &&
                document.activeElement?.tagName !== 'INPUT' &&
                document.activeElement?.tagName !== 'SELECT'
            ) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [editingCell]);

    const theme = SHEET_THEMES[themeKey];
    const densityClass =
        density === 'ultra' ? 'h-7' : density === 'compact' ? 'h-8.5' : 'h-10';

    // Merge server data with instant optimistic edits
    const mergedProducts = useMemo(() => {
        return rawProducts.map((prod) => {
            const prodOverride = optimisticOverrides[`PRODUCT:${prod.id}`] || {};
            const mergedVariants = (prod.variants || []).map((v: any) => ({
                ...v,
                ...(optimisticOverrides[`VARIANT:${v.id}`] || {}),
            }));
            return {
                ...prod,
                ...prodOverride,
                variants: mergedVariants,
            };
        });
    }, [rawProducts, optimisticOverrides]);

    // Discover all dynamic size+unit columns across products for Matrix View (e.g., "3 ML", "6 ML", "12 ML", "30 ML")
    const matrixSizeColumns = useMemo(() => {
        const colMap = new Map<string, { key: string; size: number; unit: string; label: string }>();
        mergedProducts.forEach((p) => {
            (p.variants || []).forEach((v: any) => {
                const unit = (v.unit || 'ML').toUpperCase();
                const size = Number(v.size) || 0;
                const key = `${size}_${unit}`;
                if (!colMap.has(key)) {
                    colMap.set(key, { key, size, unit, label: `${size} ${unit}` });
                }
            });
        });
        return Array.from(colMap.values()).sort((a, b) => a.size - b.size || a.unit.localeCompare(b.unit));
    }, [mergedProducts]);

    // Apply Multi-Filters & Sorting
    const filteredAndSortedProducts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const minP = minPriceFilter !== '' ? Number(minPriceFilter) : null;
        const maxP = maxPriceFilter !== '' ? Number(maxPriceFilter) : null;

        const filtered = mergedProducts.filter((p) => {
            // 1. Search (name, slug, category, supplier, or variant SKU)
            if (q) {
                const inName = p.name?.toLowerCase().includes(q);
                const inCat = p.category?.categoryName?.toLowerCase().includes(q);
                const inSupplier = p.supplier?.toLowerCase().includes(q);
                const inSku = (p.variants || []).some((v: any) => v.sku?.toLowerCase().includes(q));
                if (!inName && !inCat && !inSupplier && !inSku) return false;
            }

            // 2. Multi-Category Filter
            if (selectedCategories.length > 0) {
                if (!selectedCategories.includes(p.categoryId)) return false;
            }

            // 3. Publish Status
            if (statusFilter === 'PUBLISHED' && !p.published) return false;
            if (statusFilter === 'HIDDEN' && p.published) return false;

            // 4. Stock Status
            const stock = Number(p.totalStock ?? p.stock ?? 0);
            if (stockFilter === 'IN_STOCK' && stock <= 0) return false;
            if (stockFilter === 'LOW_STOCK' && (stock <= 0 || stock > 10)) return false;
            if (stockFilter === 'OUT_OF_STOCK' && stock > 0) return false;

            // 5. Price Range
            const prices = (p.variants || []).map((v: any) => Number(v.price) || 0);
            const pMin = prices.length ? Math.min(...prices) : 0;
            const pMax = prices.length ? Math.max(...prices) : 0;
            if (minP !== null && pMax < minP) return false;
            if (maxP !== null && pMin > maxP) return false;

            return true;
        });

        // Multi-column sorting
        return [...filtered].sort((a, b) => {
            let valA: any = 0;
            let valB: any = 0;

            if (sortField === 'name') {
                valA = (a.name || '').toLowerCase();
                valB = (b.name || '').toLowerCase();
            } else if (sortField === 'category') {
                valA = (a.category?.categoryName || '').toLowerCase();
                valB = (b.category?.categoryName || '').toLowerCase();
            } else if (sortField === 'stock') {
                valA = Number(a.totalStock ?? a.stock ?? 0);
                valB = Number(b.totalStock ?? b.stock ?? 0);
            } else if (sortField === 'salesCount') {
                valA = Number(a.salesCount ?? 0);
                valB = Number(b.salesCount ?? 0);
            } else if (sortField === 'minPrice') {
                const pA = (a.variants || []).map((v: any) => Number(v.price) || 0);
                const pB = (b.variants || []).map((v: any) => Number(v.price) || 0);
                valA = pA.length ? Math.min(...pA) : 0;
                valB = pB.length ? Math.min(...pB) : 0;
            } else if (sortField.startsWith('SIZE:')) {
                const sizeKey = sortField.replace('SIZE:', '');
                const vA = (a.variants || []).find(
                    (v: any) => `${Number(v.size)}_${(v.unit || 'ML').toUpperCase()}` === sizeKey
                );
                const vB = (b.variants || []).find(
                    (v: any) => `${Number(v.size)}_${(v.unit || 'ML').toUpperCase()}` === sizeKey
                );
                valA = vA ? Number(vA.price) : -1;
                valB = vB ? Number(vB.price) : -1;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [
        mergedProducts,
        searchQuery,
        selectedCategories,
        statusFilter,
        stockFilter,
        minPriceFilter,
        maxPriceFilter,
        sortField,
        sortOrder,
    ]);

    // Flat rows list for Flat Variant View
    const flatVariantRows = useMemo(() => {
        const rows: Array<{ product: any; variant: any }> = [];
        filteredAndSortedProducts.forEach((product) => {
            const sortedVars = [...(product.variants || [])].sort(
                (a: any, b: any) => (Number(a.size) || 0) - (Number(b.size) || 0)
            );
            sortedVars.forEach((variant) => {
                rows.push({ product, variant });
            });
        });
        return rows;
    }, [filteredAndSortedProducts]);

    // Commit cell update to backend with instant optimistic UI
    const handleCommitCell = useCallback(
        async (
            cellKey: string,
            entity: 'PRODUCT' | 'VARIANT',
            id: string,
            field: string,
            newValue: string | number | boolean
        ) => {
            setEditingCell(null);

            // 1. Optimistic state update
            const overrideKey = `${entity}:${id}`;
            setOptimisticOverrides((prev) => ({
                ...prev,
                [overrideKey]: {
                    ...(prev[overrideKey] || {}),
                    [field]: newValue,
                },
            }));

            setCellStates((prev) => ({ ...prev, [cellKey]: 'saving' }));

            try {
                await quickUpdateCell({
                    entity,
                    id,
                    field,
                    value: newValue,
                }).unwrap();

                setCellStates((prev) => ({ ...prev, [cellKey]: 'saved' }));
                setTimeout(() => {
                    setCellStates((prev) => {
                        const copy = { ...prev };
                        delete copy[cellKey];
                        return copy;
                    });
                }, 1200);
            } catch (err: any) {
                setCellStates((prev) => ({ ...prev, [cellKey]: 'error' }));
                toast.error(err?.data?.message || `Failed to update ${field}`);
            }
        },
        [quickUpdateCell]
    );

    // Toggle column sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Export current filtered price sheet to CSV
    const handleExportCSV = () => {
        const headers = [
            'Product Name',
            'Category',
            'Status',
            'Stock',
            ...matrixSizeColumns.map((c) => `${c.label} (BDT)`),
        ];

        const csvRows = [headers.join(',')];

        filteredAndSortedProducts.forEach((p) => {
            const sizeCells = matrixSizeColumns.map((col) => {
                const v = (p.variants || []).find(
                    (item: any) => `${Number(item.size)}_${(item.unit || 'ML').toUpperCase()}` === col.key
                );
                return v ? v.price : '';
            });

            csvRows.push(
                [
                    `"${(p.name || '').replace(/"/g, '""')}"`,
                    `"${(p.category?.categoryName || '').replace(/"/g, '""')}"`,
                    p.published ? 'Live' : 'Hidden',
                    p.totalStock ?? p.stock ?? 0,
                    ...sizeCells,
                ].join(',')
            );
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Khushbuwaala_Price_List_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Price list exported as CSV!');
    };

    const toggleCategoryFilter = (catId: string) => {
        setSelectedCategories((prev) =>
            prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
        );
    };

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategories([]);
        setStatusFilter('ALL');
        setStockFilter('ALL');
        setMinPriceFilter('');
        setMaxPriceFilter('');
    };

    const activeFilterCount =
        selectedCategories.length +
        (statusFilter !== 'ALL' ? 1 : 0) +
        (stockFilter !== 'ALL' ? 1 : 0) +
        (minPriceFilter ? 1 : 0) +
        (maxPriceFilter ? 1 : 0) +
        (searchQuery ? 1 : 0);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40 shrink-0" />;
        return sortOrder === 'asc' ? (
            <ArrowUp className="w-3 h-3 text-blue-500 shrink-0" />
        ) : (
            <ArrowDown className="w-3 h-3 text-blue-500 shrink-0" />
        );
    };

    return (
        <div className={cn('w-full min-h-screen flex flex-col transition-colors duration-200', theme.wrapper)}>
            {/* ==========================================
          1. COMPACT SPREADSHEET TOP BAR
         ========================================== */}
            <div className={cn('sticky top-0 z-40 border-b px-2 sm:px-3 py-1.5 flex flex-wrap items-center justify-between gap-2', theme.toolbar)}>
                {/* Left: Back + Title + Live Row Counter */}
                <div className="flex items-center gap-2 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/products')}
                        className="h-7 w-7 shrink-0"
                        title="Back to Products"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1.5 truncate">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-600 text-white font-black text-xs shrink-0">
                            ৳
                        </span>
                        <h1 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
                            Master Price Sheet
                        </h1>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-mono shrink-0', theme.badgeBg)}>
                            {viewMode === 'matrix'
                                ? `${filteredAndSortedProducts.length} Products`
                                : `${flatVariantRows.length} SKUs`}
                        </Badge>
                        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />}
                    </div>
                </div>

                {/* Right: Search, View Switcher, Density, Theme, Filter Toggle, Export */}
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
                    {/* Quick Search */}
                    <div className="relative flex-1 sm:w-56 min-w-[140px]">
                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search name, SKU... (/)"
                            className={cn(
                                'w-full h-7 pl-7 pr-6 text-xs rounded border outline-none transition-colors',
                                theme.border,
                                themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50/80 text-gray-900 focus:bg-white'
                            )}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Matrix vs Flat SKU View Toggle */}
                    <div className={cn('inline-flex rounded border p-0.5', theme.border)}>
                        <button
                            type="button"
                            onClick={() => changeViewMode('matrix')}
                            className={cn(
                                'px-2 py-0.5 text-[11px] font-bold rounded-xs flex items-center gap-1 transition-colors',
                                viewMode === 'matrix' ? 'bg-emerald-600 text-white' : 'opacity-70 hover:opacity-100'
                            )}
                            title="Size Matrix View (Columns per ML/GM)"
                        >
                            <Grid3X3 className="w-3 h-3" />
                            <span className="hidden md:inline">Matrix</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => changeViewMode('flat')}
                            className={cn(
                                'px-2 py-0.5 text-[11px] font-bold rounded-xs flex items-center gap-1 transition-colors',
                                viewMode === 'flat' ? 'bg-emerald-600 text-white' : 'opacity-70 hover:opacity-100'
                            )}
                            title="Flat Variant Row View (Edit SKU, Cost, Stock)"
                        >
                            <ListTree className="w-3 h-3" />
                            <span className="hidden md:inline">Variants</span>
                        </button>
                    </div>

                    {/* Density Selector */}
                    <select
                        value={density}
                        onChange={(e) => changeDensity(e.target.value as DensityMode)}
                        title="Row Density"
                        className={cn(
                            'h-7 px-1.5 text-[11px] font-semibold rounded border outline-none cursor-pointer',
                            theme.border,
                            themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                        )}
                    >
                        <option value="ultra">Ultra Dense</option>
                        <option value="compact">Compact</option>
                        <option value="comfortable">Comfort</option>
                    </select>

                    {/* Theme Switcher */}
                    <div className="relative flex items-center">
                        <Palette className="w-3.5 h-3.5 absolute left-2 pointer-events-none opacity-60" />
                        <select
                            value={themeKey}
                            onChange={(e) => changeTheme(e.target.value as SheetThemeKey)}
                            title="Spreadsheet Theme"
                            className={cn(
                                'h-7 pl-6 pr-2 text-[11px] font-semibold rounded border outline-none cursor-pointer',
                                theme.border,
                                themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                            )}
                        >
                            {Object.entries(SHEET_THEMES).map(([key, val]) => (
                                <option key={key} value={key}>
                                    {val.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Drawer Toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFiltersBar((prev) => !prev)}
                        className={cn(
                            'h-7 px-2 text-[11px] font-bold gap-1',
                            theme.border,
                            activeFilterCount > 0 && 'border-blue-500 text-blue-600 bg-blue-50/40'
                        )}
                    >
                        <Filter className="w-3 h-3" />
                        <span className="hidden sm:inline">Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="px-1 rounded-full bg-blue-600 text-white text-[9px]">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>

                    {/* CSV Export */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportCSV}
                        className={cn('h-7 px-2 text-[11px] font-bold gap-1', theme.border)}
                        title="Download CSV"
                    >
                        <Download className="w-3 h-3" />
                        <span className="hidden lg:inline">CSV</span>
                    </Button>
                </div>
            </div>

            {/* ==========================================
          2. COMPACT MULTI-FILTER RIBBON
         ========================================== */}
            {showFiltersBar && (
                <div className={cn('border-b px-2 sm:px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs', theme.toolbar)}>
                    {/* Category Multi-Select Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 sm:pb-0 no-scrollbar">
                        <span className={cn('text-[10px] font-bold uppercase tracking-wider mr-0.5 shrink-0', theme.textMuted)}>
                            Category:
                        </span>
                        {categories.map((cat: any) => {
                            const active = selectedCategories.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => toggleCategoryFilter(cat.id)}
                                    className={cn(
                                        'px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap transition-all',
                                        active
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                            : cn(theme.badgeBg, 'opacity-80 hover:opacity-100')
                                    )}
                                >
                                    {cat.categoryName}
                                </button>
                            );
                        })}
                    </div>

                    <div className="h-4 w-[1px] bg-gray-300 dark:bg-gray-700 hidden md:block" />

                    {/* Status & Stock Dropdowns */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className={cn(
                                'h-6 px-1.5 text-[11px] font-semibold rounded border outline-none',
                                theme.border,
                                themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                            )}
                        >
                            <option value="ALL">Status: All</option>
                            <option value="PUBLISHED">Live Only</option>
                            <option value="HIDDEN">Hidden Only</option>
                        </select>

                        <select
                            value={stockFilter}
                            onChange={(e) => setStockFilter(e.target.value as any)}
                            className={cn(
                                'h-6 px-1.5 text-[11px] font-semibold rounded border outline-none',
                                theme.border,
                                themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                            )}
                        >
                            <option value="ALL">Stock: All</option>
                            <option value="IN_STOCK">In Stock (&gt;0)</option>
                            <option value="LOW_STOCK">Low Stock (1-10)</option>
                            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
                        </select>

                        {/* Min - Max Price Filter */}
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                placeholder="Min ৳"
                                value={minPriceFilter}
                                onChange={(e) => setMinPriceFilter(e.target.value)}
                                className={cn(
                                    'w-16 h-6 px-1.5 text-[11px] rounded border outline-none',
                                    theme.border,
                                    themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                                )}
                            />
                            <span className="text-[10px] opacity-50">-</span>
                            <input
                                type="number"
                                placeholder="Max ৳"
                                value={maxPriceFilter}
                                onChange={(e) => setMaxPriceFilter(e.target.value)}
                                className={cn(
                                    'w-16 h-6 px-1.5 text-[11px] rounded border outline-none',
                                    theme.border,
                                    themeKey === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
                                )}
                            />
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={resetAllFilters}
                                className="inline-flex items-center gap-1 px-2 h-6 rounded text-[11px] font-bold text-rose-600 hover:bg-rose-500/10"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ==========================================
          3. SPREADSHEET GRID VIEWPORT
         ========================================== */}
            <div className="flex-1 overflow-auto relative">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-2">
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                        <p className="text-xs font-semibold opacity-70">Loading price matrix...</p>
                    </div>
                ) : viewMode === 'matrix' ? (
                    /* ==========================================
                       VIEW A: SIZE MATRIX GOOGLE SHEETS GRID
                       ========================================== */
                    <table className="w-full border-collapse text-xs">
                        <thead className={cn('sticky top-0 z-30 shadow-2xs', theme.headerBg, theme.headerText)}>
                            <tr>
                                {/* Row Number Header */}
                                <th className={cn('w-9 text-center font-mono text-[10px] border-r border-b py-1.5 select-none', theme.border)}>
                                    #
                                </th>

                                {/* Sticky Product Name Column */}
                                <th
                                    onClick={() => handleSort('name')}
                                    className={cn(
                                        'sticky left-0 z-30 min-w-[165px] sm:min-w-[230px] max-w-[250px] text-left px-2.5 py-1.5 font-bold border-r border-b cursor-pointer select-none',
                                        theme.headerBg,
                                        theme.border
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span>Product Name</span>
                                        <SortIcon field="name" />
                                    </div>
                                </th>

                                {/* Category */}
                                <th
                                    onClick={() => handleSort('category')}
                                    className={cn('min-w-[110px] text-left px-2 py-1.5 font-bold border-r border-b cursor-pointer select-none', theme.border)}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span>Category</span>
                                        <SortIcon field="category" />
                                    </div>
                                </th>

                                {/* Status */}
                                <th className={cn('w-16 text-center px-1.5 py-1.5 font-bold border-r border-b select-none', theme.border)}>
                                    Live
                                </th>

                                {/* Product Total Stock */}
                                <th
                                    onClick={() => handleSort('stock')}
                                    className={cn('min-w-[80px] text-right px-2 py-1.5 font-bold border-r border-b cursor-pointer select-none', theme.border)}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        <span>Stock</span>
                                        <SortIcon field="stock" />
                                    </div>
                                </th>

                                {/* Dynamic Variant Size Columns (3 ML, 6 ML, 12 ML, 30 ML, etc.) */}
                                {matrixSizeColumns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(`SIZE:${col.key}`)}
                                        className={cn(
                                            'min-w-[88px] text-right px-2 py-1.5 font-extrabold border-r border-b cursor-pointer select-none whitespace-nowrap',
                                            theme.border
                                        )}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            <span>{col.label}</span>
                                            <SortIcon field={`SIZE:${col.key}`} />
                                        </div>
                                    </th>
                                ))}

                                {/* Min - Max Summary Column */}
                                <th
                                    onClick={() => handleSort('minPrice')}
                                    className={cn('min-w-[105px] text-right px-2 py-1.5 font-bold border-b cursor-pointer select-none whitespace-nowrap', theme.border)}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        <span>Range</span>
                                        <SortIcon field="minPrice" />
                                    </div>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAndSortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6 + matrixSizeColumns.length} className="py-12 text-center opacity-60">
                                        No matching products found. Adjust your filters or search term.
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedProducts.map((product, rowIdx) => {
                                    const rowKey = product.id;
                                    const isEven = rowIdx % 2 === 0;
                                    const rowBg = isEven ? theme.rowEven : theme.rowOdd;
                                    const prices = (product.variants || []).map((v: any) => Number(v.price) || 0);
                                    const minP = prices.length ? Math.min(...prices) : 0;
                                    const maxP = prices.length ? Math.max(...prices) : 0;

                                    return (
                                        <tr key={product.id} className={cn('transition-colors', rowBg, theme.rowHover)}>
                                            {/* Spreadsheet Row Number */}
                                            <td className={cn('text-center font-mono text-[10px] border-r border-b select-none opacity-60', theme.border)}>
                                                {rowIdx + 1}
                                            </td>

                                            {/* Sticky Product Name Cell (Editable) */}
                                            <td
                                                className={cn(
                                                    'sticky left-0 z-20 border-r border-b max-w-[250px]',
                                                    rowBg,
                                                    theme.border
                                                )}
                                            >
                                                <div className="flex items-center gap-1.5 pl-1.5">
                                                    <div className="relative w-5 h-5 rounded-xs overflow-hidden shrink-0 border border-gray-300/60">
                                                        <Image
                                                            src={product.primaryImage || '/placeholder.png'}
                                                            alt={product.name}
                                                            fill
                                                            sizes="20px"
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <EditableSheetCell
                                                            value={product.name}
                                                            type="text"
                                                            align="left"
                                                            theme={theme}
                                                            densityClass={densityClass}
                                                            isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'name'}
                                                            saveState={cellStates[`${rowKey}:name`]}
                                                            onStartEdit={() =>
                                                                setEditingCell({
                                                                    rowKey,
                                                                    colKey: 'name',
                                                                    entity: 'PRODUCT',
                                                                    id: product.id,
                                                                    field: 'name',
                                                                    initialValue: product.name,
                                                                })
                                                            }
                                                            onCommit={(val) =>
                                                                handleCommitCell(`${rowKey}:name`, 'PRODUCT', product.id, 'name', val)
                                                            }
                                                            onCancel={() => setEditingCell(null)}
                                                            onNavigate={(dir) => {
                                                                if (dir === 'down' && filteredAndSortedProducts[rowIdx + 1]) {
                                                                    const next = filteredAndSortedProducts[rowIdx + 1];
                                                                    setEditingCell({
                                                                        rowKey: next.id,
                                                                        colKey: 'name',
                                                                        entity: 'PRODUCT',
                                                                        id: next.id,
                                                                        field: 'name',
                                                                        initialValue: next.name,
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category (Read-only badge for clean visual grouping) */}
                                            <td className={cn('px-2 border-r border-b truncate max-w-[130px]', theme.border)}>
                                                <span className={cn('text-[11px] font-medium', theme.textMuted)}>
                                                    {product.category?.categoryName || '—'}
                                                </span>
                                            </td>

                                            {/* Instant Publish Toggle Cell */}
                                            <td className={cn('text-center border-r border-b', theme.border)}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCommitCell(
                                                            `${rowKey}:published`,
                                                            'PRODUCT',
                                                            product.id,
                                                            'published',
                                                            !product.published
                                                        )
                                                    }
                                                    className={cn(
                                                        'inline-flex items-center justify-center w-6 h-5 rounded transition-colors',
                                                        product.published
                                                            ? 'text-emerald-600 bg-emerald-500/15 hover:bg-emerald-500/25'
                                                            : 'text-gray-400 bg-gray-500/10 hover:bg-gray-500/20'
                                                    )}
                                                    title={product.published ? 'Live (Click to hide)' : 'Hidden (Click to publish)'}
                                                >
                                                    {product.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                </button>
                                            </td>

                                            {/* Total Stock Cell (Editable) */}
                                            <td className={cn('border-r border-b', theme.border)}>
                                                <EditableSheetCell
                                                    value={product.totalStock ?? product.stock ?? 0}
                                                    displaySuffix={product.category?.unit || ''}
                                                    type="number"
                                                    align="right"
                                                    theme={theme}
                                                    densityClass={densityClass}
                                                    isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'stock'}
                                                    saveState={cellStates[`${rowKey}:stock`]}
                                                    onStartEdit={() =>
                                                        setEditingCell({
                                                            rowKey,
                                                            colKey: 'stock',
                                                            entity: 'PRODUCT',
                                                            id: product.id,
                                                            field: 'stock',
                                                            initialValue: product.totalStock ?? product.stock ?? 0,
                                                        })
                                                    }
                                                    onCommit={(val) =>
                                                        handleCommitCell(`${rowKey}:stock`, 'PRODUCT', product.id, 'stock', val)
                                                    }
                                                    onCancel={() => setEditingCell(null)}
                                                    onNavigate={(dir) => {
                                                        if (dir === 'down' && filteredAndSortedProducts[rowIdx + 1]) {
                                                            const next = filteredAndSortedProducts[rowIdx + 1];
                                                            setEditingCell({
                                                                rowKey: next.id,
                                                                colKey: 'stock',
                                                                entity: 'PRODUCT',
                                                                id: next.id,
                                                                field: 'stock',
                                                                initialValue: next.totalStock ?? next.stock ?? 0,
                                                            });
                                                        }
                                                    }}
                                                />
                                            </td>

                                            {/* Dynamic Variant Price Cells */}
                                            {matrixSizeColumns.map((col) => {
                                                const variant = (product.variants || []).find(
                                                    (v: any) => `${Number(v.size)}_${(v.unit || 'ML').toUpperCase()}` === col.key
                                                );
                                                const cellKey = `${rowKey}:${col.key}`;

                                                return (
                                                    <td
                                                        key={col.key}
                                                        className={cn(
                                                            'border-r border-b p-0',
                                                            theme.border,
                                                            variant && variant.published === false && 'opacity-50 line-through'
                                                        )}
                                                    >
                                                        <EditableSheetCell
                                                            value={variant?.price}
                                                            displaySuffix="৳"
                                                            type="number"
                                                            align="right"
                                                            disabled={!variant}
                                                            theme={theme}
                                                            densityClass={densityClass}
                                                            isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === col.key}
                                                            saveState={cellStates[cellKey]}
                                                            onStartEdit={() =>
                                                                variant &&
                                                                setEditingCell({
                                                                    rowKey,
                                                                    colKey: col.key,
                                                                    entity: 'VARIANT',
                                                                    id: variant.id,
                                                                    field: 'price',
                                                                    initialValue: variant.price,
                                                                })
                                                            }
                                                            onCommit={(val) =>
                                                                variant && handleCommitCell(cellKey, 'VARIANT', variant.id, 'price', val)
                                                            }
                                                            onCancel={() => setEditingCell(null)}
                                                            onNavigate={(dir) => {
                                                                if (dir === 'down') {
                                                                    for (let r = rowIdx + 1; r < filteredAndSortedProducts.length; r++) {
                                                                        const nextProd = filteredAndSortedProducts[r];
                                                                        const nextVar = (nextProd.variants || []).find(
                                                                            (v: any) =>
                                                                                `${Number(v.size)}_${(v.unit || 'ML').toUpperCase()}` === col.key
                                                                        );
                                                                        if (nextVar) {
                                                                            setEditingCell({
                                                                                rowKey: nextProd.id,
                                                                                colKey: col.key,
                                                                                entity: 'VARIANT',
                                                                                id: nextVar.id,
                                                                                field: 'price',
                                                                                initialValue: nextVar.price,
                                                                            });
                                                                            break;
                                                                        }
                                                                    }
                                                                } else if (dir === 'up') {
                                                                    for (let r = rowIdx - 1; r >= 0; r--) {
                                                                        const prevProd = filteredAndSortedProducts[r];
                                                                        const prevVar = (prevProd.variants || []).find(
                                                                            (v: any) =>
                                                                                `${Number(v.size)}_${(v.unit || 'ML').toUpperCase()}` === col.key
                                                                        );
                                                                        if (prevVar) {
                                                                            setEditingCell({
                                                                                rowKey: prevProd.id,
                                                                                colKey: col.key,
                                                                                entity: 'VARIANT',
                                                                                id: prevVar.id,
                                                                                field: 'price',
                                                                                initialValue: prevVar.price,
                                                                            });
                                                                            break;
                                                                        }
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                );
                                            })}

                                            {/* Live Calculated Price Range */}
                                            <td className={cn('px-2 text-right font-mono text-[11px] font-bold border-b whitespace-nowrap', theme.border, theme.textMuted)}>
                                                {prices.length ? (minP === maxP ? `${minP}৳` : `${minP}–${maxP}৳`) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : (
                    /* ==========================================
                       VIEW B: FLAT SKU / VARIANT SHEET VIEW
                       (Edit SKU, Price, CompareAtPrice, CostPrice, Variant Stock)
                       ========================================== */
                    <table className="w-full border-collapse text-xs">
                        <thead className={cn('sticky top-0 z-30 shadow-2xs', theme.headerBg, theme.headerText)}>
                            <tr>
                                <th className={cn('w-9 text-center font-mono text-[10px] border-r border-b py-1.5', theme.border)}>#</th>
                                <th className={cn('sticky left-0 z-30 min-w-[180px] text-left px-2.5 py-1.5 font-bold border-r border-b', theme.headerBg, theme.border)}>
                                    Product
                                </th>
                                <th className={cn('min-w-[80px] text-left px-2 py-1.5 font-bold border-r border-b', theme.border)}>Variant</th>
                                <th className={cn('min-w-[140px] text-left px-2 py-1.5 font-bold border-r border-b', theme.border)}>SKU</th>
                                <th className={cn('min-w-[95px] text-right px-2 py-1.5 font-bold border-r border-b', theme.border)}>Selling Price</th>
                                <th className={cn('min-w-[95px] text-right px-2 py-1.5 font-bold border-r border-b', theme.border)}>Regular Price</th>
                                {isSuperAdmin && (
                                    <th className={cn('min-w-[95px] text-right px-2 py-1.5 font-bold border-r border-b', theme.border)}>Cost Price</th>
                                )}
                                <th className={cn('min-w-[85px] text-right px-2 py-1.5 font-bold border-r border-b', theme.border)}>Var. Stock</th>
                                <th className={cn('w-16 text-center px-2 py-1.5 font-bold border-b', theme.border)}>Live</th>
                            </tr>
                        </thead>
                        <tbody>
                            {flatVariantRows.map(({ product, variant }, idx) => {
                                const rowKey = variant.id;
                                const rowBg = idx % 2 === 0 ? theme.rowEven : theme.rowOdd;

                                return (
                                    <tr key={variant.id} className={cn('transition-colors', rowBg, theme.rowHover)}>
                                        <td className={cn('text-center font-mono text-[10px] border-r border-b opacity-60', theme.border)}>{idx + 1}</td>
                                        <td className={cn('sticky left-0 z-20 px-2.5 font-bold border-r border-b truncate max-w-[220px]', rowBg, theme.border)}>
                                            {product.name}
                                        </td>
                                        <td className={cn('px-2 font-semibold border-r border-b whitespace-nowrap', theme.border)}>
                                            {variant.size} {variant.unit}
                                        </td>
                                        <td className={cn('border-r border-b p-0 font-mono', theme.border)}>
                                            <EditableSheetCell
                                                value={variant.sku}
                                                type="text"
                                                align="left"
                                                theme={theme}
                                                densityClass={densityClass}
                                                isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'sku'}
                                                saveState={cellStates[`${rowKey}:sku`]}
                                                onStartEdit={() =>
                                                    setEditingCell({ rowKey, colKey: 'sku', entity: 'VARIANT', id: variant.id, field: 'sku', initialValue: variant.sku })
                                                }
                                                onCommit={(val) => handleCommitCell(`${rowKey}:sku`, 'VARIANT', variant.id, 'sku', val)}
                                                onCancel={() => setEditingCell(null)}
                                                onNavigate={() => { }}
                                            />
                                        </td>
                                        <td className={cn('border-r border-b p-0', theme.border)}>
                                            <EditableSheetCell
                                                value={variant.price}
                                                displaySuffix="৳"
                                                type="number"
                                                align="right"
                                                theme={theme}
                                                densityClass={densityClass}
                                                isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'price'}
                                                saveState={cellStates[`${rowKey}:price`]}
                                                onStartEdit={() =>
                                                    setEditingCell({ rowKey, colKey: 'price', entity: 'VARIANT', id: variant.id, field: 'price', initialValue: variant.price })
                                                }
                                                onCommit={(val) => handleCommitCell(`${rowKey}:price`, 'VARIANT', variant.id, 'price', val)}
                                                onCancel={() => setEditingCell(null)}
                                                onNavigate={() => { }}
                                            />
                                        </td>
                                        <td className={cn('border-r border-b p-0', theme.border)}>
                                            <EditableSheetCell
                                                value={variant.compareAtPrice ?? ''}
                                                displaySuffix="৳"
                                                type="number"
                                                align="right"
                                                theme={theme}
                                                densityClass={densityClass}
                                                isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'compareAtPrice'}
                                                saveState={cellStates[`${rowKey}:compareAtPrice`]}
                                                onStartEdit={() =>
                                                    setEditingCell({
                                                        rowKey,
                                                        colKey: 'compareAtPrice',
                                                        entity: 'VARIANT',
                                                        id: variant.id,
                                                        field: 'compareAtPrice',
                                                        initialValue: variant.compareAtPrice ?? '',
                                                    })
                                                }
                                                onCommit={(val) => handleCommitCell(`${rowKey}:compareAtPrice`, 'VARIANT', variant.id, 'compareAtPrice', val)}
                                                onCancel={() => setEditingCell(null)}
                                                onNavigate={() => { }}
                                            />
                                        </td>
                                        {isSuperAdmin && (
                                            <td className={cn('border-r border-b p-0', theme.border)}>
                                                <EditableSheetCell
                                                    value={variant.costPrice ?? ''}
                                                    displaySuffix="৳"
                                                    type="number"
                                                    align="right"
                                                    theme={theme}
                                                    densityClass={densityClass}
                                                    isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'costPrice'}
                                                    saveState={cellStates[`${rowKey}:costPrice`]}
                                                    onStartEdit={() =>
                                                        setEditingCell({
                                                            rowKey,
                                                            colKey: 'costPrice',
                                                            entity: 'VARIANT',
                                                            id: variant.id,
                                                            field: 'costPrice',
                                                            initialValue: variant.costPrice ?? '',
                                                        })
                                                    }
                                                    onCommit={(val) => handleCommitCell(`${rowKey}:costPrice`, 'VARIANT', variant.id, 'costPrice', val)}
                                                    onCancel={() => setEditingCell(null)}
                                                    onNavigate={() => { }}
                                                />
                                            </td>
                                        )}
                                        <td className={cn('border-r border-b p-0', theme.border)}>
                                            <EditableSheetCell
                                                value={variant.stock}
                                                type="number"
                                                align="right"
                                                theme={theme}
                                                densityClass={densityClass}
                                                isEditing={editingCell?.rowKey === rowKey && editingCell?.colKey === 'stock'}
                                                saveState={cellStates[`${rowKey}:stock`]}
                                                onStartEdit={() =>
                                                    setEditingCell({ rowKey, colKey: 'stock', entity: 'VARIANT', id: variant.id, field: 'stock', initialValue: variant.stock })
                                                }
                                                onCommit={(val) => handleCommitCell(`${rowKey}:stock`, 'VARIANT', variant.id, 'stock', val)}
                                                onCancel={() => setEditingCell(null)}
                                                onNavigate={() => { }}
                                            />
                                        </td>
                                        <td className={cn('text-center border-b', theme.border)}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCommitCell(`${rowKey}:published`, 'VARIANT', variant.id, 'published', !(variant.published !== false))
                                                }
                                                className={cn(
                                                    'inline-flex items-center justify-center w-6 h-5 rounded',
                                                    variant.published !== false ? 'text-emerald-600 bg-emerald-500/15' : 'text-gray-400 bg-gray-500/10'
                                                )}
                                            >
                                                {variant.published !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ==========================================
          4. COMPACT STATUS FOOTER BAR
         ========================================== */}
            <div className={cn('border-t px-3 py-1 text-[11px] flex items-center justify-between gap-2', theme.toolbar, theme.textMuted)}>
                <div className="flex items-center gap-3 truncate">
                    <span>Click any cell to edit • <strong>Enter</strong> saves & moves down • <strong>Esc</strong> cancels</span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setOptimisticOverrides({});
                        refetch();
                        toast.success('Synced with server');
                    }}
                    className="font-bold hover:underline shrink-0 text-emerald-600"
                >
                    ↻ Sync Latest
                </button>
            </div>
        </div>
    );
}