import { Suspense } from "react";
import { Metadata } from "next";
import { NoticeBar } from "@/components/Modules/Shop/NoticeBar";
import { ShopBanner } from "@/components/Modules/Shop/ShopBanner";
import { ClientShopProducts } from "@/components/Modules/Shop/ClientShopProducts";
import { ShopShell } from "@/components/Modules/Shop/ShopShell";

// ❌ SSR Redux intentionally disabled for performance
// import { initializeStore } from "@/redux/store/ssrStore";
// import { productApi } from "@/redux/store/api/product/productApi";
// import { IProductResponse } from "@/types/product.types";

// =================== SEO METADATA ===================
export async function generateMetadata({
    searchParams: rawSearchParams,
}: {
    searchParams: { page?: string; category?: string; specification?: string; section?: string };
}): Promise<Metadata> {
    const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe
    const page = Number(searchParams.page) || 1;

    const title = `Shop Perfumes${page > 1 ? ` - Page ${page}` : ""} | Khushbuwaala`;
    const description = `Browse${page > 1 ? ` page ${page} of` : ""} Khushbuwaala's premium perfume oils. Discover authentic fragrances with free shipping on orders over ৳1000.`;

    return {
        title,
        description,
        keywords: [
            "perfume oil",
            "premium fragrance",
            "attar collection",
            "Khushbuwaala shop",
            "online perfume store",
            "natural fragrance",
            "oriental perfume",
            "inspired perfume oil",
            "artificial oud",
            "Bangladesh perfume",
        ].join(", "),
        alternates: {
            canonical: `https://khushbuwaala.com/shop${page > 1 ? `?page=${page}` : ""}`,
            languages: {
                "en-BD": `https://khushbuwaala.com/shop${page > 1 ? `?page=${page}` : ""}`,
            },
        },
        openGraph: {
            title,
            description,
            url: `https://khushbuwaala.com/shop${page > 1 ? `?page=${page}` : ""}`,
            images: [
                {
                    url: "/images/n111.webp",
                    width: 1920,
                    height: 550,
                    alt: "Khushbuwaala Premium Perfume Oil Collection"
                },
            ],
            type: "website",
            siteName: "Khushbuwaala",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/images/n111.webp"],
        },
        robots: {
            index: page <= 3,
            follow: true,
            googleBot: {
                index: page <= 3,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1
            },
        },
    };
}

export default async function ShopPage({
    searchParams: rawSearchParams
}: {
    searchParams: Record<string, string | undefined>
}) {
    const searchParams = await Promise.resolve(rawSearchParams); // ✅ async-safe
    // const store = initializeStore();

    const page = Number(searchParams.page) || 1;
    const categoryName = searchParams.category;
    const specification = searchParams.specification;
    const section = searchParams.section;
    const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
    const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
    const accords = searchParams.accords;
    const perfumeNotes = searchParams.perfumeNotes;
    const performance = searchParams.performance;
    // const sortBy = searchParams.sortBy as
    //     | "name"
    //     | "price_asc"
    //     | "price_desc"
    //     | "newest"
    //     | "oldest"
    //     | "popularity"
    //     | undefined;
    const sortBy = "a-z" as string | undefined;

    // =================== STRUCTURED DATA ===================
    // Before returning JSX in ShopPage
    const shopStructuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Premium Perfume Oil Collection",
        description: "Explore Khushbuwaala's curated collection of world-class perfume oils and fragrances",
        url: "https://khushbuwaala.com/shop",
        mainEntity: {
            "@type": "ItemList",
            name: "Perfume Oil Products",
            description: "Premium quality perfume oils and fragrances",
            itemListElement: [], // will be dynamically filled inside ShopProducts
        },
        breadcrumb: {
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://khushbuwaala.com"
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "Shop",
                    item: "https://khushbuwaala.com/shop"
                },
            ],
        },
    };

    return (
        <>
            {/* Hidden crawlable pagination links */}
            {page > 1 && (
                <link
                    rel="prev"
                    href={`/shop?page=${page - 1}`}
                />
            )}
            {page < 100 && (
                <link
                    rel="next"
                    href={`/shop?page=${page + 1}`}
                />
            )}

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(shopStructuredData) }}
            />

            <ShopShell
                showHeading={false}
                bannerHeading="Best Quality Perfume Oil Collection"
                bannerText="Choose Your Desired Perfume Oil from World's Best Perfume Oil Collection"
                bannerImages={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
                bannerAlt="Banner displaying the best quality perfume oil collection"
                noticesHeading="World's Finest Perfume Oils"
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

            {/* <div className="w-full mx-auto">
                <ShopBanner
                    heading="Best Quality Perfume Oil Collection"
                    text="Choose Your Desired Perfume Oil from World's Best Perfume Oil Collection"
                    buttonText="Shop Now"
                    link="/shop"
                    images={{ desktop: "/images/n111.png", mobile: "/images/n1.webp" }}
                    altText="Banner displaying the best quality perfume oil collection"
                    variant="premium"
                />
                <div className="py-8 bg-gradient-to-r from-gray-50 via-white to-gray-50">
                    <NoticeBar heading="World's Finest Perfume Oils" notices={notices} interval={4500} />
                </div>
                <div id="products" className="bg-white pt-0 pb-8">
                    <ClientShopProducts
                        initialPage={page}
                        category={category}
                        specification={specification}
                        section={section}
                        priceMin={minPrice}
                        priceMax={maxPrice}
                        smells={smells}
                        sortBy={sortBy}
                    />
                </div>
            </div> */}
        </>
    );
}