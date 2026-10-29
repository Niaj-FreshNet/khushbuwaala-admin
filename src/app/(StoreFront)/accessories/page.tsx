import { Suspense } from "react";
import { Metadata } from "next";
import { ShopShell } from "@/components/Modules/Shop/ShopShell";

// Metadata
export const metadata: Metadata = {
  title: "Perfume Accessories & Bottles | Khushbuwaala",
  description:
    "Explore Khushbuwaala's premium fragrance accessories, empty bottles, roll-ons, and perfume atomizers. Enjoy free nationwide shipping on orders over ৳1000.",
  keywords: [
    "perfume accessories",
    "attar bottles",
    "empty roll on bottle",
    "perfume atomizers",
    "fragrance accessories Bangladesh",
    "Khushbuwaala accessories",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/accessories" },
};

// Structured Data
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Fragrance Accessories Collection",
  description:
    "Explore Khushbuwaala's curated collection of perfume accessories and applicators",
  url: "https://khushbuwaala.com/accessories",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Accessories",
    description: "Premium quality perfume bottles, roll-ons, and accessories",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "Accessories", item: "https://khushbuwaala.com/accessories" },
    ],
  },
};

// Page Component
export default async function AccessoriesPage({
  searchParams: rawSearchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>> | Record<string, string | undefined>;
}) {
  const searchParams = await Promise.resolve(rawSearchParams);

  const page = Number(searchParams?.page) || 1;
  const categoryName = "ACCESSORIES";
  const categoryId = "";

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/accessories?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/accessories?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />

      <ShopShell
        bannerHeading="Premium Fragrance Accessories"
        bannerText="High-Quality Bottles, Atomizers & Application Essentials"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying premium perfume accessories and bottles"
        noticesHeading="Accessories"
        initialPage={page}
        categoryId={categoryId}
        categoryName={categoryName}
        lockCategory={true}
      />
    </>
  );
}