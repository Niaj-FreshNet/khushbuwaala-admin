"use client";

import dynamic from "next/dynamic";
import { ShopProductsSkeletonGrid } from "./ShopProductsSkeletonGrid";
import { ShopControlsSkeleton } from "./ShopControlsSkeleton";

const ShopProductsDynamic = dynamic(
  () => import("./ShopProducts").then((m) => m.ShopProducts),
  {
    ssr: true,
    loading: () => (
      <section className="container mx-auto py-0 px-3 sm:px-4 relative space-y-4 sm:space-y-6">
        <ShopControlsSkeleton />
        <ShopProductsSkeletonGrid />
      </section>
    ),
  }
);

export function ClientShopProducts(props: any) {
  return <ShopProductsDynamic {...props} />;
}