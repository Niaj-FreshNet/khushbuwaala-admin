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
  title: "Perfume Gift Packages | Khushbuwaala",
  description:
    "Explore Khushbuwaala's curated perfume gift packages. Premium quality fragrances with free nationwide shipping on orders over ৳1000.",
  keywords: [
    "perfume gift",
    "perfume packages",
    "premium fragrance",
    "Khushbuwaala shop",
    "Bangladesh perfume",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/gifts-and-packages" },
};

// Structured Data
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Perfume Gift Packages",
  description:
    "Explore Khushbuwaala's curated collection of perfume gift packages",
  url: "https://khushbuwaala.com/gifts-and-packages",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Gift Products",
    description: "Premium perfume gift packages and boxes",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "Gifts & Packages", item: "https://khushbuwaala.com/gifts-and-packages" },
    ],
  },
};

// Page Component
export default async function GiftsAndPackagesPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe
  // const store = initializeStore();

  const page = Number(searchParams.page) || 1;
  const categoryName = "GIFTS-AND-PACKAGES";
  const categoryId = "697248c02cbb0d4887f16e33";

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/gifts-and-packages?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/gifts-and-packages?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />

      <ShopShell
        bannerHeading="Perfume Packages and Gift Boxes"
        bannerText="Choose Your Desired Perfume Oil Packages and Gifts for The Season"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying the best quality perfume oil gift packages"
        noticesHeading="Gifts & Combo Packages"
        initialPage={page}
        categoryId={categoryId}
        categoryName={categoryName}
        lockCategory={true} // ✅ category locked
      />
    </>
  );
}