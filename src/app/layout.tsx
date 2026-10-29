import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Noto_Serif_Bengali } from "next/font/google"
import Script from "next/script"
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

const GTM_ID = "GTM-KDFMX5QL"

// SEO: Structured Data for Khushbuwaala Navigation (moved from navbar)
const navigationStructuredData = {
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: "Khushbuwaala Main Navigation",
  url: "https://khushbuwaala.com",
  hasPart: [
    {
      "@type": "WebPage",
      name: "Home",
      url: "https://khushbuwaala.com/",
      description: "Khushbuwaala homepage with featured perfumes and collections",
    },
    {
      "@type": "WebPage",
      name: "New Arrivals",
      url: "https://khushbuwaala.com/new-arrivals",
      description: "Latest perfume arrivals and new fragrance collections",
    },
    {
      "@type": "WebPage",
      name: "All Collection",
      url: "https://khushbuwaala.com/shop",
      description: "Complete collection of perfumes, attars, and fragrances",
    },
    {
      "@type": "WebPage",
      name: "For Women",
      url: "https://khushbuwaala.com/womens-perfume",
      description: "Exclusive perfume collection designed for women",
    },
    {
      "@type": "WebPage",
      name: "Gifts and Packages",
      url: "https://khushbuwaala.com/gifts-and-packages",
      description: "Perfect gift sets and perfume packages for special occasions",
    },
  ],
}

// SEO: Enhanced Structured Data for Organization (moved from footer)
const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Khushbuwaala",
  url: "https://khushbuwaala.com",
  logo: "https://khushbuwaala.com/images/khushbuwaala-logo.webp",
  description:
    "Premium perfumes, oriental attars, and natural fragrances with authentic quality",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+8801777152588",
    contactType: "customer service",
    email: "khushbuwaala@gmail.com",
    availableLanguage: ["English", "Bengali"],
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
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
    "https://instagram.com/khushbuwaala",
    "https://twitter.com/khushbuwaala",
    "https://youtube.com/@khushbuwaala",
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://khushbuwaala.com"),
  title: {
    default: `${siteConfig.name} - Premium Perfumes & Attars | Authentic Fragrances`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  robots: "index, follow",
  // icons: {
  //   icon: [
  //     { url: "/favicon.png" },
  //     { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  //     { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  //   ],
  //   apple: [
  //     { url: "/favicon-180x180.png", sizes: "180x180" },
  //   ],
  // },
  // manifest: "/site.webmanifest",
  openGraph: {
    title: `${siteConfig.name} - Premium Perfumes & Attars`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Premium Perfumes`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - Premium Perfumes & Attars`,
    description: siteConfig.description,
    images: [siteConfig.twitterImage],
    creator: "@yourtwitterhandle",
  },
  verification: siteConfig.verification,
}

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
      suppressHydrationWarning
      className={`${inter.variable} ${notoSerifBengali.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>

      <body
        className={`min-h-screen text-foreground bg-background font-sans antialiased`}      >
        {/* Google Tag Manager (noscript) - immediately after opening <body> */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* SEO: Structured Data for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteConfig.name,
              url: siteConfig.url,
              description: siteConfig.description,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteConfig.url}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/* SEO: Structured Data for Navigation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(navigationStructuredData),
          }}
        />

        {/* SEO: Enhanced Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />

        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
