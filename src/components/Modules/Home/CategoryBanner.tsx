import { SectionTitle } from "./SectionTitle"
import { CategoryGridClient } from "./CategoryGridClient"

export function CategoryBanner() {
  const categories = [
    {
      CategoryName: "Organic Attar",
      CategoryImage: "/images/natural-category.jpg",
      CategoryLink: "/organic-attar",
      description: "Pure natural attar and organic fragrances, crafted from the finest natural ingredients.",
    },
    {
      CategoryName: "Orientals",
      CategoryImage: "/images/oriental-category.jpg",
      CategoryLink: "/oriental-attar",
      description: "Authentic oriental and Arabian attar, rich in tradition and exotic aromas.",
    },
    {
      CategoryName: "Artificial Oud",
      CategoryImage: "/images/oud-category.jpg",
      CategoryLink: "/artificial-oud",
      description: "Premium artificial oud fragrances, offering deep and captivating woody notes.",
    },
    {
      CategoryName: "Perfume Oils",
      CategoryImage: "/images/inspired-category.jpg",
      CategoryLink: "/inspired-perfume-oil",
      description: "High-quality inspired perfume oils that capture the essence of luxury fragrances.",
    },
    {
      CategoryName: "Brand Perfumes",
      CategoryImage: "/images/brand-perfume-category.jpg",
      CategoryLink: "/brand-perfumes",
      description: "Designer Perfumes from Popular Brands.",
    },
    {
      CategoryName: "Niche Perfumes",
      CategoryImage: "/images/niche-perfume-category.jpg",
      CategoryLink: "/niche-perfumes",
      description: "Our In-house Perfume Creations.",
    },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-1 sm:px-2 lg:px-3 mb-8 sm:mb-10 lg:mb-12" aria-labelledby="categories-heading">
      <div className="px-0">
        <SectionTitle
          title="Shop by Categories"
          variant="premium"
        />
      </div>

      <div className="w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] mx-auto">        {/* ✅ Client component handles motion + rendering */}
        <CategoryGridClient categories={categories} />
      </div>
    </section>
  )
}
