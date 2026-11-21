/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
    AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Bookmark, Calculator, Check, ChevronDown, Copy, Download,
    Eye, EyeOff, Filter, Grid3X3, GripVertical, History, Keyboard, ListTree, Loader2, Maximize2, Package,
    Palette, Percent, Pin, Plus, RotateCcw, Save, Search, Settings2, Trash2, Undo2, Wallet, X,
} from 'lucide-react';
import {
    useGetAllProductsAdminQuery,
    useGetStockLogsQuery,
    useQuickUpdateCellMutation,
} from '@/redux/store/api/product/productApi';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useGetAllDiscountsAdminQuery } from '@/redux/store/api/discount/discountApi';
import {
    useGetLiveWACQuery,
    useGetPackagingCostsQuery,
    useReceiveStockPurchaseMutation,
    useSetPackagingCostsMutation,
} from '@/redux/store/api/finance/financeApi';
import { useAuth } from '@/redux/store/hooks/useAuth';
import { cn } from '@/lib/utils';

// ============================================================
// ⚙️ SETTINGS YOU MAY WANT TO ADJUST
// ============================================================
const PAGE_HEIGHT = '100dvh'; // e.g. 'calc(100dvh - 64px)' if your layout has a top header
const BACK_ROUTE = '/products';
const FULL_EDITOR_ROUTE = (id: string) => `/products/${id}`;
const STORE_KEY = 'kw_pricesheet_v2';
const CTRL_W = 92;
const HEAD_H = 34;

// ============================================================
// 🎨 THEMES (4 only, all easy on the eyes)
// ============================================================
type ThemeKey = 'daylight' | 'emerald' | 'sand' | 'midnight';
interface Theme {
    name: string; swatch: string; scheme: 'light' | 'dark';
    bg: string; panel: string; head: string; headText: string; border: string; text: string; muted: string;
    rowA: string; rowB: string; hover: string; accent: string; soft: string;
}
const THEMES: Record<ThemeKey, Theme> = {
    daylight: { name: 'Daylight', swatch: '#2563eb', scheme: 'light', bg: '#f6f7f9', panel: '#ffffff', head: '#eef0f4', headText: '#374151', border: '#dde1e7', text: '#111827', muted: '#6b7280', rowA: '#ffffff', rowB: '#fafbfc', hover: '#eaf2ff', accent: '#2563eb', soft: '#dbeafe' },
    emerald: { name: 'Khushbuwaala Green', swatch: '#059669', scheme: 'light', bg: '#f1f8f5', panel: '#ffffff', head: '#0b4f3c', headText: '#ecfdf5', border: '#cfe5da', text: '#0f1f19', muted: '#5b7a6c', rowA: '#ffffff', rowB: '#f6fbf8', hover: '#e1f4ea', accent: '#059669', soft: '#c9f0dc' },
    sand: { name: 'Sand (eye comfort)', swatch: '#b45309', scheme: 'light', bg: '#f3ecdd', panel: '#fbf7ee', head: '#e8dcc2', headText: '#4a3f2a', border: '#d8cbae', text: '#2b2418', muted: '#7a6d52', rowA: '#fbf7ee', rowB: '#f6f0e2', hover: '#efe3c6', accent: '#b45309', soft: '#f5deb3' },
    midnight: { name: 'Midnight', swatch: '#6366f1', scheme: 'dark', bg: '#0e1117', panel: '#151a23', head: '#1b212d', headText: '#cbd5e1', border: '#262e3b', text: '#e5e7eb', muted: '#94a3b8', rowA: '#12161e', rowB: '#151a23', hover: '#1e2a44', accent: '#818cf8', soft: '#27304f' },
};
const themeVars = (t: Theme): React.CSSProperties => ({
    '--kw-bg': t.bg, '--kw-panel': t.panel, '--kw-head': t.head, '--kw-headText': t.headText,
    '--kw-border': t.border, '--kw-text': t.text, '--kw-muted': t.muted, '--kw-rowA': t.rowA,
    '--kw-rowB': t.rowB, '--kw-hover': t.hover, '--kw-accent': t.accent, '--kw-soft': t.soft,
    colorScheme: t.scheme,
} as any);
const VarsCtx = createContext<React.CSSProperties>({});

// ============================================================
// 🧰 TYPES & HELPERS
// ============================================================
type ViewMode = 'products' | 'variants';
type Density = 'dense' | 'normal' | 'roomy';
const ROW_H: Record<Density, number> = { dense: 28, normal: 34, roomy: 44 };

interface Row { id: string; p: any; v?: any }
interface Sort { id: string; dir: 'asc' | 'desc' }
interface ColState { order: string[]; hidden: string[]; widths: Record<string, number>; frozen: number }
interface Filters {
    q: string; categories: string[]; brands: string[]; suppliers: string[]; sizes: string[];
    status: 'ALL' | 'LIVE' | 'HIDDEN'; stock: 'ALL' | 'IN' | 'LOW' | 'OUT'; lowThreshold: number;
    minPrice: string; maxPrice: string; flags: string[]; marginBelow: string;
}
const EMPTY_FILTERS: Filters = {
    q: '', categories: [], brands: [], suppliers: [], sizes: [], status: 'ALL', stock: 'ALL',
    lowThreshold: 10, minPrice: '', maxPrice: '', flags: [], marginBelow: '',
};
interface EditSpec {
    type: 'text' | 'number' | 'select' | 'bool'; entity: 'PRODUCT' | 'VARIANT'; field: string;
    target: (r: Row) => string | null; options?: { value: string; label: string }[];
    required?: boolean; upper?: boolean; positive?: boolean;
}
interface ColDef {
    id: string; label: string; width: number; min?: number; align?: 'left' | 'right' | 'center';
    views: ViewMode[]; superOnly?: boolean; off?: boolean; mono?: boolean; money?: boolean; zeroEmpty?: boolean;
    get: (r: Row) => any; text?: (r: Row) => string;
    render?: (r: Row, raw: any, ctx: Ctx) => React.ReactNode; edit?: EditSpec;
}
interface Ctx { isSuper: boolean; discountFor: (p: any, v: any) => any; offerPrice: (p: any, v: any) => number | null }
interface Preset { id: string; name: string; desc?: string; view: ViewMode; col: ColState; sort: Sort[]; filters?: Partial<Filters>; density?: Density; superOnly?: boolean; builtin?: boolean }
interface Change { t: { entity: 'PRODUCT' | 'VARIANT'; id: string; field: string }; from: any; to: any }

const num = (x: any) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const money = (x: any) => (x === null || x === undefined || x === '' ? '' : `৳${num(x).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
const vKey = (v: any) => `${num(v.size)}_${String(v.unit || 'ML').toUpperCase()}`;
const pStock = (p: any) => num(p.totalStock ?? p.stock);
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '');
const roundTo = (n: number, step: number) => (step > 1 ? Math.round(n / step) * step : Math.round(n));
const marginOf = (v: any) => {
    const c = num(v.costPrice), pr = num(v.price);
    if (c <= 0 || pr <= 0) return null;
    return { amt: pr - c, pct: ((pr - c) / pr) * 100 };
};
const csvCell = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const download = (name: string, text: string, type: string) => {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
};
const findVariant = (p: any, key: string) => (p.variants || []).find((v: any) => vKey(v) === key);
async function runPool<T>(items: T[], worker: (x: T) => Promise<any>, size = 4) {
    const q = [...items];
    await Promise.all(Array.from({ length: Math.min(size, q.length) }, async () => { while (q.length) await worker(q.shift() as T); }));
}

// ============================================================
// 🧱 TINY UI KIT (self-contained, no extra shadcn components needed)
// ============================================================
const inp = 'h-8 px-2 text-xs rounded-md border border-[var(--kw-border)] bg-[var(--kw-bg)] text-[var(--kw-text)] outline-none focus:border-[var(--kw-accent)]';

function Btn({ children, onClick, active, title, className, disabled }: any) {
    return (
        <button type="button" title={title} disabled={disabled} onClick={onClick}
            className={cn('h-8 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold select-none transition-colors disabled:opacity-40 shrink-0',
                'border-[var(--kw-border)] bg-[var(--kw-panel)] text-[var(--kw-text)] hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]',
                active && 'border-[var(--kw-accent)] text-[var(--kw-accent)]', className)}>
            {children}
        </button>
    );
}

function Popover({ trigger, children, align = 'left', width = 280 }: {
    trigger: (open: boolean, toggle: () => void) => React.ReactNode;
    children: React.ReactNode | ((close: () => void) => React.ReactNode); align?: 'left' | 'right'; width?: number;
}) {
    const vars = useContext(VarsCtx);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, sheet: false });
    const wrap = useRef<HTMLSpanElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const close = useCallback(() => setOpen(false), []);
    const toggle = () => {
        if (open) return setOpen(false);
        const r = wrap.current!.getBoundingClientRect();
        const vw = window.innerWidth;
        const left = Math.max(8, Math.min(align === 'right' ? r.right - width : r.left, vw - width - 8));
        setPos({ top: r.bottom + 4, left, sheet: vw < 640 });
        setOpen(true);
    };
    useEffect(() => {
        if (!open) return;
        const down = (e: MouseEvent) => { const t = e.target as Node; if (!wrap.current?.contains(t) && !panel.current?.contains(t)) setOpen(false); };
        const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        const rs = () => setOpen(false);
        document.addEventListener('mousedown', down); document.addEventListener('keydown', key); window.addEventListener('resize', rs);
        return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); window.removeEventListener('resize', rs); };
    }, [open]);
    return (
        <span ref={wrap} className="inline-flex" onClick={(e) => e.stopPropagation()}>
            {trigger(open, toggle)}
            {open && createPortal(
                <div ref={panel} style={{ ...vars, position: 'fixed', zIndex: 120, ...(pos.sheet ? { left: 8, right: 8, bottom: 8, maxHeight: '70dvh' } : { top: pos.top, left: pos.left, width, maxHeight: `calc(100dvh - ${pos.top + 12}px)` }) }}
                    className="overflow-auto rounded-lg border border-[var(--kw-border)] bg-[var(--kw-panel)] text-[var(--kw-text)] shadow-2xl text-xs">
                    {typeof children === 'function' ? children(close) : children}
                </div>, document.body)}
        </span>
    );
}

function Overlay({ title, subtitle, onClose, children, drawer }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; drawer?: boolean }) {
    const vars = useContext(VarsCtx);
    useEffect(() => {
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [onClose]);
    return createPortal(
        <div style={vars} className="fixed inset-0 z-[100] flex">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className={cn('relative flex flex-col bg-[var(--kw-panel)] text-[var(--kw-text)] shadow-2xl',
                drawer ? 'ml-auto h-full w-full sm:w-[min(1040px,96vw)]' : 'w-full sm:max-w-2xl max-h-[92dvh] mt-auto sm:m-auto rounded-t-xl sm:rounded-xl')}>
                <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--kw-border)]">
                    <div className="min-w-0">
                        <h2 className="text-sm font-extrabold truncate">{title}</h2>
                        {subtitle && <p className="text-[11px] text-[var(--kw-muted)] truncate">{subtitle}</p>}
                    </div>
                    <Btn onClick={onClose} title="Close (Esc)"><X className="w-4 h-4" /></Btn>
                </div>
                <div className="flex-1 overflow-auto">{children}</div>
            </div>
        </div>, document.body);
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label?: string; icon?: React.ReactNode; title?: string }[] }) {
    return (
        <div className="inline-flex rounded-md border border-[var(--kw-border)] p-0.5 bg-[var(--kw-panel)] shrink-0">
            {options.map((o) => (
                <button key={o.v} type="button" title={o.title} onClick={() => onChange(o.v)}
                    className={cn('h-7 px-2 rounded text-[11px] font-bold inline-flex items-center gap-1 transition-colors',
                        value === o.v ? 'bg-[var(--kw-accent)] text-white' : 'text-[var(--kw-text)] opacity-70 hover:opacity-100')}>
                    {o.icon}{o.label && <span className={o.icon ? 'hidden lg:inline' : ''}>{o.label}</span>}
                </button>
            ))}
        </div>
    );
}

function MultiPick({ label, options, value, onChange }: { label: string; options: { value: string; label: string; count?: number }[]; value: string[]; onChange: (v: string[]) => void }) {
    const [q, setQ] = useState('');
    const list = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
    return (
        <Popover width={240} trigger={(open, toggle) => (
            <Btn onClick={toggle} active={value.length > 0 || open} className="h-7">
                {label}{value.length > 0 && <span className="px-1.5 rounded-full bg-[var(--kw-accent)] text-white text-[10px]">{value.length}</span>}
                <ChevronDown className="w-3 h-3 opacity-60" />
            </Btn>
        )}>
            <div className="p-2 space-y-2">
                {options.length > 8 && <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`} className={cn(inp, 'w-full')} />}
                <div className="max-h-64 overflow-auto space-y-0.5">
                    {list.length === 0 && <p className="p-2 text-[var(--kw-muted)]">Nothing found</p>}
                    {list.map((o) => (
                        <label key={o.value} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)] cursor-pointer">
                            <input type="checkbox" checked={value.includes(o.value)} onChange={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])} />
                            <span className="flex-1 truncate">{o.label}</span>
                            {o.count !== undefined && <span className="opacity-50 text-[10px]">{o.count}</span>}
                        </label>
                    ))}
                </div>
                {value.length > 0 && <button className="text-[11px] font-bold text-rose-500" onClick={() => onChange([])}>Clear selection</button>}
            </div>
        </Popover>
    );
}

