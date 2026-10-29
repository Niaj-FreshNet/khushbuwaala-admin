import type { Metadata } from "next"
import { CarouselSlider } from "@/components/Modules/Home/CaoruselSlider"
import { CategoryBanner } from "@/components/Modules/Home/CategoryBanner"
import { ReviewsSection } from "@/components/Modules/Home/ReviewSection"
import { ServicesSection } from "@/components/Modules/Home/ServiceSection"
import { SubscribeSection } from "@/components/Modules/Home/SubscribeSection"
import { Crown, Gem, Sparkles, Star } from "lucide-react"
import { ProductCarouselSection } from "@/components/Modules/Home/ProductCarouselSection"
import Deferred from "@/components/Shared/Deferred"
import MountOnView from "@/components/Shared/MountOnView"
import BannerSection from "@/components/Modules/Home/BannerSection.client"

// SEO: Page-specific Metadata for the homepage
export const metadata: Metadata = {
  title: "Home", // This will be combined with the template from root layout
  description:
    "Discover Khushbuwaala's exquisite collection of premium perfumes, oriental attars, and natural fragrances. Shop best sellers, new arrivals, and more.",
  keywords:
    "perfume, attar, fragrance, Khushbuwaala, homepage, best sellers, new arrivals, inspired perfume, oriental attar, artificial oud, natural collection",
  alternates: {
    canonical: "https://khushbuwaala.com/", // Canonical URL for the homepage
  },
  openGraph: {
    title: "Khushbuwaala - Premium Perfumes & Attars | Authentic Fragrances",
    description:
      "Your ultimate destination for premium perfumes and attars. Explore our best sellers, new collections, and exclusive offers.",
    url: "https://khushbuwaala.com/",
    images: [
      {
        url: "/images/og-image-homepage.jpg", // Specific OG image for homepage
        width: 1200,
        height: 630,
        alt: "Khushbuwaala Homepage - Premium Perfumes",
      },
    ],
  },
  // Add more specific metadata as needed for the homepage
}

// Server Component - Orchestrates all sections of the homepage
export default function HomePage() {
  return (
    <div className="w-full mx-auto">
      {/* Hero Carousel Slider */}
      <CarouselSlider />

      {/* Best Sellers Section with premium variant */}
      <ProductCarouselSection
        title="Best Sellers"
        section="bestSeller"
        linkPath="/shop"
        titleVariant="premium"
      />

      <Deferred delay={800}>

        {/* Category Banner Section */}
        <CategoryBanner />

        {/* <MountOnView>
          <BannerSection
            heading="Explore Oriental Fragrances"
            text="Choose Your Desired Perfume Oil from Oriental & Arabian Attar Collections"
            buttonText="Shop Now"
            link="/oriental-attar"
            images={{
              mobile: "/images/banner2-mobile.webp",
              desktop: "/images/banner2.webp", // Tablet will fallback to desktop
            }}
            variant="secondary"
          />
        </MountOnView> */}

        {/* Oriental Products Section with elegant variant */}
        <MountOnView>
          <ProductCarouselSection
            title="Arabian Attar"
            category="6904acd47a035c41185d272c"
            linkPath="/oriental-attar"
            titleVariant="premium"
          />
        </MountOnView>

        {/* <MountOnView>
          <BannerSection
            heading="Best Artificial Editions Of Oud Oils"
            text="Choose The Royal Fragrances From Artificial Oud Collection"
            buttonText="Shop Now"
            link="/artificial-oud"
            images={{
              mobile: "/images/banner3-mobile.webp",
              desktop: "/images/banner3.webp",
            }}
            variant="tertiary"
          />
        </MountOnView> */}

        {/* Artificial Oud Products Section with modern variant */}
        <MountOnView>
          <ProductCarouselSection
            title="Artificial Oud"
            category="6904ab807a035c41185d2729"
            linkPath="/artificial-oud"
            titleVariant="premium"
          />
        </MountOnView>

        {/* <MountOnView>
          <BannerSection
            heading="Premium Inspired Perfume Oils"
            text="Get The Best Perfume Oil Editions Inspired From Designer Perfumes"
            buttonText="Shop Now"
            link="/inspired-perfume-oil"
            images={{
              mobile: "/images/banner1-mobile.webp", // 768x400 - portrait crop
              tablet: "/images/banner1-tablet.webp", // 1024x500 - landscape crop
              desktop: "/images/banner1.webp", // 1920x600 - wide landscape
            }}
            variant="primary"
          />
        </MountOnView> */}

        {/* Inspired Perfume Products Section with gradient variant */}
        <MountOnView>
          <ProductCarouselSection
            title="Inspired Perfume Oils"
            category="6904ac7b7a035c41185d272a"
            linkPath="/inspired-perfume-oud"
            titleVariant="premium"
          />
        </MountOnView>

        {/* Services Section */}
        <ServicesSection />

        {/* Reviews Section */}
        {/* <ReviewsSection /> */}

        {/* Subscribe Section */}
        <SubscribeSection />

      </Deferred>
    </div>
  )
}
