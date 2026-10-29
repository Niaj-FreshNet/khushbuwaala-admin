"use client"

import Image from "next/image"
import Link from "next/link"
import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const home1 = "/hero1desktop11.webp"
const home2 = "/hero2desktop22.webp"
const home3 = "/hero3desktop33.webp"
const homeMobile1 = "/hero1mobile11.webp"
const homeMobile2 = "/hero2mobile22.webp"
const homeMobile3 = "/hero3mobile33.webp"

type Slide = {
  src: string              // desktop
  mobileSrc?: string       // mobile
  alt: string
  primaryText: string
  primaryLink: string
  secondaryText?: string
  secondaryLink?: string
}

export function CarouselSlider() {
  const plugin = React.useRef(
    Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const slides: Slide[] = [
    {
      src: home1,
      mobileSrc: homeMobile1,
      alt: "Khushbuwaala Premium Perfumes",
      primaryText: "Shop Now",
      primaryLink: "/shop",
      secondaryText: "Explore Collections",
      secondaryLink: "/shop",
    },
    {
      src: home2,
      mobileSrc: homeMobile2,
      alt: "Khushbuwaala Attars & Oud",
      primaryText: "Explore Collections",
      primaryLink: "/shop",
      secondaryText: "Best Sellers",
      secondaryLink: "/shop",
    },
    {
      src: home3,
      mobileSrc: homeMobile3,
      alt: "Khushbuwaala Attars & Oud",
      primaryText: "Best Sellers",
      primaryLink: "/shop",
      secondaryText: "Best Sellers",
      secondaryLink: "/shop",
    },
  ]

  const [api, setApi] = React.useState<any>(null)
  const [active, setActive] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(slides.length)

  React.useEffect(() => {
    if (!api) return
    setSnapCount(api.scrollSnapList().length)
    setActive(api.selectedScrollSnap())

    const onSelect = () => setActive(api.selectedScrollSnap())
    api.on("select", onSelect)
    api.on("reInit", onSelect)

    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  const goTo = (index: number) => api?.scrollTo(index)

  return (
    <section className="w-full overflow-hidden relative mt-1 sm:mt-2 mb-2 sm:mb-4" aria-label="Hero Carousel">
      <Carousel setApi={setApi} plugins={[plugin.current]} className="w-full">
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              {/* Sleeker responsive container: Compact min-height, capped max-height */}
              <div className="relative w-full aspect-21/9 sm:aspect-[2.6/1] md:aspect-[3/1] lg:aspect-[3.4/1] 2xl:aspect-[3.8/1] min-h-[190px] sm:min-h-[240px] max-h-[380px]">
                {/* Mobile image */}
                <Image
                  src={slide.mobileSrc || slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  className="object-cover md:hidden"
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                  quality={70}
                />

                {/* Desktop image */}
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="100vw"
                  className="object-cover hidden md:block"
                  priority={false}
                  loading="lazy"
                  quality={85}
                />

                {/* Minimal vignette for CTA readability */}
                <div className="absolute inset-0 bg-linear-to-t from-black/35 via-black/0 to-transparent" />

                {/* CTA Dock: bottom padding ensures it clears the dots completely */}
                <div className="absolute inset-0 flex items-end">
                  <div className="container mx-auto sm:px-4 md:px-8 pb-8 sm:pb-10 md:pb-12">
                    <div className="flex justify-center">
                      <div
                        className={[
                          "relative z-20 pointer-events-auto",
                          "w-auto max-w-[92%] md:max-w-none",
                          "flex items-center gap-2 sm:gap-3",
                          "transition-all duration-300 ease-out motion-reduce:transition-none",
                          active === index
                            ? "opacity-100 translate-y-0 blur-0"
                            : "opacity-0 translate-y-2 blur-[6px] pointer-events-none",
                        ].join(" ")}
                      >
                        <Button
                          asChild
                          className="
            h-7.5 sm:h-8.5 md:h-9.5
            px-4 sm:px-5 md:px-6
            text-[11px] sm:text-xs md:text-sm font-medium
            rounded-full
            text-white
            bg-white/10 hover:bg-white/20
            backdrop-blur-md
            border border-white/30 hover:border-white/50
            shadow-[0_4px_16px_rgba(0,0,0,0.25)]
            hover:scale-[1.03]
            transition-all duration-200
          "
                        >
                          <Link href={slide.primaryLink} aria-label={slide.primaryText} className="flex items-center">
                            {slide.primaryText}
                            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Arrows */}
        <CarouselPrevious className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/15 backdrop-blur-md transition-all" />
        <CarouselNext className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 hidden md:flex bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/15 backdrop-blur-md transition-all" />

        {/* Dots (anchored at the very bottom edge with tight bounds) */}
        <div className="absolute bottom-0 sm:bottom-2 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-0.5">
            {Array.from({ length: snapCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={[
                  "grid place-items-center rounded-full",
                  "h-5 w-5 sm:h-6 sm:w-6",
                  "relative",
                  "transition-transform duration-200",
                  "active:scale-95",
                  i === active ? "scale-100" : "scale-95",
                ].join(" ")}
              >
                <span
                  className={[
                    "block rounded-full transition-all duration-300",
                    i === active
                      ? "w-4 h-1 sm:w-5 sm:h-1.5 bg-white shadow-xs"
                      : "w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white/40 hover:bg-white/70",
                  ].join(" ")}
                />
              </button>
            ))}
          </div>
        </div>
      </Carousel>
    </section>
  )
}