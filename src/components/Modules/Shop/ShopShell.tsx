import { ClientShopProducts } from "@/components/Modules/Shop/ClientShopProducts";

type ShopShellProps = {
  // banner
  bannerHeading: string;
  bannerText: string;
  bannerLink?: string;
  bannerImages: { desktop: string; mobile: string };
  bannerAlt: string;

  // product inputs
  initialPage: number;
  categoryId?: string;
  categoryName?: string;
  specification?: string;
  section?: string;
  minPrice?: number;
  maxPrice?: number;
  accords?: string;
  perfumeNotes?: string;
  performance?: string;
  sortBy?: string;

  // behavior
  lockCategory?: boolean;
  noticesHeading?: string;
  showHeading?: boolean; // ✅ Controls heading visibility
};

export function ShopShell({
  bannerHeading,
  bannerText,
  bannerLink = "/shop",
  bannerImages,
  bannerAlt,

  initialPage,
  categoryId,
  categoryName,
  specification,
  section,
  minPrice,
  maxPrice,
  accords,
  perfumeNotes,
  performance,
  sortBy,

  lockCategory = false,
  noticesHeading = "World's Finest Perfume Oils",
  showHeading = true, // ✅ Defaults to visible
}: ShopShellProps) {

  return (
    <div className="w-full mx-auto mt-0 sm:mt-4">
      {/* <ShopBanner
        heading={bannerHeading}
        text={bannerText}
        buttonText="Shop Now"
        link={bannerLink}
        images={bannerImages}
        altText={bannerAlt}
        variant="premium"
      /> */}

      {/* Render heading only when showHeading is true and a heading exists */}
      {showHeading && noticesHeading && (
        <div className="py-0 bg-linear-to-r from-gray-50 via-white to-gray-50">
          <div className="bg-linear-to-r from-red-50 to-pink-50 pt-4 pb-2 px-4 text-center overflow-hidden">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
                {noticesHeading}
              </h2>
            </div>
          </div>
        </div>
      )}

      <div id="products" className="bg-white pt-0 pb-4">
        <ClientShopProducts
          initialPage={initialPage}
          categoryId={categoryId}
          categoryName={categoryName}
          specification={specification}
          section={section}
          minPrice={minPrice}
          maxPrice={maxPrice}
          accords={accords}
          perfumeNotes={perfumeNotes}
          performance={performance}
          sortBy={sortBy}
          lockCategory={lockCategory}
        />
      </div>
    </div>
  );
}