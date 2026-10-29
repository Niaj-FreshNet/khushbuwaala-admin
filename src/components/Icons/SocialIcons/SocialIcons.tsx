"use client"

import Link from "next/link"
import { Facebook, Instagram, Youtube, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const SocialIcons = () => {
  const socialLinks = [
    {
      name: "Facebook",
      href: "https://facebook.com/khushbuwaala",
      icon: <Facebook className="h-5 w-5" />,
      color: "hover:bg-blue-600 hover:text-white",
      followers: "10K+",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/khushbuwaala_perfumes",
      icon: <Instagram className="h-5 w-5" />,
      color: "hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white",
      followers: "15K+",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@khushbuwaala_perfumes",
      icon: <Youtube className="h-5 w-5" />,
      color: "hover:bg-red-600 hover:text-white",
      followers: "8K+",
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/8801777152588",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "hover:bg-green-600 hover:text-white",
      followers: "Chat",
    },
  ]

  return (
    <div className="flex gap-2" role="list" aria-label="Social media links">
      {socialLinks.map((social) => (
        <div key={social.name} className="group relative" role="listitem">
          <Button
            variant="outline"
            size="icon"
            asChild
            className={`transition-all duration-300 transform hover:scale-110 hover:shadow-lg border-gray-200 ${social.color}`}
          >
            <Link
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow us on ${social.name} (${social.followers} followers)`}
              title={`Visit our ${social.name} page`}
            >
              {social.icon}
            </Link>
          </Button>

          {/* Tooltip */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            {social.name} • {social.followers}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SocialIcons
