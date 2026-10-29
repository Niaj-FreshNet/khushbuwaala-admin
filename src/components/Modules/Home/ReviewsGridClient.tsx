"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Facebook,
  Instagram,
  Youtube,
  Music2, // TikTok alternative icon (lucide doesn't have TikTok)
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"

type ReviewItem = {
  image: string
  facebook?: string
  instagram?: string
  youtube?: string
  tiktok?: string
}

export function ReviewsGridClient({ items }: { items: ReviewItem[] }) {
  const reduce = useReducedMotion()

  return (
    <div className="flex justify-center">
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            whileHover={reduce ? undefined : { y: -5 }}
            className="
              relative group overflow-hidden rounded-lg
              border border-gray-100 bg-white
              shadow-sm hover:shadow-xl
              transition-all duration-300
            "
          >
            {/* Image */}
            <Image
              src={item.image}
              alt="Customer review"
              width={420}
              height={420}
              sizes="(max-width: 640px) 100vw, 523px"
              priority={idx === 0}
              quality={70}
              className="w-full h-56 sm:h-60 md:h-64 object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Premium dark overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Social Dock */}
            <div
              className="
                absolute inset-x-0 bottom-0
                flex justify-between items-end
                p-3 md:p-4
                opacity-0 group-hover:opacity-100
                transition-opacity duration-300
              "
            >
              <span className="text-white text-xs font-semibold tracking-wide">
                Customer Love
              </span>

              <div className="flex gap-2">
                {item.facebook && (
                  <SocialIcon href={item.facebook} icon={<Facebook className="h-4 w-4 hover:shadow-lg hover:shadow-white/20" />} />
                )}
                {item.instagram && (
                  <SocialIcon href={item.instagram} icon={<Instagram className="h-4 w-4 hover:shadow-lg hover:shadow-white/20" />} />
                )}
                {item.youtube && (
                  <SocialIcon href={item.youtube} icon={<Youtube className="h-4 w-4 hover:shadow-lg hover:shadow-white/20" />} />
                )}
                {item.tiktok && (
                  <SocialIcon href={item.tiktok} icon={<Music2 className="h-4 w-4 hover:shadow-lg hover:shadow-white/20" />} />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Reusable Social Icon ---------- */

function SocialIcon({
  href,
  icon,
}: {
  href: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        h-9 w-9 md:h-10 md:w-10
        flex items-center justify-center
        rounded-full
        bg-white/10 backdrop-blur-md
        border border-white/20
        text-white
        hover:bg-white/20
        hover:scale-110
        transition-all duration-200
        shrink-0
      "
    >
      {icon}
    </Link>
  )
}
