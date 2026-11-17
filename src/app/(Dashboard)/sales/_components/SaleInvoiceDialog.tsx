'use client';

/**
 * Invoice preview + Print + PDF download.
 *
 * Dependencies:  npm i jspdf html2canvas-pro
 * (html2canvas-pro is a drop-in fork of html2canvas that understands the
 *  oklch() colors Tailwind v4 / shadcn emit; plain html2canvas throws on them.)
 *
 * Why canvas-based PDF: shop data is often Bangla (names, addresses) and the
 * ৳ glyph — jsPDF's built-in fonts can't render those. Rendering the invoice
 * through the browser keeps every glyph correct.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ───────────────────────── Business details (edit once) ─────────────────────────
export const BUSINESS = {
    name: 'Your Business Name',
    address: 'Shop address, City, Bangladesh',
    phone: '+880 1XXX-XXXXXX',
    email: '',
    footerNote: 'Thank you for your purchase!',
    terms: 'Goods once sold are not returnable without this invoice.',
};

// ───────────────────────── Types ─────────────────────────
export interface InvoiceItem {
    name: string;
    variant?: string;
    qty: number;
    unitPrice: number; // price actually charged per unit
    listUnitPrice?: number; // catalogue price per unit (shown struck-through if higher)
    total: number;
}

export interface InvoiceData {
    invoiceNo: string;
    date: string; // ISO
    platform: string; // "Showroom", "WhatsApp", ...
    soldBy: string;
    customer: { name: string; phone?: string; address?: string; email?: string };
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
    isPaid: boolean;
    method?: string;
}

export type InvoiceFormat = 'A4' | 'RECEIPT';
const DOC_WIDTH: Record<InvoiceFormat, number> = { A4: 794, RECEIPT: 302 };

const tk = (n: number) =>
    `৳${(Number.isFinite(n) ? n : 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

// ───────────────────────── Document ─────────────────────────
function InvoiceDocument({ data, format }: { data: InvoiceData; format: InvoiceFormat }) {
    const width = DOC_WIDTH[format];

    if (format === 'RECEIPT') {
        return (
            <div
                style={{ width }}
                className="bg-white px-3 py-4 font-mono text-[11.5px] leading-snug text-black"
            >
                <div className="text-center">
                    <div className="text-[15px] font-bold">{BUSINESS.name}</div>
                    <div>{BUSINESS.address}</div>
                    <div>{BUSINESS.phone}</div>
                </div>
                <hr className="my-2 border-dashed border-black" />
                <div className="flex justify-between"><span>Invoice</span><span>#{data.invoiceNo}</span></div>
                <div className="flex justify-between"><span>Date</span><span>{fmtDate(data.date)}</span></div>
                <div className="flex justify-between"><span>Customer</span><span className="max-w-[60%] truncate">{data.customer.name}</span></div>
                {data.customer.phone && (
                    <div className="flex justify-between"><span>Phone</span><span>{data.customer.phone}</span></div>
                )}
                <div className="flex justify-between"><span>Via</span><span>{data.platform}</span></div>
                <hr className="my-2 border-dashed border-black" />
                {data.items.map((it, i) => (
                    <div key={i} className="mb-1.5 break-inside-avoid">
                        <div className="font-semibold">
                            {it.name}
                            {it.variant ? ` (${it.variant})` : ''}
                        </div>
                        <div className="flex justify-between">
                            <span>{it.qty} × {tk(it.unitPrice)}</span>
                            <span>{tk(it.total)}</span>
                        </div>
                    </div>
                ))}
                <hr className="my-2 border-dashed border-black" />
                <div className="flex justify-between"><span>Subtotal</span><span>{tk(data.subtotal)}</span></div>
                {data.discount > 0 && (
                    <div className="flex justify-between"><span>Discount</span><span>-{tk(data.discount)}</span></div>
                )}
                {data.deliveryCharge > 0 && (
                    <div className="flex justify-between"><span>Delivery</span><span>{tk(data.deliveryCharge)}</span></div>
                )}
                <div className="mt-1 flex justify-between border-t border-black pt-1 text-[14px] font-bold">
                    <span>TOTAL</span><span>{tk(data.total)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                    <span>{data.isPaid ? 'PAID' : 'DUE'}</span>
                    <span>{data.isPaid ? data.method : ''}</span>
                </div>
                <hr className="my-2 border-dashed border-black" />
                <div className="text-center">{BUSINESS.footerNote}</div>
            </div>
        );
    }

    return (
        <div
            style={{ width }}
            className="bg-white p-10 font-sans text-[13px] leading-snug text-gray-900"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-6">
                <div>
                    <div className="text-[22px] font-bold tracking-tight">{BUSINESS.name}</div>
                    <div className="mt-1 text-gray-600">{BUSINESS.address}</div>
                    <div className="text-gray-600">
                        {BUSINESS.phone}
                        {BUSINESS.email ? ` · ${BUSINESS.email}` : ''}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[26px] font-bold tracking-wide text-orange-500">INVOICE</div>
                    <div className="mt-1 font-semibold">#{data.invoiceNo}</div>
                    <div className="text-gray-600">{fmtDate(data.date)}</div>
                </div>
            </div>
            <div className="my-6 h-[3px] bg-orange-400" />

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <div className="mb-1 text-[11px] font-semibold text-gray-500">Billed to</div>
                    <div className="text-[15px] font-semibold">{data.customer.name}</div>
                    {data.customer.phone && <div>{data.customer.phone}</div>}
                    {data.customer.email && <div>{data.customer.email}</div>}
                    {data.customer.address && (
                        <div className="whitespace-pre-line text-gray-600">{data.customer.address}</div>
                    )}
                </div>
                <div className="text-right">
                    <div className="mb-1 text-[11px] font-semibold text-gray-500">Details</div>
                    <div>Order via: <span className="font-medium">{data.platform}</span></div>
                    <div>Sold by: <span className="font-medium">{data.soldBy || '—'}</span></div>
                    <div>
                        Payment:{' '}
                        <span className="font-medium">
                            {data.isPaid ? `Paid${data.method ? ` · ${data.method}` : ''}` : 'Due'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Items */}
            <table className="mt-7 w-full border-collapse">
                <thead>
                    <tr className="border-y border-gray-300 bg-gray-50 text-left text-[12px] text-gray-600">
                        <th className="w-8 px-2 py-2 font-semibold">#</th>
                        <th className="px-2 py-2 font-semibold">Item</th>
                        <th className="w-16 px-2 py-2 text-right font-semibold">Qty</th>
                        <th className="w-28 px-2 py-2 text-right font-semibold">Rate</th>
                        <th className="w-32 px-2 py-2 text-right font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((it, i) => (
                        <tr key={i} className="break-inside-avoid border-b border-gray-200 align-top">
                            <td className="px-2 py-2.5 text-gray-500">{i + 1}</td>
                            <td className="px-2 py-2.5">
                                <div className="font-medium">{it.name}</div>
                                {it.variant && <div className="text-[12px] text-gray-500">{it.variant}</div>}
                            </td>
                            <td className="px-2 py-2.5 text-right tabular-nums">{it.qty}</td>
                            <td className="px-2 py-2.5 text-right tabular-nums">
                                {tk(it.unitPrice)}
                                {it.listUnitPrice && it.listUnitPrice > it.unitPrice && (
                                    <div className="text-[11px] text-gray-400 line-through">{tk(it.listUnitPrice)}</div>
                                )}
                            </td>
                            <td className="px-2 py-2.5 text-right font-medium tabular-nums">{tk(it.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="mt-5 flex items-start justify-between gap-6 break-inside-avoid">
                <span
                    className={cn(
                        'mt-2 inline-block -rotate-6 rounded border-2 px-4 py-1 text-lg font-bold tracking-widest',
                        data.isPaid ? 'border-emerald-600 text-emerald-700' : 'border-red-600 text-red-600'
                    )}
                >
                    {data.isPaid ? 'PAID' : 'DUE'}
                </span>
                <div className="w-64 space-y-1.5">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="tabular-nums">{tk(data.subtotal)}</span></div>
                    {data.discount > 0 && (
                        <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="tabular-nums">-{tk(data.discount)}</span></div>
                    )}
                    {data.deliveryCharge > 0 && (
                        <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="tabular-nums">{tk(data.deliveryCharge)}</span></div>
                    )}
                    <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-[16px] font-bold">
                        <span>Total</span><span className="tabular-nums">{tk(data.total)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-10 border-t border-gray-200 pt-4 text-center text-[12px] text-gray-500">
                <div className="font-medium text-gray-700">{BUSINESS.footerNote}</div>
                <div>{BUSINESS.terms}</div>
            </div>
        </div>
    );
}

// ───────────────────────── Dialog ─────────────────────────
interface InvoiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: InvoiceData | null;
    title?: string;
}

