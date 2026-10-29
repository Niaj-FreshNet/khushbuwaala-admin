'use client'

import React from "react"
import {
  useGetBestSellersQuery,
  useGetProductsByCategoryIdQuery,
  useGetFeaturedProductsQuery,
  useGetNewArrivalsQuery,
} from "@/redux/store/api/product/productApi"
import { ProductCarouselClient } from "./ProductCarouselClient"
import { ProductCarouselSkeleton } from "./ProductCarouselSkeleton"

interface ProductCarouselSectionProps {
  title: string
  category?: string
  section?: "bestSeller" | "featured" | "newArrivals"
  linkPath?: string
  titleVariant?: "default" | "gradient" | "elegant" | "modern" | "premium"
  titleSubtitle?: string
  titleIcon?: React.ReactNode
  titleUnderlineWidth?: string
  titleAnimated?: boolean
  titleShowDecorations?: boolean
  titleUnderlineVariant?: "default" | "wide" | "full"
}

export function ProductCarouselSection({
  title,
  category,
  section,
  linkPath,
  titleVariant = "default",
  titleSubtitle,
  titleIcon,
  titleUnderlineWidth,
  titleAnimated = true,
  titleShowDecorations = true,
  titleUnderlineVariant,
}: ProductCarouselSectionProps) {
  // Conditional API calls based on props
  const {
    data: bestSellerData,
    isLoading: isBestsellerLoading,
  } = useGetBestSellersQuery(undefined, { skip: section !== "bestSeller" })

  const {
    data: featuredData,
    isLoading: isFeaturedLoading,
  } = useGetFeaturedProductsQuery(undefined, { skip: section !== "featured" })

  const {
    data: newArrivalsData,
    isLoading: isNewArrivalsLoading,
  } = useGetNewArrivalsQuery(undefined, { skip: section !== "newArrivals" })

  const {
    data: categoryData,
    isLoading: isCategoryLoading,
  } = useGetProductsByCategoryIdQuery(
    { categoryId: category || "", params: { limit: 12 } },
    { skip: !category }
  )

  // Extract products and loading state based on section/category
  let products: any[] = []
  let isLoading = false

  if (section === "bestSeller") {
    products = bestSellerData?.data || []
    isLoading = isBestsellerLoading
  } else if (section === "featured") {
    products = featuredData || []
    isLoading = isFeaturedLoading
  } else if (section === "newArrivals") {
    products = newArrivalsData || []
    isLoading = isNewArrivalsLoading
  } else if (category) {
    products = categoryData?.data || []
    isLoading = isCategoryLoading
  }

  // Skeleton fallback while loading
  if (isLoading) {
    return (
      <ProductCarouselSkeleton
        title={title}
        titleVariant={titleVariant}
        titleSubtitle={titleSubtitle}
        titleIcon={titleIcon}
        titleUnderlineWidth={titleUnderlineWidth}
        titleAnimated={titleAnimated}
        titleShowDecorations={titleShowDecorations}
        titleUnderlineVariant={titleUnderlineVariant}
      />
    )
  }

  // No products? Render nothing or a simple message
  if (!products?.length) return null

  // Render the carousel
  return (
    <ProductCarouselClient
      products={products}
      title={title}
      titleVariant={titleVariant}
      titleSubtitle={titleSubtitle}
      titleIcon={titleIcon}
      titleUnderlineWidth={titleUnderlineWidth}
      titleAnimated={titleAnimated}
      titleShowDecorations={titleShowDecorations}
      titleUnderlineVariant={titleUnderlineVariant}
    />
  )
}
