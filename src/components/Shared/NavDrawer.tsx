"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

import {
  Home,
  Package,
  Gift,
  Heart,
  ChevronRight,
  Sparkles,
  Star,
  X,
  Droplets,
  Globe,
  Flame,
  Leaf,
  Search,
  User,
  LogIn,
  Info,
  PhoneCall,
  SendHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/redux/store/hooks/useAuth"

interface NavDrawerProps {
  open: boolean
  onClose: () => void
}

interface MenuItem {
  key: string
  label: string
  href?: string
  icon?: React.ReactNode
  children?: MenuItem[]
  badge?: string
  description?: string
}

export default function NavDrawer({ open, onClose }: NavDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [trackQuery, setTrackQuery] = useState("")

  const categoryIconMap: Record<string, React.ReactNode> = {
    "natural-attar": <Leaf className="h-4 w-4" />,
    "artificial-oud": <Flame className="h-4 w-4" />,
    "inspired-perfume-oil": <Sparkles className="h-4 w-4" />,
    "oriental-attar": <Globe className="h-4 w-4" />,
    "brand-perfumes": <Gift className="h-4 w-4" />,
    "niche-perfumes": <Package className="h-4 w-4" />,
    "accessories": <Droplets className="h-4 w-4" />,
  }

  const isActive = (href?: string) =>
    !!href && (pathname === href || pathname.startsWith(href + "/"))

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const toggleSubmenu = (key: string) => {
    setOpenSubmenu(openSubmenu === key ? null : key)
  }

  // Handle Track Order submit
  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = trackQuery.trim()
    if (trimmed) {
      router.push(`/track-order?query=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/track-order") // ✅ takes user to track page without query
    }
    setTrackQuery("")
    onClose()
  }

  // Handle Facebook Messenger click
  const handleMessengerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const messengerAppUrl = "fb-messenger://user-thread/111483794112905"
    const messengerWebUrl = "https://m.me/111483794112905"

    if (isMobileDevice) {
      window.location.href = messengerAppUrl
      setTimeout(() => {
        window.open(messengerWebUrl, "_blank", "noopener noreferrer")
      }, 450)
    } else {
      window.open(messengerWebUrl, "_blank", "noopener noreferrer")
    }
  }

  const menuItems: MenuItem[] = [
    {
      key: "home",
      label: "Home",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      description: "Discover premium fragrances",
    },
    {
      key: "categories",
      label: "Categories",
      icon: <Star className="h-5 w-5" />,
      children: [
        {
          key: "organic-attar",
          label: "Organic Attar",
          href: "/organic-attar",
          description: "Pure natural fragrances",
        },
        {
          key: "artificial-oud",
          label: "Artificial Oud",
          href: "/artificial-oud",
          description: "Premium oud alternatives",
        },
        {
          key: "oriental-attar",
          label: "Oriental & Arabian Attar",
          href: "/oriental-attar",
          description: "Traditional Middle Eastern Attar",
        },
        {
          key: "inspired-perfume-oil",
          label: "Inspired Perfume Oils",
          href: "/inspired-perfume-oil",
          description: "Designer-inspired fragrances",
        },
        {
          key: "brand-perfumes",
          label: "Brand Perfumes",
          href: "/brand-perfumes",
          description: "Popular Brand Perfumes",
        },
        {
          key: "niche-perfumes",
          label: "Niche Perfumes",
          href: "/niche-perfumes",
          description: "Our In-house Creations",
        },
        {
          key: "accessories",
          label: "Accessories",
          href: "/accessories",
          description: "Perfume-related accessories and gifts",
        },
      ],
    },
    {
      key: "new-arrivals",
      label: "New Arrivals",
      href: "/new-arrivals",
      icon: <Sparkles className="h-5 w-5" />,
      badge: "New",
      description: "Latest perfume collections",
    },
    {
      key: "womens-perfume",
      label: "For Women",
      href: "/womens-perfume",
      icon: <Heart className="h-5 w-5" />,
      description: "Feminine fragrances",
    },
    {
      key: "gifts-packages",
      label: "Gifts & Packages",
      href: "/gifts-and-packages",
      icon: <Gift className="h-5 w-5" />,
      badge: "Popular",
      description: "Perfect gift sets",
    },
    {
      key: "shop",
      label: "All Collections",
      href: "/shop",
      icon: <Package className="h-5 w-5" />,
      description: "Browse complete catalog",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-80 p-0 flex flex-col h-full bg-linear-to-b from-white via-white to-gray-50 [&>button]:hidden"
      >
        {/* Custom Close Button */}
        <SheetClose asChild>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full 
              bg-linear-to-r from-red-100 to-pink-100 text-red-600 
              hover:from-red-200 hover:to-pink-200 hover:text-red-700
              shadow-xs transition-all duration-300 focus:outline-none z-10"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetClose>

        {/* Brand Header */}
        <div className="pt-3 pb-3 px-5 border-b bg-linear-to-r from-red-50 to-pink-50">
          <Link href="/" onClick={onClose} className="flex items-center group">
            <div className="relative">
              <Image
                src="/images/khushbuwaala.webp"
                alt="Khushbuwaala"
                className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
                width={130}
                height={36}
                priority
              />
            </div>
          </Link>
        </div>

        {/* 1. Track Order Search Bar (Sticky at Top of Drawer) */}
        <div className="px-2 pt-0 pb-2 -mt-2 border-b bg-white">
          <form onSubmit={handleTrackSubmit} className="relative flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Order ID / Phone no..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 focus:bg-white transition-all"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8! min-h-0! py-0 px-2.5 text-xs font-semibold bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md shadow-xs shrink-0"
            >
              Track Order
            </Button>
          </form>
        </div>

        {/* 2. Main Navigation Menus */}
        <ScrollArea className="flex-1 px-3 py-1 bg-white">
          <nav aria-label="Mobile navigation menu">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.key}>
                  {item.children ? (
                    <Collapsible
                      open={openSubmenu === item.key}
                      onOpenChange={() => toggleSubmenu(item.key)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between h-12 px-3 text-left font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-xl group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-emerald-100 transition-colors duration-200 text-emerald-700 group-hover:text-emerald-800">
                              {item.icon}
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-semibold">{item.label}</span>
                              {item.description && (
                                <span className="text-[11px] text-gray-500 group-hover:text-emerald-600">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            {item.badge && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-800">
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronRight
                              className={cn(
                                "h-4 w-4 text-gray-400 transition-transform duration-200",
                                openSubmenu === item.key && "rotate-90 text-emerald-700"
                              )}
                            />
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 pl-3 space-y-1">
                        {item.children.map((child) => {
                          const active = isActive(child.href)
                          const icon = categoryIconMap[child.key] ?? <Droplets className="h-4 w-4" />

                          return (
                            <Button
                              key={child.key}
                              variant="ghost"
                              className={cn(
                                "w-full justify-start h-11 px-3 text-xs rounded-xl transition-all duration-200 group",
                                "hover:bg-linear-to-r hover:from-emerald-50 hover:to-teal-50",
                                active ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-gray-700"
                              )}
                              onClick={() => handleNavigation(child.href!)}
                            >
                              <div className="flex items-center gap-2.5 w-full">
                                <div className="flex flex-col items-start leading-tight">
                                  <span className={cn("font-semibold text-xs", active ? "text-emerald-800" : "text-gray-800")}>
                                    {child.label}
                                  </span>
                                  {child.description && (
                                    <span className={cn("text-[10px]", active ? "text-emerald-700" : "text-gray-500 group-hover:text-emerald-700")}>
                                      {child.description}
                                    </span>
                                  )}
                                </div>
                                <ChevronRight
                                  className={cn(
                                    "ml-auto h-3.5 w-3.5 transition-all duration-200",
                                    active
                                      ? "text-emerald-700 translate-x-0.5"
                                      : "text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5"
                                  )}
                                />
                              </div>
                            </Button>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-12 px-3 font-medium transition-all duration-200 rounded-xl group",
                        "hover:bg-linear-to-r hover:from-emerald-50 hover:to-teal-50 hover:text-emerald-700",
                        isActive(item.href) ? "bg-emerald-50 text-emerald-800 font-semibold" : "text-gray-800"
                      )}
                      onClick={() => handleNavigation(item.href!)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "p-1.5 rounded-lg transition-colors duration-200",
                          isActive(item.href)
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-100 group-hover:bg-emerald-100 text-gray-700 group-hover:text-emerald-700"
                        )}>
                          {item.icon}
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-800">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <span className="text-[11px] text-gray-500 group-hover:text-gray-600">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </ScrollArea>

        {/* 3. Bottom Section: Account, About, Contact & Messenger */}
        <div className="p-3 border-t bg-gray-50/90 space-y-1">
          {/* Account / Login Toggle */}
          {user ? (
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-2.5 text-sm font-medium hover:bg-white text-gray-700 hover:text-red-600 rounded-xl"
              onClick={() => handleNavigation("/my-account")}
            >
              <div className="p-1.5 rounded-lg bg-white border border-gray-200 mr-2.5 text-red-600">
                <User className="h-4 w-4" />
              </div>
              <span className="font-semibold text-xs">My Account</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-2.5 text-sm font-medium hover:bg-white text-gray-700 hover:text-red-600 rounded-xl"
              onClick={() => handleNavigation("/login")}
            >
              <div className="p-1.5 rounded-lg bg-white border border-gray-200 mr-2.5 text-blue-600">
                <LogIn className="h-4 w-4" />
              </div>
              <span className="font-semibold text-xs">Log In / Register</span>
            </Button>
          )}

          {/* About Us */}
          <Button
            variant="ghost"
            className="w-full justify-start h-10 px-2.5 text-sm font-medium hover:bg-white text-gray-700 hover:text-red-600 rounded-xl"
            onClick={() => handleNavigation("/about")}
          >
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 mr-2.5 text-gray-600">
              <Info className="h-4 w-4" />
            </div>
            <span className="font-semibold text-xs">About Us</span>
          </Button>

          {/* Contact Us + Messenger Button Row */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              className="flex-1 justify-start h-10 px-2.5 text-sm font-medium hover:bg-white text-gray-700 hover:text-red-600 rounded-xl"
              onClick={() => handleNavigation("/contact")}
            >
              <div className="p-1.5 rounded-lg bg-white border border-gray-200 mr-2.5 text-gray-600">
                <PhoneCall className="h-4 w-4" />
              </div>
              <span className="font-semibold text-xs">Contact Us</span>
            </Button>

            {/* Messenger Icon Button */}
            <button
              onClick={handleMessengerClick}
              title="Chat on Messenger"
              className="h-10 w-10 shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl border border-blue-200 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-xs"
            >
              {/* Messenger Lightning / SVG */}
              <svg
                className="w-5 h-5 fill-current text-blue-600"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.518 3.735 7.197V22l3.411-1.872c.905.251 1.865.388 2.854.388 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.055 12.445l-2.673-2.852-5.213 2.852 5.734-6.091 2.742 2.852 5.144-2.852-5.734 6.091z" />
              </svg>
            </button>
          </div>

          <div className="pt-2 text-center text-[10px] text-gray-400">
            © {new Date().getFullYear()} Khushbuwaala. All rights reserved.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}