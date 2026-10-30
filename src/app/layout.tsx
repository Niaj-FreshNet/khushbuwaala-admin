import type React from "react"
import type { Viewport } from "next"
import { Inter, Noto_Serif_Bengali } from "next/font/google"
import "./globals.css"
import { siteConfig } from "@/config/site"
import { Providers } from "@/lib/Providers"

// English Font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

// Bangla Serif Font
const notoSerifBengali = Noto_Serif_Bengali({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-noto-serif-bengali",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSerifBengali.variable}`}
    >
      <body
        className={`min-h-screen text-foreground bg-background font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
