'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetFragranceDataCheckQuery } from '@/redux/store/api/storefront/storefrontApi';

const SHOP = 'https://khushbuwaala.com';

/**
 * Which products have fragrance details the shop cannot use: a field left empty, or a typed value
 * (usually a spelling) the shop's filters do not recognise. Fixing these makes the product show
 * up when customers filter by scent, occasion or how long it lasts.
 */
export default function FragranceDataPage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetFragranceDataCheckQuery();
  const [search, setSearch] = useState('');
  const [only, setOnly] = useState<string | null>(null);

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.products ?? []).filter((p) => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (!only) return true;
      return p.missing.includes(only) || p.unrecognised.some((u) => u.value.toLowerCase() === only.toLowerCase());
    });
  }, [data, search, only]);

  if (isLoading) {
    return (
      <div className="w-full px-3 sm:px-4 py-3 space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full px-3 sm:px-4 py-10 text-center">
        <p className="text-sm font-semibold text-gray-900">The data check could not be loaded.</p>
        <Button className="mt-3" variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const missing = Object.entries(data.missingCounts).sort((a, b) => b[1] - a[1]);
  const complete = data.totalProducts - data.productsToReview;

  return (
    <div className="w-full px-3 sm:px-4 py-2.5 space-y-3 bg-gray-50/50 min-h-[calc(100vh-60px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-50 rounded-lg text-green-700 border border-green-100">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 leading-tight">Fragrance data check</h1>
            <p className="text-[11px] text-gray-500">
              {complete} of {data.totalProducts} products are complete. {data.productsToReview} have something to add or correct.
            </p>
          </div>
        </div>
        <Button variant="outline" className="h-9 text-xs" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Checking…' : 'Check again'}
        </Button>
      </div>

      <section className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 sm:p-4">
        <h2 className="text-sm font-bold text-gray-900">Why this matters</h2>
        <p className="text-xs text-gray-600 mt-1 max-w-3xl">
          Customers filter the shop by scent, occasion and how long a perfume lasts. A product only appears under a filter when its
          details are filled in with words the shop knows. Tap a tag below to see the products it affects, open a product, and edit
          it. Changes show in the shop within about a minute.
        </p>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold text-gray-700">Left empty</h3>
            {missing.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Nothing is missing.</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {missing.map(([field, count]) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => setOnly(only === field ? null : field)}
                    aria-pressed={only === field}
                    className={`h-9 rounded-full border px-3 text-xs font-medium ${only === field ? 'bg-green-700 border-green-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                  >
                    {field} <span className="opacity-70">· {count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-gray-700">Words the shop does not recognise</h3>
            <p className="text-[11px] text-gray-500">Usually a spelling, or a description typed where a single word belongs (for example “Elegant” is not a scent).</p>
            {data.unrecognisedValues.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Every word is recognised.</p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
                {data.unrecognisedValues.map((u) => (
                  <button
                    key={`${u.field}|${u.value}`}
                    type="button"
                    onClick={() => setOnly(only === u.value ? null : u.value)}
                    aria-pressed={only === u.value}
                    title={u.field}
                    className={`min-h-9 rounded-full border px-3 py-1 text-xs text-left font-medium ${only === u.value ? 'bg-green-700 border-green-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
                  >
                    {u.value.length > 48 ? `${u.value.slice(0, 48)}…` : u.value} <span className="opacity-70">· {u.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h2 className="text-sm font-bold text-gray-900">
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {only && (
              <button type="button" onClick={() => setOnly(null)} className="ml-2 text-xs font-semibold text-green-700 underline">
                showing “{only.length > 30 ? `${only.slice(0, 30)}…` : only}” · show all
              </button>
            )}
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a product" className="h-9 pl-8 text-sm" aria-label="Find a product" />
          </div>
        </div>

        {products.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">Nothing to review here.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {products.map((p) => (
              <li key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.missing.map((m) => (
                      <span key={m} className="rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] px-1.5 py-0.5">No {m.toLowerCase()}</span>
                    ))}
                    {p.unrecognised.map((u, i) => (
                      <span key={`${u.value}-${i}`} className="rounded-md bg-gray-50 border border-gray-200 text-gray-700 text-[11px] px-1.5 py-0.5" title={u.field}>
                        {u.field}: “{u.value.length > 40 ? `${u.value.slice(0, 40)}…` : u.value}”
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`${SHOP}/product/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:underline">
                    Shop page <ExternalLink className="w-3 h-3" />
                  </a>
                  <Button asChild variant="outline" className="h-9 text-xs">
                    <Link href={`/products/${p.id}`}>Edit product</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
