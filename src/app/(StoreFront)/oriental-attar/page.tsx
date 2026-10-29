import { Metadata } from "next";
import { ShopShell } from "@/components/Modules/Shop/ShopShell";

// Metadata
export const metadata: Metadata = {
  title: "Oriental & Arabian Attar | Khushbuwaala",
  description:
    "Explore Khushbuwaala's oriental perfume oil collection. Premium fragrances with free nationwide shipping on orders over ৳1000.",
  keywords: [
    "oriental perfume oil",
    "arabian attar",
    "premium fragrance",
    "Khushbuwaala shop",
    "Bangladesh perfume",
  ].join(", "),
  alternates: { canonical: "https://khushbuwaala.com/oriental-collection" },
};

// Structured Data (Optional)
const shopStructuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Oriental & Arabian Attar",
  description:
    "Explore Khushbuwaala's curated collection of oriental and arabian attar fragrances",
  url: "https://khushbuwaala.com/oriental-collection",
  mainEntity: {
    "@type": "ItemList",
    name: "Perfume Oil Products",
    description: "Premium quality oriental and arabian attar products",
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://khushbuwaala.com" },
      { "@type": "ListItem", position: 2, name: "Oriental Collection", item: "https://khushbuwaala.com/oriental-collection" },
    ],
  },
};

// Page Component
export default async function OrientalCollectionPage({
  searchParams: rawSearchParams
}: {
  searchParams: Record<string, string | undefined>
}) {
  const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe

  const page = Number(searchParams.page) || 1;
  const categoryName = "ORIENTAL-ATTAR";
  const categoryId = "6904acd47a035c41185d272c";

  return (
    <>
      {/* Hidden crawlable pagination links */}
      {page > 1 && (
        <link
          rel="prev"
          href={`/oriental-attar?page=${page - 1}`}
        />
      )}
      {page < 100 && (
        <link
          rel="next"
          href={`/oriental-attar?page=${page + 1}`}
        />
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
      />
      <ShopShell
        bannerHeading="Explore Oriental Fragrances"
        bannerText="Choose Your Desired Perfume Oil from Oriental & Arabian Attar Collections"
        bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
        bannerAlt="Banner displaying the best quality perfume oil collection"
        noticesHeading="Oriental & Arabian Attar"
        initialPage={page}
        categoryId={categoryId}
        categoryName={categoryName}
        lockCategory={true} // ✅ category locked
      />
    </>
  );
}