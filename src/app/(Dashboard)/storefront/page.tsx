'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Loader2, Megaphone, Plus, RotateCcw, Rows3, Save, Store, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import Thumb from '@/components/admin/Thumb';
import { useConfirm } from '@/components/admin/ConfirmProvider';
import { apiErrorMessage } from '@/lib/apiError';
import { uploadToCloudinary } from '@/lib/helper/uploadToCloudinary';
import { useGetAllCategoriesAdminQuery } from '@/redux/store/api/category/categoryApi';
import { useGetStorefrontSettingsQuery, useSaveStorefrontSettingsMutation } from '@/redux/store/api/storefront/storefrontApi';
import type { HeroSlide, HomeRow, StorefrontSettings } from '@/types/storefront.types';

const SHOP = 'https://khushbuwaala.com';

// Pictures that ship with the shop are stored as "/file.webp"; show them from the shop's address.
const preview = (src: string) => (src.startsWith('/') ? `${SHOP}${src}` : src);

const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const titleCase = (name: string) => name.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());

/** Ready-made choices for "which products does this row show", so nobody has to type filter text. */
type RowPreset = { id: string; label: string; query: string; href: string };

const FIXED_PRESETS: RowPreset[] = [
  { id: 'popular', label: 'Best sellers', query: 'sort=popular&inStock=1', href: '/shop' },
  { id: 'newest', label: 'Newest products', query: 'sort=newest&inStock=1', href: '/new-arrivals' },
  { id: 'sale', label: 'Products on offer', query: 'onSale=1&inStock=1', href: '/shop?onSale=1' },
  { id: 'budget500', label: 'Under ৳500', query: 'maxPrice=500&inStock=1', href: '/shop?maxPrice=500' },
  { id: 'long', label: 'Long-lasting', query: 'longevity=long,very_long&inStock=1', href: '/shop?longevity=long,very_long' },
  { id: 'oud', label: 'With oud', query: 'notes=oud&inStock=1', href: '/shop?notes=oud' },
  { id: 'rose', label: 'With rose', query: 'notes=rose&inStock=1', href: '/shop?notes=rose' },
  { id: 'musk', label: 'With musk', query: 'notes=musk&inStock=1', href: '/shop?notes=musk' },
  { id: 'fresh', label: 'Fresh scents', query: 'families=fresh&inStock=1', href: '/shop?families=fresh' },
  { id: 'sweet', label: 'Sweet scents', query: 'families=sweet&inStock=1', href: '/shop?families=sweet' },
  { id: 'woody', label: 'Woody scents', query: 'families=woody&inStock=1', href: '/shop?families=woody' },
  { id: 'office', label: 'For the office', query: 'occasions=office&inStock=1', href: '/shop?occasions=office' },
  { id: 'women', label: 'For her', query: 'gender=women&inStock=1', href: '/womens-perfume' },
  { id: 'men', label: 'For him', query: 'gender=men&inStock=1', href: '/shop?gender=men' },
];

// Collections that have their own page on the shop (others link to the filtered shop page).
const COLLECTION_PAGES: Record<string, string> = {
  'inspired-perfume-oil': '/inspired-perfume-oil',
  'oriental-attar': '/oriental-attar',
  'artificial-oud': '/artificial-oud',
  'natural-attar-oil': '/organic-attar',
  'brand-perfumes': '/brand-perfumes',
  'gifts-and-packages': '/gifts-and-packages',
};