/** Small field used inside drawers: commits on blur / Enter */
function MiniField({ value, type = 'text', options, onSave, upper, className, zeroEmpty }: {
    value: any; type?: 'text' | 'number' | 'select'; options?: { value: string; label: string }[];
    onSave: (v: any) => void; upper?: boolean; className?: string; zeroEmpty?: boolean;
}) {
    const show = (x: any) => (x === null || x === undefined || (zeroEmpty && num(x) === 0) ? '' : String(x));
    const [d, setD] = useState(show(value));
    useEffect(() => setD(show(value)), [value]); // eslint-disable-line react-hooks/exhaustive-deps
    const commit = () => {
        if (type === 'number') {
            const t = d.trim().replace(/[৳,\s]/g, '');
            const n = t === '' ? 0 : Number(t);
            if (Number.isNaN(n) || n < 0) { toast.error('Enter a valid positive number'); setD(show(value)); return; }
            if (n !== num(value)) onSave(n);
            return;
        }
        const v = upper ? d.trim().toUpperCase() : d.trim();
        if (v !== String(value ?? '')) onSave(v);
    };
    if (type === 'select') {
        return (
            <select value={String(value ?? '')} onChange={(e) => onSave(e.target.value)} className={cn(inp, 'w-full', className)}>
                {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        );
    }
    return (
        <input value={d} onChange={(e) => setD(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setD(show(value)); (e.target as HTMLInputElement).blur(); } }}
            inputMode={type === 'number' ? 'decimal' : undefined}
            className={cn(inp, 'w-full', type === 'number' && 'text-right font-mono', className)} />
    );
}

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!on)} className={cn('w-9 h-5 rounded-full relative transition-colors shrink-0', on ? 'bg-emerald-500' : 'bg-gray-400/50')}>
            <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', on ? 'left-[18px]' : 'left-0.5')} />
        </button>
    );
}

// ============================================================
// 🧬 COLUMN DEFINITIONS
// ============================================================
const nameNode = (p: any) => (
    <span className="flex items-center gap-2 min-w-0">
        <span className="relative w-5 h-5 rounded-sm overflow-hidden shrink-0 border border-[var(--kw-border)] bg-[var(--kw-head)]">
            {p.primaryImage && <Image src={p.primaryImage} alt="" fill sizes="20px" className="object-cover" />}
        </span>
        <span className="truncate font-semibold">{p.name}</span>
    </span>
);
const liveNode = (on: boolean) => (
    <span className={cn('inline-flex items-center justify-center w-7 h-5 rounded', on ? 'text-emerald-600 bg-emerald-500/15' : 'text-gray-400 bg-gray-500/10')}>
        {on ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
    </span>
);

function buildColumns(sizeCols: { key: string; label: string }[], categories: any[]): ColDef[] {
    const P: ViewMode[] = ['products'];
    const V: ViewMode[] = ['variants'];
    const catOptions = categories.map((c) => ({ value: c.id, label: c.categoryName }));
    const pEdit = (field: string, type: EditSpec['type'], extra: Partial<EditSpec> = {}): EditSpec => ({ entity: 'PRODUCT', field, type, target: (r) => r.p.id, ...extra });
    const vEdit = (field: string, type: EditSpec['type'], extra: Partial<EditSpec> = {}): EditSpec => ({ entity: 'VARIANT', field, type, target: (r) => r.v?.id ?? null, ...extra });
    const mTone = (pct: number) => (pct < 15 ? 'text-rose-500' : pct < 30 ? 'text-amber-500' : 'text-emerald-500');

    const cols: ColDef[] = [
        // ---------- PRODUCTS VIEW ----------
        { id: 'name', label: 'Product', width: 250, min: 140, views: P, get: (r) => r.p.name, edit: pEdit('name', 'text', { required: true }), render: (r) => nameNode(r.p) },
        { id: 'category', label: 'Category', width: 130, views: P, get: (r) => r.p.categoryId, text: (r) => r.p.category?.categoryName || '', edit: pEdit('categoryId', 'select', { options: catOptions }), render: (r) => <span className="truncate">{r.p.category?.categoryName || '—'}</span> },
        { id: 'live', label: 'Live', width: 64, align: 'center', views: P, get: (r) => !!r.p.published, edit: pEdit('published', 'bool'), render: (r) => liveNode(!!r.p.published) },
        { id: 'pstock', label: 'Stock', width: 100, align: 'right', views: P, mono: true, get: (r) => pStock(r.p), edit: pEdit('stock', 'number'), render: (r, raw) => <span>{raw}<span className="ml-1 text-[10px] opacity-60">{r.p.category?.unit || ''}</span></span> },
        ...sizeCols.map<ColDef>((sc) => ({
            id: `size:${sc.key}`, label: sc.label, width: 92, align: 'right', views: P, mono: true, money: true,
            get: (r) => findVariant(r.p, sc.key)?.price,
            edit: { entity: 'VARIANT', field: 'price', type: 'number', target: (r) => findVariant(r.p, sc.key)?.id ?? null },
            render: (r, raw) => { const v = findVariant(r.p, sc.key); if (!v) return <span className="opacity-30">—</span>; return <span className={cn(v.published === false && 'opacity-50 line-through')}>{money(raw)}</span>; },
        })),
        { id: 'range', label: 'Range', width: 120, align: 'right', views: P, mono: true, get: (r) => { const a = (r.p.variants || []).map((v: any) => num(v.price)); return a.length ? Math.min(...a) : 0; }, text: (r) => { const a = (r.p.variants || []).map((v: any) => num(v.price)); if (!a.length) return ''; const lo = Math.min(...a), hi = Math.max(...a); return lo === hi ? `${lo}` : `${lo}-${hi}`; }, render: (r) => { const a = (r.p.variants || []).map((v: any) => num(v.price)); if (!a.length) return '—'; const lo = Math.min(...a), hi = Math.max(...a); return <span className="opacity-80">{lo === hi ? money(lo) : `${money(lo)} – ${money(hi)}`}</span>; } },
        { id: 'brand', label: 'Brand', width: 120, views: P, off: true, get: (r) => r.p.brand, edit: pEdit('brand', 'text') },
        { id: 'supplier', label: 'Supplier', width: 130, views: P, off: true, get: (r) => r.p.supplier, edit: pEdit('supplier', 'text') },
        { id: 'sold', label: 'Sold', width: 72, align: 'right', views: P, mono: true, get: (r) => num(r.p.salesCount) },
        { id: 'vcount', label: 'Variants', width: 76, align: 'right', views: P, off: true, mono: true, get: (r) => (r.p.variants || []).length },
        { id: 'rating', label: 'Rating', width: 96, align: 'right', views: P, off: true, get: (r) => num(r.p.averageRating), render: (r, raw) => (raw ? <span>★ {Number(raw).toFixed(1)} <span className="opacity-50">({r.p.reviewCount || 0})</span></span> : <span className="opacity-30">—</span>) },
        { id: 'updated', label: 'Updated', width: 100, views: P, off: true, get: (r) => r.p.updatedAt, text: (r) => fmtDate(r.p.updatedAt), render: (r) => <span className="opacity-70">{fmtDate(r.p.updatedAt)}</span> },

        // ---------- VARIANTS VIEW ----------
        { id: 'vname', label: 'Product', width: 240, min: 140, views: V, get: (r) => r.p.name, render: (r) => nameNode(r.p) },
        { id: 'vcat', label: 'Category', width: 120, views: V, get: (r) => r.p.category?.categoryName || '' },
        { id: 'size', label: 'Size', width: 70, align: 'right', views: V, mono: true, get: (r) => num(r.v.size), edit: vEdit('size', 'number', { positive: true }) },
        { id: 'unit', label: 'Unit', width: 64, views: V, get: (r) => r.v.unit, edit: vEdit('unit', 'text', { required: true, upper: true }) },
        { id: 'sku', label: 'SKU', width: 160, views: V, mono: true, get: (r) => r.v.sku, edit: vEdit('sku', 'text', { required: true, upper: true }) },
        { id: 'price', label: 'Selling Price', width: 110, align: 'right', views: V, mono: true, money: true, get: (r) => r.v.price, edit: vEdit('price', 'number') },
        { id: 'compare', label: 'Regular Price', width: 110, align: 'right', views: V, mono: true, money: true, zeroEmpty: true, get: (r) => r.v.compareAtPrice, edit: vEdit('compareAtPrice', 'number') },
        { id: 'discpct', label: 'Markdown %', width: 96, align: 'right', views: V, mono: true, get: (r) => { const c = num(r.v.compareAtPrice), p = num(r.v.price); return c > p && p > 0 ? Math.round(((c - p) / c) * 100) : 0; }, render: (_r, raw) => (raw ? <span className="text-rose-500">-{raw}%</span> : <span className="opacity-30">—</span>) },
        { id: 'offer', label: 'Offer Price', width: 110, align: 'right', views: V, mono: true, get: (r) => r.v.price, render: (r, _raw, ctx) => { const o = ctx.offerPrice(r.p, r.v); return o === null ? <span className="opacity-30">—</span> : <span className="text-rose-500 font-bold" title="Active automatic discount applied">{money(o)}</span>; } },
        { id: 'cost', label: 'Cost Price', width: 104, align: 'right', views: V, superOnly: true, mono: true, money: true, zeroEmpty: true, get: (r) => r.v.costPrice, edit: vEdit('costPrice', 'number') },
        { id: 'margin', label: 'Margin ৳', width: 96, align: 'right', views: V, superOnly: true, mono: true, get: (r) => marginOf(r.v)?.amt ?? null, render: (_r, raw) => (raw === null ? <span className="opacity-30">—</span> : money(raw)) },
        { id: 'marginpct', label: 'Margin %', width: 92, align: 'right', views: V, superOnly: true, mono: true, get: (r) => marginOf(r.v)?.pct ?? null, render: (_r, raw) => (raw === null ? <span className="opacity-30">—</span> : <span className={cn('font-bold', mTone(raw))}>{raw.toFixed(1)}%</span>) },
        { id: 'vstock', label: 'Stock', width: 84, align: 'right', views: V, mono: true, get: (r) => num(r.v.stock), edit: vEdit('stock', 'number'), render: (r, raw) => <span className={cn(raw <= 0 ? 'text-rose-500 font-bold' : raw <= num(r.v.lowStockAlert ?? 5) && 'text-amber-500 font-bold')}>{raw}</span> },
        { id: 'vlive', label: 'Live', width: 64, align: 'center', views: V, get: (r) => r.v.published !== false, edit: vEdit('published', 'bool'), render: (r) => liveNode(r.v.published !== false) },
        { id: 'lowalert', label: 'Low-stock alert', width: 112, align: 'right', views: V, off: true, mono: true, get: (r) => r.v.lowStockAlert, edit: vEdit('lowStockAlert', 'number') },
        { id: 'barcode', label: 'Barcode', width: 130, views: V, off: true, mono: true, get: (r) => r.v.barcode, edit: vEdit('barcode', 'text') },
        { id: 'gtin', label: 'GTIN', width: 130, views: V, off: true, mono: true, get: (r) => r.v.gtin, edit: vEdit('gtin', 'text') },
        { id: 'mpn', label: 'MPN', width: 110, views: V, off: true, mono: true, get: (r) => r.v.mpn, edit: vEdit('mpn', 'text') },
        { id: 'weight', label: 'Weight (g)', width: 96, align: 'right', views: V, off: true, mono: true, zeroEmpty: true, get: (r) => r.v.weightGrams, edit: vEdit('weightGrams', 'number') },
        { id: 'isdef', label: 'Default', width: 70, align: 'center', views: V, off: true, get: (r) => !!r.v.isDefault, text: (r) => (r.v.isDefault ? 'Yes' : ''), render: (r) => (r.v.isDefault ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null) },
    ];
    return cols;
}

// ============================================================
// 📦 PRODUCT DRAWER (everything about one product in one place)
// ============================================================
const PKG_CATS = ['BOTTLE', 'PACKAGING', 'LABEL', 'GIFT_WRAP', 'OTHER'];
const BUY_CATS = ['STOCK_BILL', 'CARRYING', 'OTHER'];
type DrawerSave = (entity: 'PRODUCT' | 'VARIANT', id: string, field: string, value: any, prev: any) => Promise<boolean>;

function VariantCostRow({ p, v, wac, save }: { p: any; v: any; wac: number; save: any }) {
    const { data, isFetching } = useGetPackagingCostsQuery(v.sku);
    const [setCosts, { isLoading: saving }] = useSetPackagingCostsMutation();
    const [open, setOpen] = useState(false);
    const [lines, setLines] = useState<{ category: string; label?: string; amount: number | string }[]>([]);
    const serverLines = (data as any)?.data?.costLines;
    useEffect(() => { setLines((serverLines || []).map((l: any) => ({ ...l }))); }, [serverLines]);
    const pkg = (data as any)?.data?.totalCost ?? 0;
    const liquid = wac * num(v.size);
    const total = liquid + num(pkg);
    const profit = num(v.price) - total;
    const pct = num(v.price) > 0 ? (profit / num(v.price)) * 100 : 0;
    const linesTotal = lines.reduce((s, l) => s + num(l.amount), 0);
    const submit = async () => {
        try {
            await setCosts({ sku: v.sku, costLines: lines.filter((l) => num(l.amount) >= 0 && l.amount !== '').map((l) => ({ category: l.category as any, label: l.label || undefined, amount: num(l.amount) })) }).unwrap();
            toast.success(`Packaging cost saved for ${v.sku}`);
        } catch (e: any) { toast.error(e?.data?.message || 'Failed to save packaging cost'); }
    };
    return (
        <>
            <tr className="border-b border-[var(--kw-border)]">
                <td className="px-2 py-1.5 font-semibold whitespace-nowrap">{v.size} {v.unit}<div className="text-[10px] font-mono opacity-50">{v.sku}</div></td>
                <td className="px-2 text-right font-mono">{money(v.price)}</td>
                <td className="px-2 text-right font-mono">{wac ? money(liquid) : <span className="opacity-40">no WAC</span>}</td>
                <td className="px-2 text-right font-mono">{isFetching ? '…' : money(pkg)}</td>
                <td className="px-2 text-right font-mono font-bold">{money(total)}</td>
                <td className={cn('px-2 text-right font-mono font-bold', profit < 0 ? 'text-rose-500' : 'text-emerald-500')}>{money(profit)} <span className="text-[10px]">({pct.toFixed(0)}%)</span></td>
                <td className="px-2"><Btn onClick={() => setOpen((o) => !o)} className="h-6">{open ? 'Close' : 'Edit packaging'}</Btn></td>
            </tr>
            {open && (
                <tr className="bg-[var(--kw-bg)]"><td colSpan={7} className="p-3">
                    <div className="space-y-2 max-w-xl">
                        <p className="font-bold">Packaging cost lines for {v.sku} <span className="font-normal opacity-60">(bottle, box, label… per piece)</span></p>
                        {lines.map((l, i) => (
                            <div key={i} className="flex gap-2">
                                <select value={l.category} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, category: e.target.value } : x)))} className={cn(inp, 'w-32')}>
                                    {PKG_CATS.map((c) => <option key={c}>{c}</option>)}
                                </select>
                                <input value={l.label || ''} placeholder="Label (optional)" onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} className={cn(inp, 'flex-1 min-w-0')} />
                                <input value={l.amount} placeholder="৳" inputMode="decimal" onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={cn(inp, 'w-24 text-right font-mono')} />
                                <Btn onClick={() => setLines(lines.filter((_, k) => k !== i))} className="h-8 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></Btn>
                            </div>
                        ))}
                        <div className="flex items-center gap-2">
                            <Btn onClick={() => setLines([...lines, { category: 'BOTTLE', amount: '' }])}><Plus className="w-3.5 h-3.5" /> Add line</Btn>
                            <Btn onClick={submit} disabled={saving} className="!bg-[var(--kw-accent)] !text-white !border-transparent">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save</Btn>
                            <span className="ml-auto font-mono font-bold">Total {money(linesTotal)}</span>
                        </div>
                    </div>
                </td></tr>
            )}
        </>
    );
}

