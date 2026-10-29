import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  CategoryName: string
  CategoryImage: string
  CategoryLink: string
  description: string
}

export function CategoryCard({
  CategoryName,
  CategoryImage,
  CategoryLink,
  description,
}: CategoryCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden",
        "rounded-none",
        "shadow-none sm:shadow-sm sm:hover:shadow-lg",
        "transition-all duration-300",
        "bg-black/2 border-0 sm:border border-transparent sm:border-gray-100"
      )}
    >
      <div className="relative w-full h-60 sm:h-56 md:h-60 lg:h-64">
        {/* Image */}
        <Image
          src={CategoryImage || "/placeholder.svg"}
          alt={CategoryName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={cn(
            "object-cover",
            "transition-transform duration-700 ease-out",
            "sm:group-hover:scale-[1.08]"
          )}
          priority={false}
        />

        {/* Full-card link */}
        <Link
          href={CategoryLink}
          className={cn(
            "absolute inset-0 z-10 outline-none",
            "focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2",
            "focus-visible:ring-offset-white"
          )}
          aria-label={`Explore ${CategoryName} category`}
          title={`Shop ${CategoryName}`}
        />

        {/* Darkening Overlay */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none",
            "bg-linear-to-t from-black/85 via-black/40 to-black/20",
            "opacity-80 sm:group-hover:opacity-95 sm:group-focus-within:opacity-95",
            "transition-opacity duration-500"
          )}
        />

        {/* Center-aligned Content Stack */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-5 lg:p-6 text-center pointer-events-none">

          {/* Title Pill: Centered by default, glides upward on hover */}
          <div
            className={cn(
              "transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              "translate-y-6 sm:translate-y-8",
              "group-hover:translate-y-0 group-focus-within:translate-y-0"
            )}
          >
            <h3
              className={cn(
                "text-white font-semibold tracking-wide leading-tight",
                "text-lg sm:text-base md:text-lg lg:text-xl",
                "px-4 py-1.5 rounded-lg",
                "bg-white/10 backdrop-blur-md border border-white/15",
                "shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
              )}
            >
              {CategoryName}
            </h3>
          </div>

          {/* Reveal Panel: Slides up into view below the elevated title */}
          <div
            className={cn(
              "flex flex-col items-center",
              "max-h-0 opacity-0 translate-y-4",
              "group-hover:max-h-48 group-hover:opacity-100 group-hover:translate-y-0",
              "group-focus-within:max-h-48 group-focus-within:opacity-100 group-focus-within:translate-y-0",
              "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            )}
          >
            <p className="mt-2 text-gray-100/90 text-xs sm:text-xs md:text-sm line-clamp-2 max-w-[90%]">
              {description}
            </p>

            {/* CTA Button */}
            <div className="mt-3 inline-flex items-center">
              <div
                className={cn(
                  "inline-flex items-center gap-2",
                  "px-4 h-8.5 rounded-full text-xs font-semibold",
                  "bg-white text-rose-600",
                  "shadow-md border border-white/60",
                  "transition-transform duration-300 hover:scale-105"
                )}
              >
                Shop Now
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Ambient Corner Accent */}
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 border border-white/10 blur-[0.5px] opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </article>
  )
}