export default function InvoiceDialog({
    open,
    onOpenChange,
    data,
    title = 'Invoice',
}: InvoiceDialogProps) {
    const [format, setFormat] = useState<InvoiceFormat>('A4');
    const [busy, setBusy] = useState(false);
    const captureRef = useRef<HTMLDivElement>(null);

    // Scale the preview to fit narrow screens (the real document stays full size).
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    const [boxWidth, setBoxWidth] = useState(0);
    useEffect(() => {
        if (!box) return;
        setBoxWidth(box.clientWidth);
        const ro = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
        ro.observe(box);
        return () => ro.disconnect();
    }, [box]);

    const docWidth = DOC_WIDTH[format];
    const scale = boxWidth ? Math.min(1, (boxWidth - 16) / docWidth) : 1;

    // ── PDF ──
    const downloadPdf = useCallback(async () => {
        const node = captureRef.current;
        if (!node || !data) return;
        setBusy(true);
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import('html2canvas-pro'),
                import('jspdf'),
            ]);
            const canvas = await html2canvas(node, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (doc) => {
                    const wrap = doc.getElementById('invoice-capture-wrap');
                    if (wrap) {
                        wrap.style.position = 'static';
                        wrap.style.left = '0';
                    }
                },
            });
            const img = canvas.toDataURL('image/jpeg', 0.95);
            const fileName = `Invoice-${data.invoiceNo || 'sale'}.pdf`;

            if (format === 'RECEIPT') {
                const w = 80;
                const h = (canvas.height * w) / canvas.width;
                const pdf = new jsPDF({ unit: 'mm', format: [w, h] });
                pdf.addImage(img, 'JPEG', 0, 0, w, h);
                pdf.save(fileName);
            } else {
                const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                const pageW = 210;
                const pageH = 297;
                const imgH = (canvas.height * pageW) / canvas.width;
                let left = imgH;
                let y = 0;
                pdf.addImage(img, 'JPEG', 0, y, pageW, imgH);
                left -= pageH;
                while (left > 0) {
                    y = left - imgH;
                    pdf.addPage();
                    pdf.addImage(img, 'JPEG', 0, y, pageW, imgH);
                    left -= pageH;
                }
                pdf.save(fileName);
            }
        } catch (err) {
            console.error('PDF generation failed:', err);
            toast.error('Could not generate the PDF. Try Print → Save as PDF.');
        } finally {
            setBusy(false);
        }
    }, [data, format]);

    // ── Print (isolated iframe so app chrome never leaks onto paper) ──
    const printInvoice = useCallback(() => {
        const node = captureRef.current;
        if (!node || !data) return;
        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        const win = iframe.contentWindow;
        if (!doc || !win) return;

        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map((n) => n.outerHTML)
            .join('');
        const pageCss =
            format === 'A4' ? '@page{size:A4;margin:0}' : '@page{size:80mm auto;margin:0}';

        doc.open();
        doc.write(
            `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${data.invoiceNo}</title>${styles}` +
            `<style>${pageCss}html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>` +
            `</head><body>${node.innerHTML}</body></html>`
        );
        doc.close();

        const cleanup = () => setTimeout(() => iframe.remove(), 500);
        win.onafterprint = cleanup;
        setTimeout(() => {
            win.focus();
            win.print();
            // Fallback if afterprint never fires (some mobile browsers)
            setTimeout(cleanup, 60_000);
        }, 450);
    }, [data, format]);

    if (!data) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
                    <DialogHeader className="border-b px-4 py-3 text-left">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            {title}
                            <span className="font-normal text-gray-500">#{data.invoiceNo}</span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Preview, print or download the invoice as PDF.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Preview */}
                    <div ref={setBox} className="min-h-0 flex-1 overflow-auto bg-gray-100 p-2 sm:p-4">
                        <div className="mx-auto shadow-md" style={{ width: docWidth * scale }}>
                            <div style={{ zoom: scale, width: docWidth }}>
                                <InvoiceDocument data={data} format={format} />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-white p-2.5">
                        <div className="inline-flex rounded-md border bg-gray-50 p-0.5 text-sm" role="radiogroup" aria-label="Paper size">
                            {(['A4', 'RECEIPT'] as const).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    role="radio"
                                    aria-checked={format === f}
                                    onClick={() => setFormat(f)}
                                    className={cn(
                                        'rounded px-3 py-1.5 font-medium transition',
                                        format === f ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                    )}
                                >
                                    {f === 'A4' ? 'A4' : '80mm receipt'}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-1 justify-end gap-2 sm:flex-none">
                            <Button type="button" variant="outline" onClick={printInvoice} className="flex-1 sm:flex-none">
                                <Printer className="mr-1.5 h-4 w-4" /> Print
                            </Button>
                            <Button
                                type="button"
                                onClick={downloadPdf}
                                disabled={busy}
                                className="flex-1 bg-orange-500 text-white hover:bg-orange-600 sm:flex-none"
                            >
                                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                                PDF
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Off-screen, full-size copy used for PDF capture and printing */}
            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        id="invoice-capture-wrap"
                        aria-hidden
                        style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}
                    >
                        <div ref={captureRef}>
                            <InvoiceDocument data={data} format={format} />
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
}