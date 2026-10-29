"use client"

import type React from "react"
import Link from "next/link"
import { Home, Mail, Phone, Users, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import FooterCollapsible from "./FooterCollapsible"
import SocialIcons from "../Icons/SocialIcons/SocialIcons"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// SEO: Enhanced Structured Data for Footer (Server-side)
const footerStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Khushbuwaala",
  url: "https://khushbuwaala.com",
  logo: "https://khushbuwaala.com/images/khushbuwaala-logo.webp",
  description: "Premium perfumes, oriental attars, and natural fragrances with authentic quality",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+8801777152588",
    contactType: "customer service",
    email: "khushbuwaala@gmail.com",
    availableLanguage: ["English", "Bengali"],
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "21:00",
    },
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "BD",
    addressLocality: "Dhaka",
    addressRegion: "Dhaka Division",
  },
  sameAs: [
    "https://facebook.com/khushbuwaala",
    "https://www.instagram.com/khushbuwaala_perfumes",
    "https://www.youtube.com/@khushbuwaala_perfumes",
  ],
}

interface FooterSection {
  id: string
  title: string
  underlineWidth: string
  links: Array<{
    label: string
    href: string
    icon?: React.ReactNode
    external?: boolean
    badge?: string
    description?: string
  }>
}

export const Footer = () => {
  const pathname = usePathname()
  const isCheckoutPage = pathname?.startsWith("/checkout")

  const footerSections: FooterSection[] = [
    {
      id: "companyInfo",
      title: "Get in Touch",
      underlineWidth: "w-12",
      links: [
        {
          label: "Visit Our Office",
          href: "/contact",
          icon: <Home className="h-3.5 w-3.5" />,
          description: "Find our physical location",
        },
        {
          label: "khushbuwaala@gmail.com",
          href: "mailto:khushbuwaala@gmail.com",
          icon: <Mail className="h-3.5 w-3.5" />,
          external: true,
        },
        {
          label: "+8801777-152588",
          href: "tel:+8801777152588",
          icon: <Phone className="h-3.5 w-3.5" />,
          external: true,
        },
        {
          label: "Customer Support",
          href: "/contact#",
          icon: <Users className="h-3.5 w-3.5" />,
          badge: "24/7",
        },
        {
          label: "Store Locator",
          href: "/stores",
          icon: <MapPin className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: "quickLinks",
      title: "Company",
      underlineWidth: "w-10",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Blog & Fragrance Tips", href: "/blog" },
        { label: "News & Updates", href: "/news" },
        { label: "Our Story & Values", href: "/manifesto" },
        { label: "Careers", href: "/career", badge: "Hiring" },
      ],
    },
    {
      id: "policies",
      title: "Policies",
      underlineWidth: "w-10",
      links: [
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Return & Refund", href: "/refund-policy" },
        { label: "Shipping Info", href: "/shipping-policy" },
        { label: "Exchange Policy", href: "/exchange-policy" },
        { label: "Terms of Service", href: "/terms-conditions" },
      ],
    },
    {
      id: "account",
      title: "Your Account",
      underlineWidth: "w-12",
      links: [
        { label: "Track Your Order", href: "/track-order" },
        { label: "My Wishlist", href: "/wishlist" },
        { label: "Shopping Cart", href: "/cart" },
        { label: "Order History", href: "/orders" },
        { label: "Click & Collect", href: "/click-collect", badge: "New" },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(footerStructuredData) }}
      />

      <footer
        className={cn(
          "bg-white border-t border-gray-100 text-gray-700",
          isCheckoutPage && "hidden md:block"
        )}
        role="contentinfo"
      >
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4">

          {/* Top Brand Tagline Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-3 sm:pb-4 mb-3 sm:mb-4 border-b border-gray-100 gap-1.5 sm:gap-3 text-center sm:text-left">
            <Link href="/" className="inline-block shrink-0">
              <Image
                src="/images/khushbuwaala.webp"
                alt="Khushbuwaala - Premium Perfumes"
                className="h-7 sm:h-9 w-auto object-contain transition-transform duration-200 hover:scale-105"
                width={110}
                height={36}
              />
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md leading-relaxed">
              We Bring the Legacy of Great Attars and Exquisite Perfumes.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 md:gap-6 lg:gap-8 pb-3 sm:pb-4">
            {footerSections.map((section) => (
              <div key={section.id} className="space-y-0.5 md:space-y-2">
                {/* Mobile Collapsible */}
                <div className="md:hidden">
                  <FooterCollapsible section={section} />
                </div>

                {/* Desktop Menu */}
                <div className="hidden md:block">
                  <div className="mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      {section.title}
                    </h3>
                    <div
                      className={`h-0.5 ${section.underlineWidth} bg-linear-to-r from-red-600 to-pink-600 rounded-full mt-1.5`}
                    />
                  </div>

                  <nav aria-label={`${section.title} navigation`}>
                    <ul className="space-y-1">
                      {section.links.map((link) => (
                        <li key={link.href}>
                          {link.external ? (
                            <a
                              href={link.href}
                              className="inline-flex items-center gap-2 py-0.5 text-xs text-gray-600 hover:text-red-600 hover:translate-x-0.5 transition-all duration-150"
                              {...(link.href.startsWith("mailto:") || link.href.startsWith("tel:")
                                ? {}
                                : { target: "_blank", rel: "noopener noreferrer" })}
                            >
                              {link.icon && (
                                <span className="text-red-500 shrink-0">
                                  {link.icon}
                                </span>
                              )}
                              <span>{link.label}</span>
                              {link.badge && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-red-50 text-red-700 font-semibold border-none">
                                  {link.badge}
                                </Badge>
                              )}
                            </a>
                          ) : (
                            <Link
                              href={link.href}
                              className="inline-flex items-center gap-2 py-0.5 text-xs text-gray-600 hover:text-red-600 hover:translate-x-0.5 transition-all duration-150"
                            >
                              {link.icon && (
                                <span className="text-red-500 shrink-0">
                                  {link.icon}
                                </span>
                              )}
                              <span>{link.label}</span>
                              {link.badge && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-red-50 text-red-700 font-semibold border-none">
                                  {link.badge}
                                </Badge>
                              )}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </div>
            ))}
          </div>

          {/* Combined Socials & Payment Logos Row */}
          <div className="pt-3 sm:pt-3.5 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
            {/* Follow Us */}
            <div className="flex items-center justify-center md:justify-start gap-2.5 shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold text-gray-700">Follow:</span>
              <SocialIcons />
            </div>

            {/* Payment Logos with identical source */}
            <div className="flex justify-center md:justify-end items-center">
              <div className="w-full max-w-lg md:max-w-xl lg:max-w-3xl">
                <Image
                  src="/images/pay-with.jpeg"
                  alt="Supported Payment Gateways"
                  width={680}
                  height={45}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Copyright Bar */}
      <div
        className={cn(
          "bg-gray-950 text-gray-400 py-1 border-t border-gray-800",
          isCheckoutPage && "hidden md:block"
        )}
        role="contentinfo"
      >
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-384 3xl:max-w-[1800px] px-4 sm:px-6 lg:px-8 text-center text-[11px] sm:text-xs">
          © {new Date().getFullYear()} Khushbuwaala Perfumes. All rights reserved.
        </div>
      </div>
    </>
  )
}