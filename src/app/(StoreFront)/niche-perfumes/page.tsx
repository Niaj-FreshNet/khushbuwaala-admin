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
  title: "Niche Perfume Collection | Khushbuwaala",
  description:
    "Explore Khushbuwaala's Niche Perfume collection. Premium fragrances with free nationwide shipping on orders over ৳1000.",
  keywords: [
    "niche perfume",
    "premium fragrance",
    "Khushbuwaala shop",
    "Bangladesh perfume",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/niche-perfumes" },
};

// Structured Data (Optional)
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Niche Perfume Collection",
  description:
    "Explore Khushbuwaala's curated collection of niche perfumes",
  url: "https://khushbuwaala.com/niche-perfumes",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Oil Products",
    description: "Premium quality organic and authentic attars",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "Niche Perfumes", item: "https://khushbuwaala.com/niche-perfumes" },
    ],
  },
};

// Page Component
export default async function NichePerfumesPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe
  // const store = initializeStore();

  const page = Number(searchParams.page) || 1;
  const categoryName = "NICHE-PERFUMES";
  const categoryId = "";

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/niche-perfumes?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/niche-perfumes?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />

      <ShopShell
        bannerHeading="Explore Niche Perfumes"
        bannerText="Choose Niche Perfumes from our curated collection of premium fragrances"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying the best quality niche perfumes"
        noticesHeading="Niche Perfumes"
        initialPage={page}
        categoryId={categoryId}
        categoryName={categoryName}
        lockCategory={true} // ✅ category locked
      />
    </>
  );
}