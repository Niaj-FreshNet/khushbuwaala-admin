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

## Known leftovers
- Many storefront files (cart, shop, search, related products) were copied into this admin app and are unused. They were only made type-safe, not cleaned up.
- `src/app/(Dashboard)/ledger/page.tsx` is a placeholder returning null.

## Commands
`npm run dev`, `npm run build`, `npx tsc --noEmit`. Backend lives in `D:\Projects\khushbuwaala-backend`.