function ReceiveStockCard({ p, wac }: { p: any; wac: number }) {
    const [receive, { isLoading }] = useReceiveStockPurchaseMutation();
    const [qty, setQty] = useState('');
    const [supplier, setSupplier] = useState(p.supplier || '');
    const [billNo, setBillNo] = useState('');
    const [note, setNote] = useState('');
    const [lines, setLines] = useState<{ category: string; amount: string }[]>([{ category: 'STOCK_BILL', amount: '' }, { category: 'CARRYING', amount: '' }]);
    const total = lines.reduce((s, l) => s + num(l.amount), 0);
    const q = num(qty);
    const stock = pStock(p);
    const newWac = q > 0 ? (stock * wac + total) / (stock + q) : wac;
    const submit = async () => {
        if (q <= 0) return toast.error('Enter quantity received');
        if (total <= 0) return toast.error('Enter at least the stock bill amount');
        try {
            await receive({ productId: p.id, payload: { quantity: q, unit: p.category?.unit || undefined, supplier: supplier || undefined, billNo: billNo || undefined, note: note || undefined, costLines: lines.filter((l) => num(l.amount) > 0).map((l) => ({ category: l.category as any, amount: num(l.amount) })) } }).unwrap();
            toast.success('Stock received and average cost updated');
            setQty(''); setBillNo(''); setNote(''); setLines(lines.map((l) => ({ ...l, amount: '' })));
        } catch (e: any) { toast.error(e?.data?.message || 'Failed to receive stock'); }
    };
    return (
        <div className="rounded-lg border border-[var(--kw-border)] p-3 space-y-2">
            <h4 className="font-extrabold flex items-center gap-1.5"><Package className="w-4 h-4" /> Receive new stock (updates average cost)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="space-y-1"><span className="opacity-60">Quantity ({p.category?.unit || 'unit'})</span><input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className={cn(inp, 'w-full text-right font-mono')} /></label>
                <label className="space-y-1"><span className="opacity-60">Supplier</span><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={cn(inp, 'w-full')} /></label>
                <label className="space-y-1"><span className="opacity-60">Bill no.</span><input value={billNo} onChange={(e) => setBillNo(e.target.value)} className={cn(inp, 'w-full')} /></label>
                <label className="space-y-1"><span className="opacity-60">Note</span><input value={note} onChange={(e) => setNote(e.target.value)} className={cn(inp, 'w-full')} /></label>
            </div>
            {lines.map((l, i) => (
                <div key={i} className="flex gap-2">
                    <select value={l.category} onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, category: e.target.value } : x)))} className={cn(inp, 'w-36')}>{BUY_CATS.map((c) => <option key={c}>{c}</option>)}</select>
                    <input value={l.amount} placeholder="Amount ৳" inputMode="decimal" onChange={(e) => setLines(lines.map((x, k) => (k === i ? { ...x, amount: e.target.value } : x)))} className={cn(inp, 'w-32 text-right font-mono')} />
                    {lines.length > 1 && <Btn onClick={() => setLines(lines.filter((_, k) => k !== i))} className="text-rose-500"><Trash2 className="w-3.5 h-3.5" /></Btn>}
                </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
                <Btn onClick={() => setLines([...lines, { category: 'OTHER', amount: '' }])}><Plus className="w-3.5 h-3.5" /> Line</Btn>
                <span className="font-mono">Bill total <b>{money(total)}</b></span>
                {q > 0 && total > 0 && <span className="font-mono opacity-80">· cost/unit {money(total / q)} · new avg {money(newWac)}</span>}
                <Btn onClick={submit} disabled={isLoading} className="ml-auto !bg-[var(--kw-accent)] !text-white !border-transparent">{isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Receive stock</Btn>
            </div>
        </div>
    );
}

