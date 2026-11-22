# Khushbuwaala Admin (Next.js 16, app router)

Admin dashboard for Khushbuwaala Perfumes (Dhaka). Owner: Niaj (prefers plain language, simple analogies, structured explanations).

## Stack
Next.js 16 (Turbopack), React client components, RTK Query (`baseApi.injectEndpoints`), shadcn/Tailwind, lucide-react, sonner.
API hooks live in `src/redux/store/api/<area>/`. Auth hook: `src/redux/store/hooks/useAuth`.

## Roles
USER, SALESMAN, ADMIN, SUPER_ADMIN, INVESTOR.
- `/price-list`: ADMIN + SUPER_ADMIN can view (gated in `src/proxy.ts` and in the page).
- Cost price / margin / costing: SUPER_ADMIN only (UI hidden for ADMIN; backend enforces).

## Key work done
- `src/app/(Dashboard)/price-list/page.tsx`: Google-Sheets-like Master Price Sheet (resizable/movable/hideable columns, filters, presets, themes, inline edit, bulk edit, product drawer with costing tab). Settings saved in localStorage key `kw_pricesheet_v2`.
- All `tsc --noEmit` errors fixed; `npm run build` passes (Next 16.4.6).
- `middleware.ts` migrated to `proxy.ts`.

## Shared admin building blocks
- `src/components/admin/MobileCards.tsx`: phone card layout. List pages render the desktop table in `hidden md:block` and the same rows as cards (`md:hidden`). Check new pages at 390px: 0px sideways overflow.
- `src/components/admin/ConfirmProvider.tsx`: `useConfirm()` / `usePrompt()` instead of window.confirm/prompt (mounted in DashboardShell).
- `src/components/admin/RestockDialog.tsx`: the one restock form (super admin: purchase with cost + average cost; admin: count only).
- `src/lib/money.ts`: `formatTaka` / `formatNumber`. Always pass a locale when formatting numbers (a phone set to Bangla changes the output otherwise).
- Stock is kept per PRODUCT in ml/gm (`Product.stock`); variant `stock` / `lowStockAlert` are not used.

## Housekeeping
- Unused storefront copies were removed 2026-11-22 (import-graph check from every page/layout/route). Before deleting anything else, check it is unreachable the same way.
- `/ledger` redirects to `/finance?tab=ledger`.
- Tracking docs for all three projects: `D:\Projects\khushbuwaala\KHUSHBUWAALA_*.md`.

## Commands
`npm run dev`, `npm run build`, `npx tsc --noEmit`, `npm run lint` (eslint; 0 errors expected, legacy `any` types are warnings). Backend lives in `D:\Projects\khushbuwaala\khushbuwaala-backend`.
