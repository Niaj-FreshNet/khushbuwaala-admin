// The shape of the shop's banner box. A copy of the storefront's rule
// (khushbuwaala-frontend/src/lib/storefrontSettings.ts → heroBoxShape): keep the two in step, or the
// preview on the "Home page content" screen stops matching the shop.
import type { HeroSlide } from '@/types/storefront.types';

export const HERO_SHAPE = {
  desktop: { min: 2, max: 3.2, fallback: 2.2 },
  phone: { min: 0.8, max: 2.4, fallback: 1 },
} as const;

/** Sizes to give a designer: they fill the box exactly. */
export const HERO_ADVISED = { desktop: '1760 × 800', phone: '1080 × 1080' } as const;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const ratio = (w?: number, h?: number) => (w && h && w > 0 && h > 0 ? w / h : null);

/** Width ÷ height of the banner box on phones and on wider screens. */
export function heroBoxShape(slides: HeroSlide[]): { phone: number; desktop: number } {
  const first = slides[0];
  const wide = first ? ratio(first.imageWidth, first.imageHeight) : null;
  const narrow = first?.mobileImage ? ratio(first.mobileWidth, first.mobileHeight) : wide;
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    desktop: round(wide ? clamp(wide, HERO_SHAPE.desktop.min, HERO_SHAPE.desktop.max) : HERO_SHAPE.desktop.fallback),
    phone: round(narrow ? clamp(narrow, HERO_SHAPE.phone.min, HERO_SHAPE.phone.max) : HERO_SHAPE.phone.fallback),
  };
}

/** How a picture sits in a box: shown whole, or how much is cut and where. */
export function fitNote(pictureRatio: number | null, boxRatio: number): { ok: boolean; text: string } | null {
  if (!pictureRatio) return null;
  const cut = pictureRatio > boxRatio ? 1 - boxRatio / pictureRatio : 1 - pictureRatio / boxRatio;
  const percent = Math.round(cut * 100);
  if (percent < 2) return { ok: true, text: 'Shown whole, nothing is cut.' };
  return { ok: false, text: `About ${percent}% is cut from the ${pictureRatio > boxRatio ? 'left and right' : 'top and bottom'}.` };
}
