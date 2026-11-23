// Storefront content edited on the "Home page content" screen (backend: modules/Storefront).

export type HeroSlide = {
  image: string;
  mobileImage?: string;
  alt: string;
  buttonText: string;
  link: string;
};

export type HomeRow = {
  title: string;
  /** Written like a shop address: "category=oriental-attar", "notes=oud&maxPrice=500" */
  query: string;
  href: string;
  linkLabel: string;
  enabled: boolean;
};

export type StorefrontSettings = {
  notices: string[];
  hero: HeroSlide[];
  homeRows: HomeRow[];
};

export type StorefrontLimits = {
  notices: number;
  noticeLength: number;
  hero: number;
  homeRows: number;
  title: number;
  label: number;
  alt: number;
  query: number;
};

export type StorefrontSettingsAdmin = {
  settings: StorefrontSettings;
  updatedAt: string | null;
  usingDefaults: boolean;
  defaults: StorefrontSettings;
  limits: StorefrontLimits;
};