function ProductDrawer({ p, categories, isSuper, save, onClose, onFull }: { p: any; categories: any[]; isSuper: boolean; save: DrawerSave; onClose: () => void; onFull: () => void }) {
    const [tab, setTab] = useState<'overview' | 'variants' | 'costing' | 'history'>('overview');
    const { data: wacRes } = useGetLiveWACQuery(p.id, { skip: !isSuper || tab !== 'costing' });
    const { data: logsRes, isFetching: logsLoading } = useGetStockLogsQuery(p.id, { skip: tab !== 'history' });
    const wac = num((wacRes as any)?.data?.avgCostPerUnit);
    const last = num((wacRes as any)?.data?.lastCostPerUnit);
    const logs: any[] = Array.isArray(logsRes) ? (logsRes as any) : (logsRes as any)?.data || [];
    const catOptions = categories.map((c) => ({ value: c.id, label: c.categoryName }));
    const tabs = [{ v: 'overview', l: 'Overview' }, { v: 'variants', l: `Variants (${p.variants.length})` }, ...(isSuper ? [{ v: 'costing', l: 'Costing & Margin' }] : []), { v: 'history', l: 'Stock history' }] as const;
    const field = (label: string, node: React.ReactNode) => <label className="space-y-1 block"><span className="text-[11px] font-bold uppercase tracking-wide opacity-60">{label}</span>{node}</label>;
    return (
        <Overlay drawer title={p.name} subtitle={`${p.category?.categoryName || ''} · ${p.variants.length} variants · stock ${pStock(p)} ${p.category?.unit || ''}`} onClose={onClose}>
            <div className="flex gap-1 px-3 pt-2 border-b border-[var(--kw-border)] overflow-x-auto">
                {tabs.map((t) => (
                    <button key={t.v} onClick={() => setTab(t.v as any)} className={cn('px-3 py-2 text-xs font-bold border-b-2 whitespace-nowrap', tab === t.v ? 'border-[var(--kw-accent)] text-[var(--kw-accent)]' : 'border-transparent opacity-60 hover:opacity-100')}>{t.l}</button>
                ))}
                <button onClick={onFull} className="ml-auto px-3 py-2 text-xs font-bold text-[var(--kw-accent)] whitespace-nowrap">Open full editor →</button>
            </div>
            <div className="p-4 text-xs">
                {tab === 'overview' && (
                    <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
                        {field('Product name', <MiniField value={p.name} onSave={(v) => v && save('PRODUCT', p.id, 'name', v, p.name)} />)}
                        {field('Category', <MiniField type="select" value={p.categoryId} options={catOptions} onSave={(v) => save('PRODUCT', p.id, 'categoryId', v, p.categoryId)} />)}
                        {field('Brand', <MiniField value={p.brand} onSave={(v) => save('PRODUCT', p.id, 'brand', v, p.brand)} />)}
                        {field('Supplier', <MiniField value={p.supplier} onSave={(v) => save('PRODUCT', p.id, 'supplier', v, p.supplier)} />)}
                        {field(`Total stock (${p.category?.unit || 'unit'})`, <MiniField type="number" value={pStock(p)} onSave={(v) => save('PRODUCT', p.id, 'stock', v, pStock(p))} />)}
                        {field('Visible on website', <div className="flex items-center gap-2 h-8"><Switch on={!!p.published} onChange={(v) => save('PRODUCT', p.id, 'published', v, !!p.published)} /><span>{p.published ? 'Live' : 'Hidden'}</span></div>)}
                        <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--kw-border)]">
                            {[['Sold', p.salesCount ?? 0], ['Rating', p.averageRating ? `★ ${Number(p.averageRating).toFixed(1)} (${p.reviewCount || 0})` : '—'], ['Created', fmtDate(p.createdAt)], ['Updated', fmtDate(p.updatedAt)]].map(([a, b]) => (
                                <div key={String(a)} className="rounded-md bg-[var(--kw-bg)] p-2"><div className="opacity-60 text-[10px] uppercase font-bold">{a}</div><div className="font-bold">{b as any}</div></div>
                            ))}
                        </div>
                    </div>
                )}
                {tab === 'variants' && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead><tr className="text-left text-[10px] uppercase opacity-60">{['Size', 'Unit', 'SKU', 'Selling', 'Regular', ...(isSuper ? ['Cost', 'Margin'] : []), 'Stock', 'Alert', 'Barcode', 'Live'].map((h) => <th key={h} className="px-1.5 py-1 font-bold">{h}</th>)}</tr></thead>
                            <tbody>
                                {p.variants.map((v: any) => {
                                    const m = marginOf(v);
                                    const sv = (f: string, val: any, prev: any) => save('VARIANT', v.id, f, val, prev);
                                    return (
                                        <tr key={v.id} className="border-t border-[var(--kw-border)]">
                                            <td className="p-1 w-16"><MiniField type="number" value={v.size} onSave={(x) => sv('size', x, v.size)} /></td>
                                            <td className="p-1 w-16"><MiniField upper value={v.unit} onSave={(x) => sv('unit', x, v.unit)} /></td>
                                            <td className="p-1 w-40"><MiniField upper value={v.sku} onSave={(x) => sv('sku', x, v.sku)} className="font-mono" /></td>
                                            <td className="p-1 w-24"><MiniField type="number" value={v.price} onSave={(x) => sv('price', x, v.price)} /></td>
                                            <td className="p-1 w-24"><MiniField type="number" zeroEmpty value={v.compareAtPrice} onSave={(x) => sv('compareAtPrice', x, v.compareAtPrice)} /></td>
                                            {isSuper && <td className="p-1 w-24"><MiniField type="number" zeroEmpty value={v.costPrice} onSave={(x) => sv('costPrice', x, v.costPrice)} /></td>}
                                            {isSuper && <td className="p-1 w-24 font-mono text-right">{m ? <span className={m.pct < 15 ? 'text-rose-500' : m.pct < 30 ? 'text-amber-500' : 'text-emerald-500'}>{m.pct.toFixed(0)}%</span> : '—'}</td>}
                                            <td className="p-1 w-20"><MiniField type="number" value={v.stock} onSave={(x) => sv('stock', x, v.stock)} /></td>
                                            <td className="p-1 w-16"><MiniField type="number" value={v.lowStockAlert} onSave={(x) => sv('lowStockAlert', x, v.lowStockAlert)} /></td>
                                            <td className="p-1 w-32"><MiniField value={v.barcode} onSave={(x) => sv('barcode', x, v.barcode)} /></td>
                                            <td className="p-1"><Switch on={v.published !== false} onChange={(x) => sv('published', x, v.published !== false)} /></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <p className="mt-3 opacity-60">Adding or removing a variant is done in the full editor. Everything else saves the moment you leave a field.</p>
                    </div>
                )}
                {tab === 'costing' && isSuper && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[['Average cost / ' + (p.category?.unit || 'unit'), wac ? money(wac) : '—'], ['Last purchase / ' + (p.category?.unit || 'unit'), last ? money(last) : '—'], ['Stock on hand', `${pStock(p)} ${p.category?.unit || ''}`], ['Stock value', wac ? money(wac * pStock(p)) : '—']].map(([a, b]) => (
                                <div key={a} className="rounded-md bg-[var(--kw-bg)] p-2"><div className="opacity-60 text-[10px] uppercase font-bold">{a}</div><div className="font-extrabold text-sm">{b}</div></div>
                            ))}
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-[var(--kw-border)]">
                            <table className="w-full min-w-[760px]">
                                <thead><tr className="text-left text-[10px] uppercase opacity-60 bg-[var(--kw-bg)]">{['Variant', 'Price', 'Liquid cost', 'Packaging', 'True cost', 'Profit', ''].map((h) => <th key={h} className="px-2 py-1.5 font-bold">{h}</th>)}</tr></thead>
                                <tbody>{p.variants.map((v: any) => <VariantCostRow key={v.id} p={p} v={v} wac={wac} save={save} />)}</tbody>
                            </table>
                        </div>
                        <p className="opacity-60">True cost = average liquid cost × size + packaging lines. This is the same formula your profit reports use for new orders.</p>
                        <ReceiveStockCard p={p} wac={wac} />
                    </div>
                )}
                {tab === 'history' && (
                    <div>
                        {logsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : logs.length === 0 ? <p className="opacity-60">No stock movements recorded yet.</p> : (
                            <table className="w-full max-w-2xl">
                                <thead><tr className="text-left text-[10px] uppercase opacity-60"><th className="py-1">Date</th><th className="text-right">Change</th><th className="pl-4">Reason</th></tr></thead>
                                <tbody>{logs.map((l: any) => (
                                    <tr key={l.id} className="border-t border-[var(--kw-border)]">
                                        <td className="py-1.5 whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        <td className={cn('text-right font-mono font-bold', l.change < 0 ? 'text-rose-500' : 'text-emerald-500')}>{l.change > 0 ? '+' : ''}{l.change}</td>
                                        <td className="pl-4 opacity-80">{l.reason}</td>
                                    </tr>))}</tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </Overlay>
    );
}

// ============================================================
// 🧮 BULK EDIT MODAL
// ============================================================
function BulkModal({ targets, sizeOptions, isSuper, selCount, onClose, onApply, onVisibility }: {
    targets: { p: any; v: any }[]; sizeOptions: { value: string; label: string }[]; isSuper: boolean; selCount: number;
    onClose: () => void; onApply: (c: { p: any; v: any; field: string; from: number; to: number }[]) => Promise<void>; onVisibility: (live: boolean) => Promise<void>;
}) {
    const [field, setField] = useState<'price' | 'compareAtPrice' | 'costPrice'>('price');
    const [mode, setMode] = useState<'percent' | 'add' | 'set' | 'ofPrice'>('percent');
    const [amount, setAmount] = useState('');
    const [step, setStep] = useState(1);
    const [sizes, setSizes] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const changes = useMemo(() => {
        const a = Number(amount);
        if (amount.trim() === '' || !Number.isFinite(a)) return [];
        return targets.filter((t) => !sizes.length || sizes.includes(vKey(t.v))).map(({ p, v }) => {
            const cur = num(v[field]);
            let nv = cur;
            if (mode === 'percent') nv = cur * (1 + a / 100);
            else if (mode === 'add') nv = cur + a;
            else if (mode === 'set') nv = a;
            else nv = (num(v.price) * a) / 100;
            return { p, v, field, from: cur, to: Math.max(0, roundTo(nv, step)) };
        }).filter((c) => c.from !== c.to);
    }, [targets, sizes, field, mode, amount, step]);
    const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); onClose(); } finally { setBusy(false); } };
    const modes = [{ v: 'percent', l: '± Percent' }, { v: 'add', l: '± Amount (৳)' }, { v: 'set', l: 'Set exact (৳)' }, { v: 'ofPrice', l: '% of selling price' }] as const;
    return (
        <Overlay title="Bulk edit" subtitle={`${selCount} row${selCount === 1 ? '' : 's'} selected · ${targets.length} variants affected`} onClose={onClose}>
            <div className="p-4 space-y-4 text-xs">
                <section className="space-y-2">
                    <h3 className="font-extrabold flex items-center gap-1.5"><Calculator className="w-4 h-4" /> Change prices</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <label className="space-y-1"><span className="opacity-60">Field</span>
                            <select value={field} onChange={(e) => setField(e.target.value as any)} className={cn(inp, 'w-full')}>
                                <option value="price">Selling price</option><option value="compareAtPrice">Regular price</option>{isSuper && <option value="costPrice">Cost price</option>}
                            </select></label>
                        <label className="space-y-1"><span className="opacity-60">Round to nearest</span>
                            <select value={step} onChange={(e) => setStep(Number(e.target.value))} className={cn(inp, 'w-full')}>
                                <option value={1}>৳1</option><option value={5}>৳5</option><option value={10}>৳10</option><option value={50}>৳50</option>
                            </select></label>
                    </div>
                    <Seg value={mode} onChange={setMode} options={modes.map((m) => ({ v: m.v, label: m.l }))} />
                    <div className="flex flex-wrap items-center gap-2">
                        <input autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={mode === 'percent' ? 'e.g. 10 or -5' : mode === 'ofPrice' ? 'e.g. 125' : 'e.g. 50'} inputMode="decimal" className={cn(inp, 'w-32 text-right font-mono')} />
                        <MultiPick label="Only sizes" options={sizeOptions} value={sizes} onChange={setSizes} />
                    </div>
                    {changes.length > 0 ? (
                        <div className="rounded-lg border border-[var(--kw-border)] overflow-hidden">
                            <div className="px-3 py-1.5 bg-[var(--kw-bg)] font-bold">{changes.length} variant{changes.length > 1 ? 's' : ''} will change · preview</div>
                            <div className="max-h-48 overflow-auto">{changes.slice(0, 40).map((c) => (
                                <div key={c.v.id} className="flex items-center gap-2 px-3 py-1 border-t border-[var(--kw-border)]">
                                    <span className="flex-1 truncate">{c.p.name} <span className="opacity-60">{c.v.size}{c.v.unit}</span></span>
                                    <span className="font-mono opacity-60">{money(c.from)}</span><span>→</span>
                                    <span className="font-mono font-bold">{money(c.to)}</span>
                                </div>))}
                                {changes.length > 40 && <p className="px-3 py-1 opacity-60">…and {changes.length - 40} more</p>}</div>
                        </div>
                    ) : <p className="opacity-60">Type a value to preview the result before anything is saved.</p>}
                    <Btn disabled={!changes.length || busy} onClick={() => run(() => onApply(changes))} className="!bg-[var(--kw-accent)] !text-white !border-transparent w-full h-9">
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Apply to {changes.length} variants
                    </Btn>
                </section>
                <section className="space-y-2 pt-3 border-t border-[var(--kw-border)]">
                    <h3 className="font-extrabold flex items-center gap-1.5"><Eye className="w-4 h-4" /> Visibility</h3>
                    <div className="flex gap-2">
                        <Btn disabled={busy} onClick={() => run(() => onVisibility(true))}><Eye className="w-3.5 h-3.5" /> Set selected Live</Btn>
                        <Btn disabled={busy} onClick={() => run(() => onVisibility(false))}><EyeOff className="w-3.5 h-3.5" /> Hide selected</Btn>
                    </div>
                </section>
                <p className="opacity-60">Every bulk change can be undone with Ctrl+Z (or the Undo button) right after.</p>
            </div>
        </Overlay>
    );
}

