// app/product/[productSlug]/layout.tsx
import React, { ReactNode } from "react";

export const metadata = {
  // Optional: static metadata fallback
  title: "Product Details | Khushbuwaala",
  description: "Explore our premium products at Khushbuwaala.",
};

export default function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="max-w-screen-2xl mx-auto px-0 sm:px-6 lg:px-8 pt-0 sm:pt-4">
      {children}
    </section>
  );
}