const move = <T,>(list: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function SectionCard({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200/80 shadow-2xs p-3.5 sm:p-4">
      <div className="flex items-start gap-2.5 mb-3">
        <div className="p-1.5 bg-green-50 rounded-lg text-green-700 border border-green-100 shrink-0">{icon}</div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 leading-tight">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function OrderButtons({ index, count, onMove, onRemove, label }: { index: number; count: number; onMove: (to: number) => void; onRemove: () => void; label: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="w-4 h-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9" disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}>
        <ArrowDown className="w-4 h-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-9 w-9 text-red-600 hover:text-red-700" onClick={onRemove} aria-label={`Remove ${label}`}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ImageField({ label, value, onChange, hint }: { label: string; value?: string; onChange: (url: string | undefined) => void; hint: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return void toast.error('Please choose a picture file.');
    if (file.size > 5 * 1024 * 1024) return void toast.error('That picture is over 5 MB. Please use a smaller one.');
    setBusy(true);
    try {
      onChange(await uploadToCloudinary(file, 'khushbuwaala_images/banners'));
    } catch {
      toast.error('The picture could not be uploaded. Please try again.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <Label className="text-xs font-semibold text-gray-700">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-14 w-24 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
          {value ? <Thumb src={preview(value)} alt="" size={96} className="h-full w-full object-cover" /> : <ImagePlus className="w-5 h-5 text-gray-300" />}
        </div>
        <div className="flex flex-col gap-1">
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          <Button type="button" variant="outline" className="h-9 text-xs" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            {value ? 'Change picture' : 'Upload picture'}
          </Button>
          <span className="text-[11px] text-gray-500">{hint}</span>
        </div>
      </div>
    </div>
  );
}

export default function StorefrontContentPage() {
  const { data, isLoading, isError, refetch } = useGetStorefrontSettingsQuery();
  const { data: categoryData } = useGetAllCategoriesAdminQuery();
  const [save, { isLoading: saving }] = useSaveStorefrontSettingsMutation();
  const confirm = useConfirm();

  const [draft, setDraft] = useState<StorefrontSettings | null>(null);
  useEffect(() => {
    if (data) setDraft(data.settings);
  }, [data]);

  const presets = useMemo<RowPreset[]>(() => {
    const collections = (categoryData?.data?.data ?? [])
      .filter((c) => c.published)
      .map((c) => {
        const id = slug(c.categoryName);
        return { id: `category:${id}`, label: `Collection: ${titleCase(c.categoryName)}`, query: `category=${id}&inStock=1`, href: COLLECTION_PAGES[id] ?? `/shop?category=${id}` };
      });
    return [...FIXED_PRESETS, ...collections];
  }, [categoryData]);

  if (isLoading || (!draft && !isError)) {
    return (
      <div className="w-full px-3 sm:px-4 py-3 space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !draft || !data) {
    return (
      <div className="w-full px-3 sm:px-4 py-10 text-center">
        <p className="text-sm font-semibold text-gray-900">The storefront content could not be loaded.</p>
        <Button className="mt-3" variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  const { limits, defaults } = data;
  const changed = !same(draft, data.settings);
  const set = (patch: Partial<StorefrontSettings>) => setDraft({ ...draft, ...patch });

  const setNotice = (i: number, value: string) => set({ notices: draft.notices.map((n, j) => (j === i ? value : n)) });
  const setSlide = (i: number, patch: Partial<HeroSlide>) => set({ hero: draft.hero.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const setRow = (i: number, patch: Partial<HomeRow>) => set({ homeRows: draft.homeRows.map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const handleSave = async () => {
    const cleaned: StorefrontSettings = {
      notices: draft.notices.map((n) => n.trim()).filter(Boolean),
      hero: draft.hero,
      homeRows: draft.homeRows,
    };
    if (cleaned.hero.some((s) => !s.image)) return void toast.error('Every banner needs a picture.');
    if (cleaned.homeRows.some((r) => !r.title.trim())) return void toast.error('Every product row needs a title.');
    try {
      await save(cleaned).unwrap();
      toast.success('Saved. The shop shows the change within about a minute.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save. Nothing was changed.'), { duration: 9000 });
    }
  };

  const handleReset = async () => {
    const ok = await confirm({ title: 'Put back the original content?', description: 'This fills the form with the original announcement messages, banners and rows. Nothing changes on the shop until you press Save.' });
    if (ok) setDraft(defaults);
  };

  return (
    <div className="w-full px-3 sm:px-4 py-2.5 pb-24 space-y-3 bg-gray-50/50 min-h-[calc(100vh-60px)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-50 rounded-lg text-green-700 border border-green-100">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 leading-tight">Home page content</h1>
            <p className="text-[11px] text-gray-500">
              {data.usingDefaults ? 'The shop is showing its original content. Nothing has been saved here yet.' : `Last saved ${data.updatedAt ? new Date(data.updatedAt).toLocaleString('en-GB') : ''}`}
            </p>
          </div>
        </div>
        <a href={SHOP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:underline">
          Open the shop <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Announcement bar */}
      <SectionCard icon={<Megaphone className="w-4 h-4" />} title="Announcement bar" hint="The green strip at the very top of the shop. Messages rotate one after another. Remove them all to hide the strip.">
        <div className="space-y-2">
          {draft.notices.map((notice, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={notice} maxLength={limits.noticeLength} onChange={(e) => setNotice(i, e.target.value)} placeholder="e.g. Free shipping on orders over ৳1000" className="h-10 text-sm" aria-label={`Message ${i + 1}`} />
              <OrderButtons index={i} count={draft.notices.length} label={`message ${i + 1}`} onMove={(to) => set({ notices: move(draft.notices, i, to) })} onRemove={() => set({ notices: draft.notices.filter((_, j) => j !== i) })} />
            </div>
          ))}
          {draft.notices.length === 0 && <p className="text-xs text-gray-500">No messages: the strip is hidden.</p>}
          <Button type="button" variant="outline" className="h-9 text-xs" disabled={draft.notices.length >= limits.notices} onClick={() => set({ notices: [...draft.notices, ''] })}>
            <Plus className="w-4 h-4" /> Add a message
          </Button>
        </div>
      </SectionCard>

      {/* Hero banners */}
      <SectionCard icon={<ImagePlus className="w-4 h-4" />} title="Banners" hint="The large sliding pictures at the top of the home page. The first one is what visitors see first.">
        <div className="space-y-3">
          {draft.hero.map((slide, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-700">Banner {i + 1}</span>
                <OrderButtons index={i} count={draft.hero.length} label={`banner ${i + 1}`} onMove={(to) => set({ hero: move(draft.hero, i, to) })} onRemove={() => set({ hero: draft.hero.filter((_, j) => j !== i) })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ImageField label="Picture for computers" value={slide.image} onChange={(url) => setSlide(i, { image: url ?? '' })} hint="Wide picture, about 1920 × 560" />
                <ImageField label="Picture for phones (optional)" value={slide.mobileImage} onChange={(url) => setSlide(i, { mobileImage: url })} hint="About 900 × 400. Uses the wide one if empty" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Button text</Label>
                  <Input value={slide.buttonText} maxLength={limits.label} onChange={(e) => setSlide(i, { buttonText: e.target.value })} className="h-10 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Button opens</Label>
                  <Input value={slide.link} onChange={(e) => setSlide(i, { link: e.target.value })} placeholder="/shop" className="h-10 text-sm mt-1" />
                  <p className="text-[11px] text-gray-500 mt-1">A page of the shop, e.g. /shop or /oriental-attar</p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Picture description</Label>
                  <Input value={slide.alt} maxLength={limits.alt} onChange={(e) => setSlide(i, { alt: e.target.value })} className="h-10 text-sm mt-1" />
                  <p className="text-[11px] text-gray-500 mt-1">Read by Google and by screen readers</p>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="h-9 text-xs" disabled={draft.hero.length >= limits.hero} onClick={() => set({ hero: [...draft.hero, { image: '', alt: '', buttonText: 'Shop Now', link: '/shop' }] })}>
            <Plus className="w-4 h-4" /> Add a banner
          </Button>
        </div>
      </SectionCard>

      {/* Home rows */}
      <SectionCard icon={<Rows3 className="w-4 h-4" />} title="Product rows" hint="The rows of products on the home page, top to bottom. A row with fewer than two products in stock hides itself.">
        <div className="space-y-3">
          {draft.homeRows.map((row, i) => {
            const preset = presets.find((p) => p.query === row.query);
            return (
              <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <Switch checked={row.enabled} onCheckedChange={(v) => setRow(i, { enabled: v })} aria-label={`Show row ${row.title || i + 1}`} />
                    {row.enabled ? 'Shown' : 'Hidden'}
                  </label>
                  <OrderButtons index={i} count={draft.homeRows.length} label={`row ${row.title || i + 1}`} onMove={(to) => set({ homeRows: move(draft.homeRows, i, to) })} onRemove={() => set({ homeRows: draft.homeRows.filter((_, j) => j !== i) })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Title</Label>
                    <Input value={row.title} maxLength={limits.title} onChange={(e) => setRow(i, { title: e.target.value })} className="h-10 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Products to show</Label>
                    <select
                      value={preset?.id ?? 'custom'}
                      onChange={(e) => {
                        const next = presets.find((p) => p.id === e.target.value);
                        if (next) setRow(i, { query: next.query, href: next.href, ...(row.title ? {} : { title: next.label.replace(/^Collection: /, '') }) });
                      }}
                      className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-2.5 text-sm"
                      aria-label="Products to show"
                    >
                      {!preset && <option value="custom">Custom selection</option>}
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Button under the row</Label>
                    <Input value={row.linkLabel} maxLength={limits.label} onChange={(e) => setRow(i, { linkLabel: e.target.value })} className="h-10 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-gray-700">Button opens</Label>
                    <Input value={row.href} onChange={(e) => setRow(i, { href: e.target.value })} className="h-10 text-sm mt-1" />
                  </div>
                </div>
                <a href={`${SHOP}/shop?${row.query.replace(/&?inStock=1/, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:underline">
                  See these products on the shop <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            className="h-9 text-xs"
            disabled={draft.homeRows.length >= limits.homeRows}
            onClick={() => set({ homeRows: [...draft.homeRows, { title: '', query: FIXED_PRESETS[0].query, href: FIXED_PRESETS[0].href, linkLabel: 'See all', enabled: true }] })}
          >
            <Plus className="w-4 h-4" /> Add a row
          </Button>
        </div>
      </SectionCard>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-4 md:bottom-4 z-30 bg-white border-t md:border border-gray-200 md:rounded-xl shadow-lg px-3 py-2.5 flex items-center justify-end gap-2">
        <span className="text-xs text-gray-500 mr-auto md:mr-2">{changed ? 'You have changes that are not saved.' : 'Everything is saved.'}</span>
        <Button type="button" variant="outline" className="h-10 text-xs" onClick={handleReset} disabled={saving}>
          <RotateCcw className="w-4 h-4" /> Original content
        </Button>
        <Button type="button" className="h-10 text-xs bg-green-700 hover:bg-green-800 text-white" onClick={handleSave} disabled={!changed || saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </Button>
      </div>
    </div>
  );
}
