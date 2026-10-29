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

// Metadata
export const metadata: Metadata = {
  title: "Perfume Oils for Women | Khushbuwaala",
  description:
    "Explore Khushbuwaala's premium perfume oils designed for women. Authentic fragrances with free nationwide shipping on orders over ৳1000.",
  keywords: [
    "perfume oil women",
    "women fragrance",
    "premium attar",
    "Khushbuwaala shop",
    "Bangladesh perfume",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/for-women" },
};

// Structured Data (Optional)
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Perfume Oils for Women",
  description:
    "Explore Khushbuwaala's curated collection of perfume oils for women",
  url: "https://khushbuwaala.com/for-women",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Oil Products",
    description: "Premium quality perfume oils for women",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "For Women", item: "https://khushbuwaala.com/for-women" },
    ],
  },
};

// Page Component
export default async function ForWomenPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe

  const page = Number(searchParams.page) || 1;
  const categoryName = searchParams.category;
  const specification = "female";
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

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/womens-perfume?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/womens-perfume?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />

      <ShopShell
        bannerHeading="Premium Fragrances Suit For Women"
        bannerText="Choose Your Desired Perfume Oil for Girls and Women"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying premium perfume oils for women"
        noticesHeading="Womens Perfume Oil"
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