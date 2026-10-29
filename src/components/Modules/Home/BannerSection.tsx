"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Star, Play, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import React, { useMemo, useRef, useState } from "react"
import { useInViewOnce } from "@/components/Shared/useInViewOnce"

interface BannerProps {
  heading: string
  text: string
  buttonText: string
  link: string
  images: {
    mobile: string
    tablet?: string
    desktop: string
  }
  variant?: "primary" | "secondary" | "tertiary"
  overlayPattern?: "gradient" | "geometric" | "radial"
  showVideoButton?: boolean
  videoUrl?: string
  stats?: Array<{
    value: string
    label: string
  }>
  priority?: boolean
}

export function BannerSection({
  heading,
  text,
  buttonText,
  link,
  images,
  variant = "primary",
  overlayPattern = "gradient",
  showVideoButton = false,
  videoUrl,
  stats,
  priority = false,
}: BannerProps) {
  const sectionRef = useRef<HTMLElement | null>(null)

  // ✅ In-view animation (once)
  const isInView = useInViewOnce(sectionRef, { threshold: 0.3 })

  // ✅ Avoid overlay flicker: wait until image loads
  const [hasLoaded, setHasLoaded] = useState(false)

  // ✅ Determine if pointer is "fine" (desktop mouse/trackpad) once
  const enableMouse = useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(pointer:fine)").matches
  }, [])

  // ✅ stable "set loaded once"
  const markLoaded = () => setHasLoaded((v) => v || true)

  const styles = useMemo(() => {
    switch (variant) {
      case "primary":
        return {
          overlay: "bg-linear-to-br from-slate-900/95 via-purple-900/90 to-rose-900/95",
          accent: "from-rose-400 via-pink-400 to-purple-400",
          buttonStyle: "gradient",
          decorativeColor: "text-rose-300",
          glowColor: "shadow-rose-500/30",
          particleColors: ["bg-rose-400/40", "bg-pink-400/30", "bg-purple-400/35"],
        }
      case "secondary":
        return {
          overlay: "bg-linear-to-br from-indigo-950/95 via-blue-900/90 to-cyan-900/95",
          accent: "from-cyan-400 via-blue-400 to-indigo-400",
          buttonStyle: "gradient-secondary",
          decorativeColor: "text-cyan-300",
          glowColor: "shadow-cyan-500/30",
          particleColors: ["bg-cyan-400/40", "bg-blue-400/30", "bg-indigo-400/35"],
        }
      case "tertiary":
        return {
          overlay: "bg-linear-to-br from-amber-950/95 via-orange-900/90 to-red-900/95",
          accent: "from-amber-400 via-orange-400 to-red-400",
          buttonStyle: "gradient",
          decorativeColor: "text-amber-300",
          glowColor: "shadow-amber-500/30",
          particleColors: ["bg-amber-400/40", "bg-orange-400/30", "bg-red-400/35"],
        }
      default:
        return {
          overlay: "bg-linear-to-br from-slate-900/95 via-purple-900/90 to-rose-900/95",
          accent: "from-rose-400 via-pink-400 to-purple-400",
          buttonStyle: "gradient",
          decorativeColor: "text-rose-300",
          glowColor: "shadow-rose-500/30",
          particleColors: ["bg-rose-400/40", "bg-pink-400/30", "bg-purple-400/35"],
        }
    }
  }, [variant])

  return (
    <section
      ref={sectionRef}
      id="banner-heading"
      className={cn(
        // Sleek responsive height: compact on mobile, capped at 320px-360px on desktop/ultrawide
        "relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px] xl:h-[360px] max-h-[380px] overflow-hidden my-6 sm:my-8 group",
        "transition-all duration-700 ease-out",
        hasLoaded && isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      aria-labelledby="banner-heading"
    >
      {/* Background Images (no parallax) */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 min-h-full block md:hidden">
          <Image
            src={images.mobile || "/placeholder.svg"}
            alt={heading}
            fill
            sizes="100vw"
            className="object-cover"
            priority={priority}
            quality={85}
            onLoadingComplete={markLoaded}
          />
        </div>

        <div className="absolute inset-0 min-h-full hidden md:block lg:hidden">
          <Image
            src={images.tablet || images.desktop}
            alt={heading}
            fill
            sizes="100vw"
            className="object-cover"
            priority={priority}
            quality={90}
            onLoadingComplete={markLoaded}
          />
        </div>

        <div className="absolute inset-0 min-h-full hidden lg:block">
          <Image
            src={images.desktop}
            alt={heading}
            fill
            sizes="100vw"
            className="object-cover"
            priority={priority}
            quality={95}
            onLoadingComplete={markLoaded}
          />
        </div>
      </div>

      {/* Overlay (single layer; removed duplicate) */}
      <div className={cn("absolute inset-0", styles.overlay)} />

      {/* Floating particles (CSS only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {styles.particleColors.map((color, index) => (
          <div
            key={index}
            className={cn(
              "absolute w-2 h-2 rounded-full opacity-60",
              color,
              index === 0 && "animate-float top-1/4 left-1/4",
              index === 1 && "animate-float-delayed top-3/4 right-1/4",
              index === 2 && "animate-float-slow top-1/2 left-3/4"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5 relative">
          <h1
            id="banner-heading"
            className={cn(
              "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight",
              "transition-all duration-700 ease-out delay-100",
              hasLoaded && isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <span className={cn("bg-linear-to-r bg-clip-text text-transparent", styles.accent)}>
              {heading.split(" ")[0]}
            </span>{" "}
            {heading.split(" ").slice(1).join(" ")}
          </h1>

          {/* CTA */}
          <div
            className={cn(
              "flex flex-row gap-3 justify-center items-center pt-1",
              "transition-all duration-700 ease-out delay-150",
              hasLoaded && isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            <Button
              asChild
              variant={styles.buttonStyle as any}
              size="sm"
              className={cn(
                "bg-white group/button text-xs sm:text-sm h-8 sm:h-9 px-4 sm:px-5 rounded-full shadow-lg transition-transform duration-300 hover:scale-105",
                styles.glowColor
              )}
            >
              <Link href={link}>
                <span className="relative z-10">{buttonText}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform duration-300 group-hover/button:translate-x-1" />
              </Link>
            </Button>

            {showVideoButton && videoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="group/play text-white text-xs sm:text-sm h-8 sm:h-9 hover:bg-white/10 rounded-full"
                onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
              >
                <Play className="h-3.5 w-3.5 mr-1.5 transition-transform duration-300 group-hover/play:scale-110" />
                Watch Video
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Patterns (keep as-is) */}
      {overlayPattern === "geometric" && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-white/10 rotate-45 animate-spin-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border border-white/10 rotate-12 animate-pulse" />
          <div className="absolute top-3/4 left-3/4 w-16 h-16 border border-white/10 -rotate-45 animate-bounce" />
        </div>
      )}

      {overlayPattern === "radial" && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
          }}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 h-12 md:h-28 bg-linear-to-t from-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-12 md:h-28 bg-linear-to-b from-black/20 to-transparent pointer-events-none" />
    </section>
  )
}
