import { Suspense } from "react";
import { Metadata } from "next";
import { NoticeBar } from "@/components/Modules/Shop/NoticeBar";
import { ShopBanner } from "@/components/Modules/Shop/ShopBanner";
import { ShopProducts } from "@/components/Modules/Shop/ShopProducts";
import { initializeStore } from "@/redux/store/ssrStore";
import { productApi } from "@/redux/store/api/product/productApi";
import { IProductResponse } from "@/types/product.types";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopShell } from "@/components/Modules/Shop/ShopShell";

// ✅ SEO Metadata
export const metadata: Metadata = {
  title: "New Arrivals - Latest Perfume Oil Collection | Khushbuwaala",
  description:
    "Discover the newest perfume oils from Khushbuwaala. Premium quality, inspired and oriental fragrances — freshly added to our collection!",
  keywords: [
    "new perfume arrivals",
    "latest perfume oil",
    "Khushbuwaala new collection",
    "premium fragrance",
    "attar collection",
    "Bangladesh perfume",
  ].join(", "),
  alternates: {
    canonical: "https://khushbuwaala.com/new-arrivals",
  },
  openGraph: {
    title: "New Arrivals - Latest Perfume Oil Collection | Khushbuwaala",
    description:
      "Explore Khushbuwaala's latest perfume oil arrivals. Authentic, luxurious, and freshly added fragrances.",
    url: "https://khushbuwaala.com/new-arrivals",
    images: [
      {
        url: "/images/n111.webp",
        width: 1920,
        height: 550,
        alt: "Khushbuwaala New Perfume Arrivals",
      },
    ],
    type: "website",
    siteName: "Khushbuwaala",
  },
  twitter: {
    card: "summary_large_image",
    title: "New Perfume Arrivals | Khushbuwaala",
    description:
      "Shop the latest perfume oils freshly added to Khushbuwaala’s premium fragrance collection.",
    images: ["/images/n111.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ✅ Structured Data
const newArrivalStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "New Arrivals - Perfume Oil Collection",
  description:
    "Discover the newest perfume oils and fragrances from Khushbuwaala’s premium collection.",
  url: "https://khushbuwaala.com/new-arrivals",
  mainEntity: {
    "@type": "ItemList",
    name: "New Perfume Oil Products",
    description: "Premium quality new arrival perfume oils and fragrances",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://khushbuwaala.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "New Arrivals",
        item: "https://khushbuwaala.com/new-arrivals",
      },
    ],
  },
};

// ✅ Page Component
export default async function NewArrivalsPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe

  const page = Number(searchParams.page) || 1;
  const categoryName = searchParams.category;
  const specification = searchParams.specification;
  const section = searchParams.section;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const accords = searchParams.accords;
  const perfumeNotes = searchParams.perfumeNotes;
  const performance = searchParams.performance;
  const sortBy = searchParams.sortBy as
    | "name"
    | "price_asc"
    | "price_desc"
    | "newest"
    | "oldest"
    | "popularity"
    | undefined;
  // const sortBy = "newest" as string | undefined;

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/new-arrivals?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/new-arrivals?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(newArrivalStructuredData),
        }}
      />

      <ShopShell
        bannerHeading="Get The Latest Perfume Oil Editions"
        bannerText="Choose Your Desired Perfume Oil from Our New Arrivals"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying the newest perfume oil arrivals"
        noticesHeading="New Arrivals"
        initialPage={page}
        categoryName={categoryName}
        specification={specification}
        section={section}
        minPrice={minPrice}
        maxPrice={maxPrice}
        accords={accords}
        perfumeNotes={perfumeNotes}
        performance={performance}
        sortBy={sortBy}
        lockCategory={false}
      />
    </>
  );
}