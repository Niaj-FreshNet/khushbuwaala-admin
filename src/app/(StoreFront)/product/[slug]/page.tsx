import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/Functions/ServerFn";
import ProductDetailPage from "./_components/ProductDetailPage";
import { metadata } from "@/app/layout";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; // ✅ unwrap
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found - Khushbuwaala",
      description: "The product you're looking for could not be found.",
    };
  }

  const firstImage = product.primaryImage || "/default-product-image.jpg";

  return {
    title: `${product.name} - Premium Perfume | Khushbuwaala`,
    description:
      product.description?.substring(0, 160) ||
      `Buy ${product.name} premium perfume online. Authentic fragrances with fast delivery across Bangladesh.`,
    alternates: { canonical: new URL(`/product/${slug}`, metadata.metadataBase ?? "https://khushbuwaala.com") },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description || `Buy ${product.name} online at Khushbuwaala`,
      images: [{ url: firstImage, width: 1200, height: 630, alt: product.name }],
      siteName: "Khushbuwaala",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `Buy ${product.name} online`,
      images: [firstImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params; // ✅ unwrap
  const product = await getProductBySlug(slug);

  if (!product) return notFound();

  return <ProductDetailPage product={product} />;
}

export const revalidate = 3600;