// ============================================================
// 📊 MAIN PAGE
// ============================================================
export default function DedicatedPriceListPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isSuper = user?.role === 'SUPER_ADMIN';
    const userRole = user?.role;

    // Only Super Admin and Admin may use the price sheet
    useEffect(() => {
        if (userRole && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') router.replace('/');
    }, [userRole, router]);

    const { data: productsRes, isLoading, isFetching, isError, refetch } = useGetAllProductsAdminQuery({ page: 1, limit: 10000 }, { refetchOnMountOrArgChange: true });
    const { data: catRes } = useGetAllCategoriesAdminQuery();
    const { data: discRes } = useGetAllDiscountsAdminQuery();
    const [quickUpdateCell] = useQuickUpdateCellMutation();

    const rawProducts: any[] = useMemo(() => (productsRes as any)?.data || [], [productsRes]);
    const categories: any[] = useMemo(() => {
        const c: any = catRes;
        return c?.data?.data || (Array.isArray(c?.data) ? c.data : []) || [];
    }, [catRes]);
    const discounts: any[] = useMemo(() => (Array.isArray(discRes) ? discRes : (discRes as any)?.data || []), [discRes]);
    const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

    // ---------- preferences ----------
    const [hydrated, setHydrated] = useState(false);
    const [themeKey, setThemeKey] = useState<ThemeKey>('daylight');
    const [density, setDensity] = useState<Density>('normal');
    const [view, setView] = useState<ViewMode>('products');
    const [colStates, setColStates] = useState<Record<ViewMode, ColState | null>>({ products: null, variants: null });
    const [sorts, setSorts] = useState<Record<ViewMode, Sort[]>>({ products: [{ id: 'name', dir: 'asc' }], variants: [{ id: 'vname', dir: 'asc' }] });
    const [customPresets, setCustomPresets] = useState<Preset[]>([]);
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(true);

    // ---------- grid state ----------
    const [overrides, setOverrides] = useState<Record<string, any>>({});
    const [cellStates, setCellStates] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});
    const [active, setActive] = useState<{ rowId: string; colId: string } | null>(null);
    const [editing, setEditing] = useState<{ rowId: string; colId: string; initial?: string } | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [drawerPid, setDrawerPid] = useState<string | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [dropTarget, setDropTarget] = useState<string | null>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [vh, setVh] = useState(600);
    const [isNarrow, setIsNarrow] = useState(false);
    const [undoCount, setUndoCount] = useState(0);
    const [presetName, setPresetName] = useState('');

    const undoRef = useRef<Change[][]>([]);
    const dragId = useRef<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const rafRef = useRef<number | null>(null);

    const theme = THEMES[themeKey];
    const vars = useMemo(() => themeVars(theme), [theme]);
    const rowH = ROW_H[density];

    // hydrate + persist
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (s.theme && THEMES[s.theme as ThemeKey]) setThemeKey(s.theme);
                if (s.density && ROW_H[s.density as Density]) setDensity(s.density);
                if (s.view === 'products' || s.view === 'variants') setView(s.view);
                if (s.colStates) setColStates((p) => ({ ...p, ...s.colStates }));
                if (s.sorts) setSorts((p) => ({ ...p, ...s.sorts }));
                if (Array.isArray(s.presets)) setCustomPresets(s.presets);
            }
        } catch { /* ignore */ }
        setHydrated(true);
    }, []);
    useEffect(() => {
        if (!hydrated) return;
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ theme: themeKey, density, view, colStates, sorts, presets: customPresets })); } catch { /* ignore */ }
    }, [hydrated, themeKey, density, view, colStates, sorts, customPresets]);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const f = () => setIsNarrow(mq.matches);
        f(); mq.addEventListener('change', f);
        return () => mq.removeEventListener('change', f);
    }, []);
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setVh(el.clientHeight));
        ro.observe(el); setVh(el.clientHeight);
        return () => ro.disconnect();
    }, []);
    useEffect(() => {
        const k = (e: KeyboardEvent) => {
            const tag = (document.activeElement?.tagName || '').toUpperCase();
            if (e.key === '/' && !editing && !['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) { e.preventDefault(); searchRef.current?.focus(); }
        };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [editing]);

    // ---------- merged data ----------
    const merged = useMemo(() => rawProducts.map((p) => {
        const po = overrides[`PRODUCT:${p.id}`];
        const variants = (p.variants || []).map((v: any) => ({ ...v, ...(overrides[`VARIANT:${v.id}`] || {}) }))
            .sort((a: any, b: any) => num(a.size) - num(b.size) || String(a.unit).localeCompare(String(b.unit)));
        const base: any = { ...p, ...(po || {}), variants };
        if (po?.categoryId) base.category = catById.get(po.categoryId) || p.category;
        if (po && 'stock' in po) base.totalStock = po.stock;
        return base;
    }), [rawProducts, overrides, catById]);

    const sizeCols = useMemo(() => {
        const m = new Map<string, { key: string; size: number; label: string }>();
        merged.forEach((p) => (p.variants || []).forEach((v: any) => {
            const k = vKey(v);
            if (!m.has(k)) m.set(k, { key: k, size: num(v.size), label: `${num(v.size)} ${String(v.unit || 'ML').toUpperCase()}` });
        }));
        return Array.from(m.values()).sort((a, b) => a.size - b.size || a.label.localeCompare(b.label));
    }, [merged]);

    // ---------- discounts ----------
    const activeAuto = useMemo(() => {
        const now = new Date();
        return discounts.filter((d: any) => !d.code && (!d.startDate || new Date(d.startDate) <= now) && (!d.endDate || new Date(d.endDate) >= now));
    }, [discounts]);
    const discountFor = useCallback((p: any, v: any) =>
        activeAuto.find((d: any) => d.scope === 'VARIANT' && d.variantId === v.id) || activeAuto.find((d: any) => d.scope === 'PRODUCT' && d.productId === p.id) || null, [activeAuto]);
    const offerPrice = useCallback((p: any, v: any) => {
        const d = discountFor(p, v);
        if (!d) return null;
        const pr = num(v.price);
        return Math.round(d.type === 'percentage' ? pr * (1 - num(d.value) / 100) : Math.max(0, pr - num(d.value)));
    }, [discountFor]);
    const ctx: Ctx = useMemo(() => ({ isSuper, discountFor, offerPrice }), [isSuper, discountFor, offerPrice]);

    // ---------- columns ----------
    const allCols = useMemo(() => buildColumns(sizeCols, categories), [sizeCols, categories]);
    const defsFor = useCallback((vw: ViewMode) => allCols.filter((c) => c.views.includes(vw) && (!c.superOnly || isSuper)), [allCols, isSuper]);
    const defaultState = useCallback((vw: ViewMode): ColState => {
        const d = defsFor(vw);
        return { order: d.map((c) => c.id), hidden: d.filter((c) => c.off).map((c) => c.id), widths: {}, frozen: 1 };
    }, [defsFor]);
    const stateOf = (vw: ViewMode): ColState => colStates[vw] ?? defaultState(vw);
    const patchCols = (vw: ViewMode, fn: (s: ColState) => ColState) => setColStates((prev) => ({ ...prev, [vw]: fn(prev[vw] ?? defaultState(vw)) }));
    const orderedDefs = useCallback((vw: ViewMode) => {
        const defs = defsFor(vw);
        const st = colStates[vw] ?? defaultState(vw);
        const byId = new Map(defs.map((c) => [c.id, c]));
        const ids = st.order.filter((id) => byId.has(id));
        defs.forEach((c) => { if (!ids.includes(c.id)) ids.push(c.id); });
        return ids.map((id) => byId.get(id)!);
    }, [defsFor, colStates, defaultState]);
    const st = stateOf(view);
    const allOrdered = orderedDefs(view);
    const cols = allOrdered.filter((c) => !st.hidden.includes(c.id));
    const frozenN = Math.min(st.frozen, cols.length);
    const colW = (c: ColDef, idx: number) => { const w = st.widths[c.id] ?? c.width; return isNarrow && idx < frozenN ? Math.min(w, 150) : w; };
    const leftMap = useMemo(() => {
        const m: Record<string, number> = {};
        let x = CTRL_W;
        cols.forEach((c, i) => { if (i < frozenN) { m[c.id] = x; x += colW(c, i); } });
        return m;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cols, frozenN, st.widths, isNarrow]);
    const frozenW = CTRL_W + cols.slice(0, frozenN).reduce((s, c, i) => s + colW(c, i), 0);
    const totalW = CTRL_W + cols.reduce((s, c, i) => s + colW(c, i), 0);

    // ---------- filtering + sorting ----------
    const rows: Row[] = useMemo(() => {
        const q = filters.q.trim().toLowerCase();
        const minP = filters.minPrice !== '' ? Number(filters.minPrice) : null;
        const maxP = filters.maxPrice !== '' ? Number(filters.maxPrice) : null;
        const thr = filters.marginBelow !== '' ? Number(filters.marginBelow) : 30;
        const variantLevel = filters.sizes.length > 0 || minP !== null || maxP !== null || filters.flags.length > 0;
        const variantPass = (p: any, v: any) => {
            if (filters.sizes.length && !filters.sizes.includes(vKey(v))) return false;
            const pr = num(v.price);
            if (minP !== null && pr < minP) return false;
            if (maxP !== null && pr > maxP) return false;
            for (const f of filters.flags) {
                if (f === 'missingCost' && num(v.costPrice) > 0) return false;
                if (f === 'noCompare' && num(v.compareAtPrice) > 0) return false;
                if (f === 'discounted' && !(discountFor(p, v) || num(v.compareAtPrice) > pr)) return false;
                if (f === 'lowMargin') { const m = marginOf(v); if (!m || m.pct >= thr) return false; }
                if (f === 'noBarcode' && v.barcode) return false;
            }
            return true;
        };
        const stockOk = (s: number) => filters.stock === 'ALL' || (filters.stock === 'IN' && s > 0) || (filters.stock === 'LOW' && s > 0 && s <= filters.lowThreshold) || (filters.stock === 'OUT' && s <= 0);
        const productPass = (p: any) => {
            if (q) {
                const hit = [p.name, p.category?.categoryName, p.brand, p.supplier, ...(p.tags || [])].some((x) => String(x || '').toLowerCase().includes(q))
                    || (p.variants || []).some((v: any) => [v.sku, v.barcode, v.gtin].some((x) => String(x || '').toLowerCase().includes(q)));
                if (!hit) return false;
            }
            if (filters.categories.length && !filters.categories.includes(p.categoryId)) return false;
            if (filters.brands.length && !filters.brands.includes(p.brand || '')) return false;
            if (filters.suppliers.length && !filters.suppliers.includes(p.supplier || '')) return false;
            return true;
        };
        let out: Row[] = [];
        for (const p of merged) {
            if (!productPass(p)) continue;
            if (view === 'products') {
                if (filters.status === 'LIVE' && !p.published) continue;
                if (filters.status === 'HIDDEN' && p.published) continue;
                if (!stockOk(pStock(p))) continue;
                if (variantLevel && !(p.variants || []).some((v: any) => variantPass(p, v))) continue;
                out.push({ id: p.id, p });
            } else {
                for (const v of p.variants || []) {
                    const live = p.published && v.published !== false;
                    if (filters.status === 'LIVE' && !live) continue;
                    if (filters.status === 'HIDDEN' && live) continue;
                    if (!stockOk(num(v.stock))) continue;
                    if (!variantPass(p, v)) continue;
                    out.push({ id: v.id, p, v });
                }
            }
        }
        const sc = sorts[view].map((s) => ({ col: allCols.find((c) => c.id === s.id), dir: s.dir })).filter((s) => s.col) as { col: ColDef; dir: 'asc' | 'desc' }[];
        if (sc.length) {
            const key = (c: ColDef, r: Row) => (c.text ? c.text(r) : c.get(r));
            out = [...out].sort((a, b) => {
                for (const { col, dir } of sc) {
                    const x = key(col, a), y = key(col, b);
                    const xe = x === null || x === undefined || x === '', ye = y === null || y === undefined || y === '';
                    if (xe && ye) continue;
                    if (xe) return 1;
                    if (ye) return -1;
                    const c = typeof x === 'number' && typeof y === 'number' ? x - y : typeof x === 'boolean' ? Number(x) - Number(y) : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
                    if (c !== 0) return dir === 'asc' ? c : -c;
                }
                return 0;
            });
        }
        return out;
    }, [merged, filters, view, sorts, allCols, discountFor]);
    const rowIndex = useMemo(() => new Map(rows.map((r, i) => [r.id, i])), [rows]);

    const health = useMemo(() => {
        let out = 0, hidden = 0, noCost = 0, noCmp = 0, costData = false;
        merged.forEach((p) => {
            if (pStock(p) <= 0) out++;
            if (!p.published) hidden++;
            (p.variants || []).forEach((v: any) => { if (v.costPrice !== undefined) costData = true; if (!(num(v.costPrice) > 0)) noCost++; if (!(num(v.compareAtPrice) > 0)) noCmp++; });
        });
        return { out, hidden, noCost, noCmp, costData };
    }, [merged]);
    const brandOptions = useMemo(() => { const m = new Map<string, number>(); merged.forEach((p) => p.brand && m.set(p.brand, (m.get(p.brand) || 0) + 1)); return [...m].sort().map(([v, c]) => ({ value: v, label: v, count: c })); }, [merged]);
    const supplierOptions = useMemo(() => { const m = new Map<string, number>(); merged.forEach((p) => p.supplier && m.set(p.supplier, (m.get(p.supplier) || 0) + 1)); return [...m].sort().map(([v, c]) => ({ value: v, label: v, count: c })); }, [merged]);
    const categoryOptions = useMemo(() => categories.map((c) => ({ value: c.id, label: c.categoryName, count: c._count?.Product })), [categories]);
    const sizeOptions = useMemo(() => sizeCols.map((s) => ({ value: s.key, label: s.label })), [sizeCols]);

    const activeFilterCount = filters.categories.length + filters.brands.length + filters.suppliers.length + filters.sizes.length + filters.flags.length
        + (filters.status !== 'ALL' ? 1 : 0) + (filters.stock !== 'ALL' ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.q ? 1 : 0);
    const setF = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
    const toggleFlag = (flag: string) => setF({ flags: filters.flags.includes(flag) ? filters.flags.filter((x) => x !== flag) : [...filters.flags, flag] });

    // ---------- saving ----------
    const setCell = (key: string, s?: 'saving' | 'saved' | 'error') => setCellStates((p) => { const c = { ...p }; if (s) c[key] = s; else delete c[key]; return c; });
    const runCommit = useCallback(async (t: Change['t'], value: any, prev: any, cellKey?: string) => {
        const ok = `${t.entity}:${t.id}`;
        setOverrides((p) => ({ ...p, [ok]: { ...(p[ok] || {}), [t.field]: value } }));
        if (cellKey) setCell(cellKey, 'saving');
        try {
            await quickUpdateCell({ entity: t.entity, id: t.id, field: t.field, value }).unwrap();
            if (cellKey) { setCell(cellKey, 'saved'); setTimeout(() => setCell(cellKey), 1200); }
            return true;
        } catch (err: any) {
            setOverrides((p) => { const o = { ...(p[ok] || {}) }; if (prev === undefined) delete o[t.field]; else o[t.field] = prev; return { ...p, [ok]: o }; });
            if (cellKey) { setCell(cellKey, 'error'); setTimeout(() => setCell(cellKey), 2500); }
            toast.error(err?.data?.message || `Failed to update ${t.field}`);
            return false;
        }
    }, [quickUpdateCell]);
    const pushUndo = (g: Change[]) => { if (!g.length) return; undoRef.current.push(g); if (undoRef.current.length > 50) undoRef.current.shift(); setUndoCount(undoRef.current.length); };
    const undo = async () => {
        const g = undoRef.current.pop();
        setUndoCount(undoRef.current.length);
        if (!g) return void toast('Nothing to undo');
        await runPool(g, (c) => runCommit(c.t, c.from, c.to));
        toast.success('Undone');
    };
    const drawerSave: DrawerSave = async (entity, id, field, value, prev) => {
        const ok = await runCommit({ entity, id, field }, value, prev);
        if (ok) pushUndo([{ t: { entity, id, field }, from: prev, to: value }]);
        return ok;
    };

    const isEditable = (r: Row, c: ColDef) => !!c.edit && !!c.edit.target(r);
    const applyValue = async (r: Row, c: ColDef, val: any): Promise<boolean> => {
        const e = c.edit; if (!e) return false;
        const id = e.target(r); if (!id) return false;
        const prevRaw = c.get(r);
        let v: any = val;
        if (e.type === 'number') {
            const t = String(val).trim().replace(/[৳,\s]/g, '');
            const n = t === '' ? 0 : Number(t);
            if (Number.isNaN(n) || n < 0 || (e.positive && n <= 0)) { toast.error(e.positive ? 'Enter a number above 0' : 'Enter a valid positive number'); return false; }
            v = n;
            if (n === num(prevRaw)) return true;
        } else if (e.type === 'text') {
            v = String(val ?? '').trim();
            if (e.upper) v = v.toUpperCase();
            if (e.required && !v) { toast.error(`${c.label} cannot be empty`); return false; }
            if (v === String(prevRaw ?? '')) return true;
        } else if (e.type === 'select') {
            v = String(val);
            if (v === String(prevRaw ?? '')) return true;
        }
        const ok = await runCommit({ entity: e.entity, id, field: e.field }, v, e.type === 'number' ? num(prevRaw) : prevRaw, `${r.id}:${c.id}`);
        if (ok) pushUndo([{ t: { entity: e.entity, id, field: e.field }, from: e.type === 'number' ? num(prevRaw) : prevRaw, to: v }]);
        return ok;
    };

    const bulkApply = async (changes: { p: any; v: any; field: string; from: number; to: number }[]) => {
        const done: Change[] = [];
        let failed = 0;
        await runPool(changes, async (c) => {
            const t = { entity: 'VARIANT' as const, id: c.v.id, field: c.field };
            if (await runCommit(t, c.to, c.from)) done.push({ t, from: c.from, to: c.to }); else failed++;
        });
        pushUndo(done);
        failed ? toast.error(`${done.length} updated, ${failed} failed`) : toast.success(`${done.length} prices updated. Ctrl+Z to undo`);
    };
    const selectedRows = rows.filter((r) => selected.has(r.id));
    const bulkTargets = useMemo(() => view === 'products' ? selectedRows.flatMap((r) => (r.p.variants || []).map((v: any) => ({ p: r.p, v }))) : selectedRows.map((r) => ({ p: r.p, v: r.v })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selected, rows, view]);
    const bulkVisibility = async (live: boolean) => {
        const done: Change[] = [];
        await runPool(selectedRows, async (r) => {
            const t = view === 'products' ? { entity: 'PRODUCT' as const, id: r.p.id, field: 'published' } : { entity: 'VARIANT' as const, id: r.v.id, field: 'published' };
            const prev = view === 'products' ? !!r.p.published : r.v.published !== false;
            if (prev !== live && (await runCommit(t, live, prev))) done.push({ t, from: prev, to: live });
        });
        pushUndo(done);
        toast.success(`${done.length} item(s) ${live ? 'set live' : 'hidden'}`);
    };

    // ---------- keyboard / navigation ----------
    const moveFrom = (rowId: string, colId: string, dir: 'up' | 'down' | 'left' | 'right') => {
        const ri = rowIndex.get(rowId); const ci = cols.findIndex((c) => c.id === colId);
        if (ri === undefined || ci < 0) return;
        let nr = ri, nc = ci;
        if (dir === 'down') nr = Math.min(rows.length - 1, ri + 1);
        if (dir === 'up') nr = Math.max(0, ri - 1);
        if (dir === 'right') nc = Math.min(cols.length - 1, ci + 1);
        if (dir === 'left') nc = Math.max(0, ci - 1);
        setActive({ rowId: rows[nr].id, colId: cols[nc].id });
    };
    const finishEdit = async (r: Row, c: ColDef, val: string, nav: 'up' | 'down' | 'left' | 'right' | null) => {
        setEditing(null);
        if (nav) moveFrom(r.id, c.id, nav);
        gridRef.current?.focus({ preventScroll: true });
        await applyValue(r, c, val);
    };
    const cellText = (c: ColDef, r: Row) => {
        if (c.text) return c.text(r);
        const raw = c.get(r);
        return typeof raw === 'boolean' ? (raw ? 'Live' : 'Hidden') : raw === null || raw === undefined ? '' : String(raw);
    };
    const onGridKey = async (e: React.KeyboardEvent) => {
        if (editing) return;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); return void undo(); }
        if (!active) {
            if (e.key.startsWith('Arrow') && rows.length && cols.length) { e.preventDefault(); setActive({ rowId: rows[0].id, colId: cols[0].id }); }
            return;
        }
        const row = rows[rowIndex.get(active.rowId) ?? -1];
        const col = cols.find((c) => c.id === active.colId);
        if (!row || !col) return;
        const dirs: Record<string, 'up' | 'down' | 'left' | 'right'> = { ArrowDown: 'down', ArrowUp: 'up', ArrowLeft: 'left', ArrowRight: 'right' };
        if (dirs[e.key]) { e.preventDefault(); return moveFrom(row.id, col.id, dirs[e.key]); }
        if (e.key === 'Tab') { e.preventDefault(); return moveFrom(row.id, col.id, e.shiftKey ? 'left' : 'right'); }
        if (e.key === 'Escape') return setActive(null);
        if (e.key === 'Home') { e.preventDefault(); return setActive({ rowId: row.id, colId: cols[0].id }); }
        if (e.key === 'End') { e.preventDefault(); return setActive({ rowId: row.id, colId: cols[cols.length - 1].id }); }
        if (e.key === 'Enter' || e.key === 'F2' || e.key === ' ') {
            e.preventDefault();
            if (col.edit?.type === 'bool') { if (isEditable(row, col)) applyValue(row, col, !col.get(row)); }
            else if (isEditable(row, col)) setEditing({ rowId: row.id, colId: col.id });
            return;
        }
        if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); try { await navigator.clipboard.writeText(cellText(col, row)); toast.success('Copied'); } catch { /* ignore */ } return; }
        if (mod && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            if (!isEditable(row, col) || col.edit?.type === 'bool') return;
            try { const t = await navigator.clipboard.readText(); await applyValue(row, col, t.trim()); } catch { toast.error('Clipboard access was blocked by the browser'); }
            return;
        }
        if (!mod && !e.altKey && e.key.length === 1 && isEditable(row, col) && col.edit?.type !== 'bool' && col.edit?.type !== 'select') {
            e.preventDefault(); setEditing({ rowId: row.id, colId: col.id, initial: e.key });
        }
    };
    const onCellClick = (r: Row, c: ColDef) => {
        const was = active?.rowId === r.id && active?.colId === c.id;
        setActive({ rowId: r.id, colId: c.id });
        if (editing && editing.rowId === r.id && editing.colId === c.id) return;
        if (c.edit?.type === 'bool') { if (isEditable(r, c)) applyValue(r, c, !c.get(r)); return; }
        if (was && isEditable(r, c)) setEditing({ rowId: r.id, colId: c.id });
        else gridRef.current?.focus({ preventScroll: true });
    };

    // keep active cell visible
    useEffect(() => {
        const el = scrollRef.current;
        if (!active || !el || editing) return;
        const idx = rowIndex.get(active.rowId);
        if (idx === undefined) return;
        const top = HEAD_H + idx * rowH;
        if (top < el.scrollTop + HEAD_H) el.scrollTop = top - HEAD_H;
        else if (top + rowH > el.scrollTop + el.clientHeight) el.scrollTop = top + rowH - el.clientHeight;
        requestAnimationFrame(() => {
            const td = el.querySelector('td[data-active="1"]') as HTMLElement | null;
            const ci = cols.findIndex((c) => c.id === active.colId);
            if (!td || ci < frozenN) return;
            if (td.offsetLeft < el.scrollLeft + frozenW) el.scrollLeft = td.offsetLeft - frozenW;
            else if (td.offsetLeft + td.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollLeft = td.offsetLeft + td.offsetWidth - el.clientWidth;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    // ---------- columns: sort / resize / move ----------
    const toggleSort = (id: string, multi: boolean) => setSorts((prev) => {
        const cur = prev[view]; const i = cur.findIndex((s) => s.id === id);
        let next: Sort[];
        if (multi) next = i < 0 ? [...cur, { id, dir: 'asc' }] : cur[i].dir === 'asc' ? cur.map((s, k) => (k === i ? { ...s, dir: 'desc' as const } : s)) : cur.filter((_, k) => k !== i);
        else if (i >= 0 && cur.length === 1) next = cur[0].dir === 'asc' ? [{ id, dir: 'desc' }] : [];
        else next = [{ id, dir: 'asc' }];
        return { ...prev, [view]: next };
    });
    const setSortDir = (id: string, dir: 'asc' | 'desc' | null) => setSorts((p) => ({ ...p, [view]: dir ? [{ id, dir }] : p[view].filter((s) => s.id !== id) }));
    const startResize = (e: React.PointerEvent, c: ColDef, startW: number) => {
        e.preventDefault(); e.stopPropagation();
        const x0 = e.clientX; const el = e.currentTarget as HTMLElement;
        el.setPointerCapture(e.pointerId);
        const mv = (ev: PointerEvent) => { const w = Math.max(c.min ?? 56, Math.min(700, startW + ev.clientX - x0)); patchCols(view, (s) => ({ ...s, widths: { ...s.widths, [c.id]: w } })); };
        const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up);
    };
    const moveCol = (from: string, to: string) => patchCols(view, (s) => {
        const ids = orderedDefs(view).map((c) => c.id);
        if (from === to || !ids.includes(from) || !ids.includes(to)) return s;
        const a = ids.filter((x) => x !== from);
        a.splice(ids.indexOf(to), 0, from);
        return { ...s, order: a };
    });
    const shiftCol = (id: string, d: -1 | 1) => patchCols(view, (s) => {
        const ids = orderedDefs(view).map((c) => c.id); const i = ids.indexOf(id); const j = i + d;
        if (j < 0 || j >= ids.length) return s;
        [ids[i], ids[j]] = [ids[j], ids[i]];
        return { ...s, order: ids };
    });
    const hideCol = (id: string) => patchCols(view, (s) => ({ ...s, hidden: [...s.hidden, id] }));
    const toggleHidden = (id: string) => patchCols(view, (s) => ({ ...s, hidden: s.hidden.includes(id) ? s.hidden.filter((x) => x !== id) : [...s.hidden, id] }));

    // ---------- presets ----------
    const makeCol = useCallback((vw: ViewMode, show: string[], frozen = 1): ColState => {
        const ids = defsFor(vw).map((c) => c.id);
        const exp = show.flatMap((id) => (id === '@sizes' ? sizeCols.map((s) => `size:${s.key}`) : [id])).filter((id) => ids.includes(id));
        const rest = ids.filter((id) => !exp.includes(id));
        return { order: [...exp, ...rest], hidden: rest, widths: {}, frozen };
    }, [defsFor, sizeCols]);
    const builtins: Preset[] = useMemo(() => [
        { id: 'b_daily', name: 'Daily pricing', desc: 'Product × size price grid. Best for quick price updates.', view: 'products', col: makeCol('products', ['name', 'category', 'live', '@sizes', 'range']), sort: [{ id: 'name', dir: 'asc' }] },
        { id: 'b_stock', name: 'Stock check', desc: 'Variants with stock, alerts and live status.', view: 'variants', col: makeCol('variants', ['vname', 'size', 'sku', 'vstock', 'lowalert', 'vlive']), sort: [{ id: 'vstock', dir: 'asc' }] },
        { id: 'b_cost', name: 'Costing & margin', desc: 'Price, cost and margin side by side. Lowest margin first.', view: 'variants', superOnly: true, col: makeCol('variants', ['vname', 'size', 'price', 'cost', 'margin', 'marginpct', 'compare', 'vstock']), sort: [{ id: 'marginpct', dir: 'asc' }] },
        { id: 'b_offers', name: 'Offers & markdowns', desc: 'Regular price, markdown % and active offer price.', view: 'variants', col: makeCol('variants', ['vname', 'size', 'price', 'compare', 'discpct', 'offer', 'vlive']), sort: [{ id: 'discpct', dir: 'desc' }] },
        { id: 'b_audit', name: 'Catalog audit', desc: 'SKU, barcode, GTIN, MPN, weight: spot missing data.', view: 'variants', col: makeCol('variants', ['vname', 'size', 'sku', 'barcode', 'gtin', 'mpn', 'weight', 'vlive']), sort: [{ id: 'vname', dir: 'asc' }] },
        { id: 'b_supplier', name: 'Suppliers & sourcing', desc: 'Who supplies what, with stock and sales.', view: 'products', col: makeCol('products', ['name', 'category', 'brand', 'supplier', 'pstock', 'vcount', 'sold']), sort: [{ id: 'supplier', dir: 'asc' }] },
        { id: 'b_best', name: 'Bestsellers', desc: 'Most sold first, with stock and rating.', view: 'products', col: makeCol('products', ['name', 'category', 'sold', 'rating', 'pstock', 'range']), sort: [{ id: 'sold', dir: 'desc' }] },
    ], [makeCol]);
    const applyPreset = (pr: Preset) => {
        setView(pr.view);
        setColStates((p) => ({ ...p, [pr.view]: pr.col }));
        setSorts((p) => ({ ...p, [pr.view]: pr.sort }));
        setFilters({ ...EMPTY_FILTERS, ...(pr.filters || {}) });
        if (pr.density) setDensity(pr.density);
        setSelected(new Set()); setActive(null); setEditing(null);
        toast.success(`Preset: ${pr.name}`);
    };
    const savePreset = () => {
        const name = presetName.trim();
        if (!name) return toast.error('Give the preset a name');
        setCustomPresets((p) => [...p, { id: `c_${Date.now()}`, name, view, col: st, sort: sorts[view], filters, density }]);
        setPresetName(''); toast.success(`Saved "${name}"`);
    };
    const switchView = (v: ViewMode) => { setView(v); setSelected(new Set()); setActive(null); setEditing(null); if (scrollRef.current) scrollRef.current.scrollTop = 0; };

    // ---------- export ----------
    const exportTable = (kind: 'csv' | 'copy') => {
        const head = cols.map((c) => c.label);
        const body = rows.map((r) => cols.map((c) => cellText(c, r)));
        if (kind === 'csv') {
            download(`Khushbuwaala_${view}_${new Date().toISOString().slice(0, 10)}.csv`, '\uFEFF' + [head, ...body].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8;');
            toast.success(`Exported ${rows.length} rows`);
        } else {
            navigator.clipboard.writeText([head, ...body].map((r) => r.join('\t')).join('\n')).then(() => toast.success('Copied. Paste straight into Google Sheets or Excel'), () => toast.error('Clipboard blocked'));
        }
    };

    // ---------- footer aggregate ----------
    const agg = useMemo(() => {
        if (!active) return null;
        const col = cols.find((c) => c.id === active.colId);
        if (!col) return null;
        const vals = rows.map((r) => col.get(r)).filter((x) => typeof x === 'number' && Number.isFinite(x)) as number[];
        if (!vals.length) return null;
        const sum = vals.reduce((a, b) => a + b, 0);
        return { label: col.label, n: vals.length, sum, avg: sum / vals.length, min: Math.min(...vals), max: Math.max(...vals) };
    }, [active, cols, rows]);

    // ---------- windowing ----------
    const overscan = 8;
    const start = Math.max(0, Math.floor(scrollTop / rowH) - overscan);
    const end = Math.min(rows.length, Math.ceil((scrollTop + vh) / rowH) + overscan);
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const t = e.currentTarget.scrollTop;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => setScrollTop(t));
    };

    const drawerProduct = drawerPid ? merged.find((p) => p.id === drawerPid) : null;
    const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
    const bd = '1px solid var(--kw-border)';

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <VarsCtx.Provider value={vars}>
            <style>{`
              .kw-grid tbody tr:hover > td{background:var(--kw-hover)!important}
              .kw-grid tbody tr.kw-sel > td, .kw-grid tbody tr.kw-sel:hover > td{background:var(--kw-soft)!important}
              .kw-grid td.kw-active{outline:2px solid var(--kw-accent);outline-offset:-2px}
              .kw-grid td.kw-saved{background:rgba(16,185,129,.25)!important}
              .kw-grid td.kw-err{background:rgba(225,29,72,.25)!important}
              .kw-grid th.kw-drop{box-shadow:inset 3px 0 0 var(--kw-accent)}
              .kw-grid ::selection{background:var(--kw-soft)}
            `}</style>
            <div style={{ ...vars, height: PAGE_HEIGHT }} className="w-full flex flex-col bg-[var(--kw-bg)] text-[var(--kw-text)] overflow-hidden">
                {/* ============ TOP BAR ============ */}
                <div className="border-b border-[var(--kw-border)] bg-[var(--kw-panel)] px-2 sm:px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <Btn onClick={() => router.push(BACK_ROUTE)} title="Back to products"><ArrowLeft className="w-4 h-4" /></Btn>
                    <div className="flex items-center gap-1.5 mr-1 shrink-0">
                        <span className="w-6 h-6 rounded bg-[var(--kw-accent)] text-white font-black text-xs grid place-items-center">৳</span>
                        <h1 className="text-sm font-extrabold hidden md:block">Price Sheet</h1>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--kw-border)] bg-[var(--kw-bg)]">{rows.length}{view === 'products' ? ' products' : ' SKUs'}</span>
                        {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--kw-accent)]" />}
                    </div>
                    <div className="relative min-w-[130px] flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
                        <input ref={searchRef} value={filters.q} onChange={(e) => setF({ q: e.target.value })} placeholder="Search name, SKU, brand, barcode…  ( / )" className={cn(inp, 'w-full pl-7 pr-6')} />
                        {filters.q && <button className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-60" onClick={() => setF({ q: '' })}><X className="w-3 h-3" /></button>}
                    </div>
                    <Seg value={view} onChange={switchView} options={[{ v: 'products', label: 'Products', icon: <Grid3X3 className="w-3.5 h-3.5" />, title: 'One row per product, one column per size' }, { v: 'variants', label: 'Variants', icon: <ListTree className="w-3.5 h-3.5" />, title: 'One row per SKU with all details' }]} />

                    <Popover width={330} trigger={(o, t) => <Btn onClick={t} active={o} title="Presets"><Bookmark className="w-3.5 h-3.5" /><span className="hidden lg:inline">Presets</span></Btn>}>
                        {(close) => (
                            <div className="p-2 space-y-1">
                                <p className="px-1 text-[10px] font-bold uppercase opacity-60">Ready-made</p>
                                {builtins.filter((b) => !b.superOnly || isSuper).map((b) => (
                                    <button key={b.id} onClick={() => { applyPreset(b); close(); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]">
                                        <div className="font-bold">{b.name}</div><div className="opacity-60 text-[11px]">{b.desc}</div>
                                    </button>
                                ))}
                                {customPresets.length > 0 && <p className="px-1 pt-2 text-[10px] font-bold uppercase opacity-60">Your presets</p>}
                                {customPresets.map((b) => (
                                    <div key={b.id} className="flex items-center rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]">
                                        <button onClick={() => { applyPreset(b); close(); }} className="flex-1 text-left px-2 py-1.5 font-bold truncate">{b.name} <span className="font-normal opacity-60">· {b.view}</span></button>
                                        <button onClick={() => setCustomPresets((p) => p.filter((x) => x.id !== b.id))} className="p-1.5 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <div className="pt-2 mt-1 border-t border-[var(--kw-border)] space-y-1">
                                    <p className="px-1 text-[10px] font-bold uppercase opacity-60">Save current layout, columns, sort & filters</p>
                                    <div className="flex gap-1"><input value={presetName} onChange={(e) => setPresetName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && savePreset()} placeholder="Preset name" className={cn(inp, 'flex-1 min-w-0')} /><Btn onClick={savePreset}><Save className="w-3.5 h-3.5" /></Btn></div>
                                </div>
                            </div>
                        )}
                    </Popover>

                    <Btn onClick={() => setShowFilters((s) => !s)} active={activeFilterCount > 0} title="Filters">
                        <Filter className="w-3.5 h-3.5" /><span className="hidden lg:inline">Filters</span>
                        {activeFilterCount > 0 && <span className="px-1.5 rounded-full bg-[var(--kw-accent)] text-white text-[10px]">{activeFilterCount}</span>}
                    </Btn>

                    <Popover width={300} align="right" trigger={(o, t) => <Btn onClick={t} active={o} title="Show, hide, reorder columns"><Settings2 className="w-3.5 h-3.5" /><span className="hidden lg:inline">Columns</span></Btn>}>
                        <div className="p-2 space-y-1">
                            <div className="flex items-center justify-between px-1 pb-1">
                                <span className="text-[10px] font-bold uppercase opacity-60">{cols.length} of {allOrdered.length} shown</span>
                                <span className="flex gap-2 text-[11px] font-bold text-[var(--kw-accent)]">
                                    <button onClick={() => patchCols(view, (s) => ({ ...s, hidden: [] }))}>Show all</button>
                                    <button onClick={() => patchCols(view, () => defaultState(view))}>Reset</button>
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-1 pb-1 border-b border-[var(--kw-border)]"><Pin className="w-3 h-3 opacity-60" /><span className="flex-1">Frozen columns</span>
                                <select value={st.frozen} onChange={(e) => patchCols(view, (s) => ({ ...s, frozen: Number(e.target.value) }))} className={cn(inp, 'h-6 w-14')}>{[0, 1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></div>
                            {allOrdered.map((c, i) => (
                                <div key={c.id} className="flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]">
                                    <input type="checkbox" checked={!st.hidden.includes(c.id)} onChange={() => toggleHidden(c.id)} />
                                    <span className="flex-1 truncate">{c.label}</span>
                                    <button disabled={i === 0} onClick={() => shiftCol(c.id, -1)} className="p-0.5 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                    <button disabled={i === allOrdered.length - 1} onClick={() => shiftCol(c.id, 1)} className="p-0.5 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </Popover>

                    <Popover width={250} align="right" trigger={(o, t) => <Btn onClick={t} active={o} title="Theme & density"><Palette className="w-3.5 h-3.5" /><span className="hidden xl:inline">Look</span></Btn>}>
                        <div className="p-3 space-y-3">
                            <div><p className="text-[10px] font-bold uppercase opacity-60 mb-1">Theme</p>
                                <div className="space-y-1">{(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                                    <button key={k} onClick={() => setThemeKey(k)} className={cn('w-full flex items-center gap-2 px-2 py-1.5 rounded border', themeKey === k ? 'border-[var(--kw-accent)]' : 'border-transparent hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]')}>
                                        <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: THEMES[k].swatch }} />{THEMES[k].name}{themeKey === k && <Check className="w-3 h-3 ml-auto" />}</button>))}</div></div>
                            <div><p className="text-[10px] font-bold uppercase opacity-60 mb-1">Row height</p>
                                <Seg value={density} onChange={setDensity} options={[{ v: 'dense', label: 'Dense' }, { v: 'normal', label: 'Normal' }, { v: 'roomy', label: 'Roomy' }]} /></div>
                        </div>
                    </Popover>

                    <Popover width={220} align="right" trigger={(o, t) => <Btn onClick={t} active={o} title="Export"><Download className="w-3.5 h-3.5" /><span className="hidden xl:inline">Export</span></Btn>}>
                        {(close) => (
                            <div className="p-1">
                                <button onClick={() => { exportTable('csv'); close(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]"><Download className="w-3.5 h-3.5" /> CSV file (visible columns)</button>
                                <button onClick={() => { exportTable('copy'); close(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]"><Copy className="w-3.5 h-3.5" /> Copy for Google Sheets</button>
                            </div>
                        )}
                    </Popover>

                    <Btn onClick={undo} disabled={!undoCount} title="Undo last change (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" />{undoCount > 0 && <span className="text-[10px] opacity-70">{undoCount}</span>}</Btn>
                    {selected.size > 0 && (
                        <Btn onClick={() => setBulkOpen(true)} className="!bg-[var(--kw-accent)] !text-white !border-transparent"><Percent className="w-3.5 h-3.5" /> Bulk edit ({selected.size})</Btn>
                    )}
                </div>

                {/* ============ FILTER RIBBON ============ */}
                {showFilters && (
                    <div className="border-b border-[var(--kw-border)] bg-[var(--kw-panel)] px-2 sm:px-3 py-1.5 flex flex-wrap items-center gap-1.5 text-xs max-h-[40dvh] overflow-auto">
                        <MultiPick label="Category" options={categoryOptions} value={filters.categories} onChange={(v) => setF({ categories: v })} />
                        {brandOptions.length > 0 && <MultiPick label="Brand" options={brandOptions} value={filters.brands} onChange={(v) => setF({ brands: v })} />}
                        {supplierOptions.length > 0 && <MultiPick label="Supplier" options={supplierOptions} value={filters.suppliers} onChange={(v) => setF({ suppliers: v })} />}
                        <MultiPick label="Size" options={sizeOptions} value={filters.sizes} onChange={(v) => setF({ sizes: v })} />
                        <select value={filters.status} onChange={(e) => setF({ status: e.target.value as any })} className={cn(inp, 'h-7')}>
                            <option value="ALL">Status: all</option><option value="LIVE">Live only</option><option value="HIDDEN">Hidden only</option>
                        </select>
                        <select value={filters.stock} onChange={(e) => setF({ stock: e.target.value as any })} className={cn(inp, 'h-7')}>
                            <option value="ALL">Stock: all</option><option value="IN">In stock</option><option value="LOW">Low stock</option><option value="OUT">Out of stock</option>
                        </select>
                        {filters.stock === 'LOW' && <label className="flex items-center gap-1 opacity-80">≤<input type="number" value={filters.lowThreshold} onChange={(e) => setF({ lowThreshold: Number(e.target.value) || 0 })} className={cn(inp, 'h-7 w-14')} /></label>}
                        <span className="flex items-center gap-1">
                            <input type="number" placeholder="Min ৳" value={filters.minPrice} onChange={(e) => setF({ minPrice: e.target.value })} className={cn(inp, 'h-7 w-[72px]')} />–
                            <input type="number" placeholder="Max ৳" value={filters.maxPrice} onChange={(e) => setF({ maxPrice: e.target.value })} className={cn(inp, 'h-7 w-[72px]')} />
                        </span>
                        <span className="hidden md:block w-px h-5 bg-[var(--kw-border)] mx-1" />
                        {([
                            ['discounted', 'On offer', null],
                            ['noCompare', 'No regular price', health.noCmp],
                            ['noBarcode', 'No barcode', null],
                            ...(isSuper && health.costData ? [['missingCost', 'No cost', health.noCost], ['lowMargin', 'Low margin', null]] : []),
                        ] as [string, string, number | null][]).map(([f, l, n]) => (
                            <button key={f} onClick={() => toggleFlag(f)} className={cn('h-7 px-2 rounded-full border text-[11px] font-semibold', filters.flags.includes(f) ? 'bg-[var(--kw-accent)] border-[var(--kw-accent)] text-white' : 'border-[var(--kw-border)] hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]')}>
                                {l}{n !== null && <span className="ml-1 opacity-70">{n}</span>}
                            </button>
                        ))}
                        {filters.flags.includes('lowMargin') && <label className="flex items-center gap-1 opacity-80">below<input type="number" value={filters.marginBelow} placeholder="30" onChange={(e) => setF({ marginBelow: e.target.value })} className={cn(inp, 'h-7 w-14')} />%</label>}
                        {health.out > 0 && <button onClick={() => setF({ stock: filters.stock === 'OUT' ? 'ALL' : 'OUT' })} className={cn('h-7 px-2 rounded-full border text-[11px] font-semibold', filters.stock === 'OUT' ? 'bg-rose-500 border-rose-500 text-white' : 'border-rose-400/60 text-rose-500')}>Out of stock {health.out}</button>}
                        {health.hidden > 0 && <button onClick={() => setF({ status: filters.status === 'HIDDEN' ? 'ALL' : 'HIDDEN' })} className={cn('h-7 px-2 rounded-full border text-[11px] font-semibold', filters.status === 'HIDDEN' ? 'bg-gray-500 border-gray-500 text-white' : 'border-[var(--kw-border)]')}>Hidden {health.hidden}</button>}
                        {activeFilterCount > 0 && <button onClick={() => setFilters({ ...EMPTY_FILTERS, lowThreshold: filters.lowThreshold })} className="h-7 px-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-500"><RotateCcw className="w-3 h-3" /> Reset</button>}
                    </div>
                )}

                {isSuper && !health.costData && !isLoading && (
                    <div className="px-3 py-1.5 text-[11px] bg-amber-500/15 text-amber-700 border-b border-amber-500/30 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" />Cost price isn&apos;t returned by the products list yet, so cost and margin columns will look empty. Apply the small backend patch to enable them.</div>
                )}

                {/* ============ GRID ============ */}
                <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-2"><Loader2 className="w-7 h-7 animate-spin text-[var(--kw-accent)]" /><p className="text-xs font-semibold opacity-70">Loading price sheet…</p></div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-2"><AlertCircle className="w-7 h-7 text-rose-500" /><p className="text-sm font-bold">Could not load products</p><Btn onClick={() => refetch()}>Try again</Btn></div>
                    ) : (
                        <div ref={gridRef} tabIndex={0} onKeyDown={onGridKey} className="outline-none" style={{ width: totalW }}>
                            <table className="kw-grid text-xs" style={{ width: totalW, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <colgroup><col style={{ width: CTRL_W }} />{cols.map((c, i) => <col key={c.id} style={{ width: colW(c, i) }} />)}</colgroup>
                                <thead>
                                    <tr>
                                        <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 50, height: HEAD_H, background: 'var(--kw-head)', color: 'var(--kw-headText)', borderRight: bd, borderBottom: bd }}>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))} title="Select all filtered rows" />
                                                <span className="text-[10px] font-mono opacity-70">#</span>
                                            </div>
                                        </th>
                                        {cols.map((c, i) => {
                                            const pinned = i < frozenN;
                                            const si = sorts[view].findIndex((s) => s.id === c.id);
                                            const w = colW(c, i);
                                            return (
                                                <th key={c.id} draggable
                                                    onDragStart={(e) => { dragId.current = c.id; e.dataTransfer.setData('text/plain', c.id); e.dataTransfer.effectAllowed = 'move'; }}
                                                    onDragOver={(e) => { if (dragId.current) { e.preventDefault(); setDropTarget(c.id); } }}
                                                    onDrop={(e) => { e.preventDefault(); if (dragId.current) moveCol(dragId.current, c.id); dragId.current = null; setDropTarget(null); }}
                                                    onDragEnd={() => { dragId.current = null; setDropTarget(null); }}
                                                    onClick={(e) => toggleSort(c.id, e.shiftKey)}
                                                    className={cn('select-none cursor-pointer', dropTarget === c.id && 'kw-drop')}
                                                    style={{ position: 'sticky', top: 0, left: pinned ? leftMap[c.id] : undefined, zIndex: pinned ? 40 : 30, height: HEAD_H, background: 'var(--kw-head)', color: 'var(--kw-headText)', borderRight: bd, borderBottom: bd }}>
                                                    <div className="flex items-center gap-1 px-2 h-full" style={{ justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start' }}>
                                                        <GripVertical className="w-3 h-3 opacity-30 shrink-0 hidden md:block cursor-grab" />
                                                        <span className="truncate text-[11px] font-bold uppercase tracking-wide">{c.label}</span>
                                                        {si >= 0 && <span className="inline-flex items-center shrink-0 text-[var(--kw-accent)] brightness-150">{sorts[view][si].dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{sorts[view].length > 1 && <span className="text-[9px]">{si + 1}</span>}</span>}
                                                        <Popover width={190} align="left" trigger={(_o, t) => <button onClick={t} className="shrink-0 opacity-50 hover:opacity-100 p-0.5"><ChevronDown className="w-3 h-3" /></button>}>
                                                            {(close) => (
                                                                <div className="p-1">
                                                                    {([['Sort A → Z', () => setSortDir(c.id, 'asc')], ['Sort Z → A', () => setSortDir(c.id, 'desc')], ['Clear sort', () => setSortDir(c.id, null)], [i < frozenN ? 'Unfreeze columns' : 'Freeze up to here', () => patchCols(view, (s) => ({ ...s, frozen: i < frozenN ? 0 : i + 1 }))], ['Reset width', () => patchCols(view, (s) => { const wd = { ...s.widths }; delete wd[c.id]; return { ...s, widths: wd }; })], ['Hide column', () => hideCol(c.id)]] as [string, () => void][]).map(([l, fn]) => (
                                                                        <button key={l} onClick={() => { fn(); close(); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-[var(--kw-head)] hover:text-[var(--kw-headText)]">{l}</button>
                                                                    ))}
                                                                    <p className="px-2 pt-1 text-[10px] opacity-50">Shift-click a header to sort by several columns</p>
                                                                </div>
                                                            )}
                                                        </Popover>
                                                    </div>
                                                    <div onPointerDown={(e) => startResize(e, c, w)} onMouseDown={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}
                                                        onDoubleClick={(e) => { e.stopPropagation(); patchCols(view, (s) => { const wd = { ...s.widths }; delete wd[c.id]; return { ...s, widths: wd }; }); }}
                                                        title="Drag to resize · double-click to reset" className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-[var(--kw-accent)]/50 touch-none" />
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr><td colSpan={cols.length + 1} className="py-16 text-center opacity-60">
                                            No matching rows. {activeFilterCount > 0 ? 'Try removing a filter.' : 'Add products first.'}
                                            {activeFilterCount > 0 && <div className="mt-2"><Btn onClick={() => setFilters({ ...EMPTY_FILTERS })}><RotateCcw className="w-3 h-3" /> Clear all filters</Btn></div>}
                                        </td></tr>
                                    )}
                                    {start > 0 && <tr style={{ height: start * rowH }}><td colSpan={cols.length + 1} /></tr>}
                                    {rows.slice(start, end).map((r, k) => {
                                        const i = start + k;
                                        const bg = i % 2 === 0 ? 'var(--kw-rowA)' : 'var(--kw-rowB)';
                                        const isSel = selected.has(r.id);
                                        return (
                                            <tr key={r.id} className={cn(isSel && 'kw-sel')} style={{ height: rowH }}>
                                                <td style={{ position: 'sticky', left: 0, zIndex: 25, background: bg, borderRight: bd, borderBottom: bd, height: rowH, padding: 0 }}>
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <input type="checkbox" checked={isSel} onChange={() => setSelected((p) => { const n = new Set(p); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })} />
                                                        <span className="text-[10px] font-mono opacity-50 w-6 text-right">{i + 1}</span>
                                                        <button onClick={() => setDrawerPid(r.p.id)} title="Open product details" className="p-0.5 rounded hover:bg-[var(--kw-accent)] hover:text-white opacity-70"><Maximize2 className="w-3 h-3" /></button>
                                                    </div>
                                                </td>
                                                {cols.map((c, ci) => {
                                                    const pinned = ci < frozenN;
                                                    const isActive = active?.rowId === r.id && active?.colId === c.id;
                                                    const isEd = editing?.rowId === r.id && editing?.colId === c.id;
                                                    const state = cellStates[`${r.id}:${c.id}`];
                                                    const raw = c.get(r);
                                                    const editable = isEditable(r, c);
                                                    let content: React.ReactNode;
                                                    if (isEd && c.edit) {
                                                        content = <CellEditor spec={c.edit} value={raw} initial={editing?.initial} align={c.align} onFinish={(v, nav) => finishEdit(r, c, v, nav)} onCancel={() => { setEditing(null); gridRef.current?.focus({ preventScroll: true }); }} />;
                                                    } else if (c.render) {
                                                        content = c.render(r, raw, ctx);
                                                    } else {
                                                        const empty = raw === null || raw === undefined || raw === '' || (c.zeroEmpty && num(raw) === 0);
                                                        content = empty ? (editable ? <span className="opacity-30">·</span> : null) : typeof raw === 'number' ? (c.money ? money(raw) : raw.toLocaleString('en-IN', { maximumFractionDigits: 2 })) : String(raw);
                                                    }
                                                    return (
                                                        <td key={c.id} data-active={isActive ? '1' : undefined}
                                                            onClick={() => onCellClick(r, c)} onDoubleClick={() => { if (editable && c.edit?.type !== 'bool') setEditing({ rowId: r.id, colId: c.id }); }}
                                                            className={cn(isActive && 'kw-active', state === 'saved' && 'kw-saved', state === 'error' && 'kw-err', editable ? 'cursor-cell' : 'cursor-default')}
                                                            style={{ position: pinned ? 'sticky' : undefined, left: pinned ? leftMap[c.id] : undefined, zIndex: pinned ? 20 : isActive ? 5 : undefined, background: bg, borderRight: bd, borderBottom: bd, height: rowH, padding: 0, scrollMarginLeft: frozenW }}>
                                                            <div className={cn('px-2 flex items-center gap-1 overflow-hidden whitespace-nowrap', c.mono && 'font-mono', c.align === 'right' ? 'justify-end' : c.align === 'center' ? 'justify-center' : 'justify-start')} style={{ height: rowH }}>
                                                                {content}
                                                                {state === 'saving' && <Loader2 className="w-3 h-3 animate-spin text-blue-500 shrink-0" />}
                                                                {state === 'saved' && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                                                                {state === 'error' && <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {end < rows.length && <tr style={{ height: (rows.length - end) * rowH }}><td colSpan={cols.length + 1} /></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ============ FOOTER ============ */}
                <div className="border-t border-[var(--kw-border)] bg-[var(--kw-panel)] px-3 py-1 text-[11px] flex items-center gap-3 text-[var(--kw-muted)]">
                    <span className="truncate">{rows.length} of {view === 'products' ? merged.length : merged.reduce((s, p) => s + (p.variants?.length || 0), 0)} {view === 'products' ? 'products' : 'SKUs'}{selected.size > 0 && <> · <b className="text-[var(--kw-text)]">{selected.size} selected</b> <button className="underline" onClick={() => setSelected(new Set())}>clear</button></>}</span>
                    {agg && <span className="font-mono hidden sm:block truncate"><b className="text-[var(--kw-text)]">{agg.label}</b> · n {agg.n} · Σ {agg.sum.toLocaleString('en-IN', { maximumFractionDigits: 2 })} · avg {agg.avg.toLocaleString('en-IN', { maximumFractionDigits: 1 })} · min {agg.min} · max {agg.max}</span>}
                    <span className="ml-auto flex items-center gap-3 shrink-0">
                        <Popover width={300} align="right" trigger={(o, t) => <button onClick={t} className="hidden md:inline-flex items-center gap-1 font-bold hover:text-[var(--kw-text)]"><Keyboard className="w-3.5 h-3.5" /> Shortcuts</button>}>
                            <div className="p-3 space-y-1">
                                {[['Click / arrows / Tab', 'Move between cells'], ['Click again, Enter, F2, or just type', 'Edit a cell'], ['Enter / Shift+Enter', 'Save and move down / up'], ['Tab / Shift+Tab', 'Save and move right / left'], ['Esc', 'Cancel edit'], ['Ctrl+C / Ctrl+V', 'Copy / paste a cell value'], ['Ctrl+Z', 'Undo last change'], ['Space', 'Toggle Live / Hidden'], ['/', 'Jump to search'], ['Shift+click header', 'Multi-column sort'], ['Drag header / edge', 'Move / resize column']].map(([a, b]) => (
                                    <div key={a} className="flex justify-between gap-3"><span className="font-mono font-bold">{a}</span><span className="opacity-70 text-right">{b}</span></div>
                                ))}
                            </div>
                        </Popover>
                        <button onClick={() => { setOverrides({}); refetch(); toast.success('Synced with server'); }} className="font-bold text-[var(--kw-accent)] hover:underline inline-flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Sync</button>
                    </span>
                </div>

                {drawerProduct && (
                    <ProductDrawer p={drawerProduct} categories={categories} isSuper={isSuper} save={drawerSave} onClose={() => setDrawerPid(null)} onFull={() => router.push(FULL_EDITOR_ROUTE(drawerProduct.id))} />
                )}
                {bulkOpen && (
                    <BulkModal targets={bulkTargets} sizeOptions={sizeOptions} isSuper={isSuper} selCount={selected.size} onClose={() => setBulkOpen(false)} onApply={bulkApply} onVisibility={bulkVisibility} />
                )}
            </div>
        </VarsCtx.Provider>
    );
}

// ============================================================
// ✏️ INLINE CELL EDITOR
// ============================================================
function CellEditor({ spec, value, initial, align, onFinish, onCancel }: {
    spec: EditSpec; value: any; initial?: string; align?: 'left' | 'right' | 'center';
    onFinish: (v: string, nav: 'up' | 'down' | 'left' | 'right' | null) => void; onCancel: () => void;
}) {
    const [d, setD] = useState(initial !== undefined ? initial : value === null || value === undefined ? '' : String(value));
    const ref = useRef<any>(null);
    const done = useRef(false);
    useEffect(() => { ref.current?.focus(); if (initial === undefined) ref.current?.select?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const finish = (nav: 'up' | 'down' | 'left' | 'right' | null) => { if (done.current) return; done.current = true; onFinish(d, nav); };
    const cancel = () => { if (done.current) return; done.current = true; onCancel(); };
    if (spec.type === 'select') {
        return (
            <select ref={ref} value={d} onChange={(e) => { if (done.current) return; done.current = true; onFinish(e.target.value, null); }} onBlur={cancel}
                onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }} className="w-full h-full bg-transparent outline-none text-xs">
                {spec.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        );
    }
    return (
        <input ref={ref} value={d} onChange={(e) => setD(e.target.value)} inputMode={spec.type === 'number' ? 'decimal' : undefined}
            onBlur={() => finish(null)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); finish(e.shiftKey ? 'up' : 'down'); }
                else if (e.key === 'Tab') { e.preventDefault(); finish(e.shiftKey ? 'left' : 'right'); }
                else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
            }}
            className={cn('w-full h-full bg-transparent outline-none text-xs font-bold', align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left')} />
    );
}