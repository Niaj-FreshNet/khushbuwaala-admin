// SEO: Core site configuration for metadata
export const siteConfig = {
  name: "Khushbuwaala",
  url: "https://khushbuwaala.com",
  description:
    "Discover Khushbuwaala's exquisite collection of premium perfumes, oriental attars, and natural fragrances. Authentic quality with fast delivery across Bangladesh.",
  keywords: "perfume, attar, fragrance, Khushbuwaala, oriental perfume, natural attar, Bangladesh perfume",
  authors: [{ name: "Khushbuwaala" }],
  creator: "Khushbuwaala",
  publisher: "Khushbuwaala",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  ogImage: "/images/og-image.jpg", // Default Open Graph image
  twitterImage: "/images/twitter-image.jpg", // Default Twitter image
  verification: {
    google: "your-google-verification-code", // Replace with your actual Google verification code
  },
}
