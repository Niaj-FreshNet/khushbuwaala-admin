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
- Typed API: every endpoint in `src/redux/store/api/` has request/response types; shared types in `src/types/` (`api.types.ts` envelopes, `order.types.ts` with `orderDisplayLines` / `toEditableLines`, `investor.types.ts`, `expense.types.ts`).
- `src/lib/apiError.ts`: `apiErrorMessage(err, fallback)` for toasts. `src/lib/paymentMethods.ts`: the one payment-method list and labels (handles legacy names). `src/lib/salePlatforms.ts`: sale platforms.
- `src/components/admin/Thumb.tsx`: product images (next/image; unoptimized for other hosts and blob/data URLs).
- `FormWrapper` is generic: `onSubmit(data, form)`, so server field errors can be set on the form.
- Stock is kept per PRODUCT in ml/gm (`Product.stock`); variant `stock` / `lowStockAlert` are not used.

## Housekeeping
- Unused storefront copies were removed 2026-11-22 (import-graph check from every page/layout/route). Before deleting anything else, check it is unreachable the same way.
- `/ledger` redirects to `/finance?tab=ledger`.
- Tracking docs for all three projects: `D:\Projects\khushbuwaala\KHUSHBUWAALA_*.md`.

## Commands
`npm run dev`, `npm run build`, `npx tsc --noEmit`, `npm run lint` (eslint; 0 problems, fails on any warning; `any` and unused code are errors). Backend lives in `D:\Projects\khushbuwaala\khushbuwaala-backend`.

## Storefront content (2026-11-23)
- `/storefront` ("Home page content", ADMIN + SUPER_ADMIN): announcement bar, hero banners and home page product rows. API: `src/redux/store/api/storefront/storefrontApi.ts` → backend `/api/storefront/settings`. The backend checks every save and names what is wrong; show its message.
- Banners (2026-11-24): each picture is previewed in the shop's real banner box. `src/lib/heroShape.ts` is a copy of the storefront rule (`khushbuwaala-frontend/src/lib/storefrontSettings.ts` → `heroBoxShape`): change both together. Advised sizes 1920 × 680 (computers; the box is kept between 2.8:1 and 3.4:1 so the first product row stays on the first screen), 1080 × 1080 (phones).
