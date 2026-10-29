"use client"

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useState, useRef } from "react"
import type React from "react"
import { SectionTitle } from "./SectionTitle"
import { ProductCard } from "@/components/ReusableUI/ProductCard"
import { IProductResponse } from "@/types/product.types"

import dynamic from "next/dynamic"
// REMOVE: import { motion, useInView, Variants, useReducedMotion } from "framer-motion"

const ProductQuickView = dynamic(
  () => import("@/components/ReusableUI/ProductQuickView").then((m) => m.ProductQuickView),
  { ssr: false }
)

export function ProductCarouselClient({
  products,
  title,
  titleVariant = "default",
  titleSubtitle,
  titleIcon,
  titleUnderlineWidth,
  titleAnimated = true,
  titleShowDecorations = true,
  titleUnderlineVariant = "default",
}: {
  products: IProductResponse[]
  title: string
  titleVariant?: "default" | "gradient" | "elegant" | "modern" | "premium"
  titleSubtitle?: string
  titleIcon?: React.ReactNode
  titleUnderlineWidth?: string
  titleAnimated?: boolean
  titleShowDecorations?: boolean
  titleUnderlineVariant?: "default" | "wide" | "full"
}) {
  const [quickViewProduct, setQuickViewProduct] = useState<IProductResponse | null>(null)
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const handleQuickView = (product: IProductResponse) => {
    setQuickViewProduct(product)
    setIsQuickViewOpen(true)
  }

  const wrapRef = useRef<HTMLDivElement | null>(null)

  return (
    <section ref={wrapRef} className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-1 sm:px-2 lg:px-3 mb-8 sm:mb-10 lg:mb-12">
      <SectionTitle
        title={title}
        subtitle={titleSubtitle}
        variant={titleVariant}
        icon={titleIcon}
        animated={titleAnimated}
        showDecorations={titleShowDecorations}
        underlineVariant={titleUnderlineVariant}
      />

      <div className="relative">
        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="w-full -ml-2 md:-ml-3 items-start">
            {products.map((product) => (
              <CarouselItem
                key={product.id}
                className="pl-1 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 2xl:basis-1/6"
              >
                <div className="h-full">
                  <ProductCard className="h-auto" product={product} onQuickView={() => handleQuickView(product)} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="hidden md:flex w-11 h-11 -left-4 lg:-left-6 bg-white/50 hover:bg-white/70 text-gray-800 backdrop-blur-md border border-gray-200 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all duration-200" />
          <CarouselNext className="hidden md:flex w-11 h-11 -right-4 lg:-right-6 bg-white/50 hover:bg-white/70 text-gray-800 backdrop-blur-md border border-gray-200 shadow-lg shadow-black/5 hover:scale-105 active:scale-95 transition-all duration-200" />
        </Carousel>
      </div>

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          open={isQuickViewOpen}
          onOpenChange={setIsQuickViewOpen}
        />
      )}
    </section>
  )
}