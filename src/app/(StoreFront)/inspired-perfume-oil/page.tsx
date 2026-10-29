import { Metadata } from "next";
import { ShopShell } from "@/components/Modules/Shop/ShopShell";

// Metadata
export const metadata: Metadata = {
  title: "Inspired Perfume Oils | Khushbuwaala",
  description:
    "Explore Khushbuwaala's inspired perfume oil collection. Premium fragrances with free nationwide shipping on orders over ৳1000.",
  keywords: [
    "inspired perfume oil",
    "perfume oil",
    "premium fragrance",
    "attar collection",
    "Khushbuwaala shop",
    "Bangladesh perfume",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/inspired-perfume-oil" },
};

// Structured Data (Optional)
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Inspired Perfume Oils",
  description:
    "Explore Khushbuwaala's curated collection of inspired perfume oils and fragrances",
  url: "https://khushbuwaala.com/inspired-perfume-oil",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Oil Products",
    description: "Premium quality inspired perfume oils",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "Inspired Perfume Oils", item: "https://khushbuwaala.com/inspired-perfume-oil" },
    ],
  },
};

// Page Component
export default async function InspiredPerfumeOilsPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe
  // const store = initializeStore();

  const page = Number(searchParams.page) || 1;
  const categoryName = "INSPIRED-PERFUME-OIL";
  const categoryId = "6904ac7b7a035c41185d272a";

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/inspired-perfume-oil?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/inspired-perfume-oil?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />

      <ShopShell
        bannerHeading="Explore Inspired Perfume Oils"
        bannerText="Choose Your Desired Perfume Oil from Inspired Perfume Oil Collections"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying inspired perfume oil collection"
        noticesHeading="Inspired Perfume Oils"
        initialPage={page}
        categoryId={categoryId}
        categoryName={categoryName}
        lockCategory={true} // ✅ category locked
      />
    </>
  );
}