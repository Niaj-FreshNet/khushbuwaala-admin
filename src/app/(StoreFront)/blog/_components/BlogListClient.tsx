"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  keywords?: string;
  metaTitle?: string;
  user?: {
    name: string;
  };
}

interface BlogListClientProps {
  initialData: {
    data: BlogItem[];
    meta?: {
      page: number;
      limit: number;
      total: number;
      totalPage: number;
    };
  } | null;
}

function calculateReadingTime(text: string): string {
  const plainText = text?.replace(/<[^>]*>?/gm, "") || "";
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

export default function BlogListClient({ initialData }: BlogListClientProps) {
  const blogs = initialData?.data || [];

  return (
    <div className="bg-white min-h-screen text-[#1A1A1A]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400 mb-6 font-normal">
          <Link href="/" className="hover:text-neutral-700 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-neutral-900 font-medium">Blog</span>
        </nav>

        {/* Editorial Section Header */}
        <header className="mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-3">
            The Khushbuwaala Blog
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl font-normal leading-relaxed">
            Guides, tips, and stories to help you choose, wear, and appreciate pure attar, oud, and fine perfumery.
          </p>
        </header>

        {/* Blog Post Grid */}
        {blogs.length === 0 ? (
          <div className="py-24 text-center">
            <h3 className="text-lg font-medium text-neutral-700">No articles available</h3>
            <p className="text-sm text-neutral-400 mt-1">Check back shortly for new fragrant stories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {blogs.map((blog) => {
              const summary = blog.content?.replace(/<[^>]*>?/gm, "").trim() || "";
              const primaryTag = blog.keywords?.split(",")[0]?.trim() || "Perfume Guide";
              const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const readTime = calculateReadingTime(blog.content);

              return (
                <article key={blog.id} className="group flex flex-col cursor-pointer">
                  {/* Image with Tag Pill */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-neutral-100 mb-4">
                    <Link href={`/blog/${blog.slug}`} className="block h-full w-full">
                      <Image
                        src={blog.imageUrl || "/images/placeholder.webp"}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    </Link>
                    {/* Category Pill Tag */}
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="inline-block bg-white/85 backdrop-blur-md text-neutral-800 text-[11px] font-medium px-3 py-1 rounded-full shadow-xs">
                        {primaryTag}
                      </span>
                    </div>
                  </div>

                  {/* Content Meta */}
                  <div className="flex flex-col flex-1">
                    <h2 className="text-base sm:text-[17px] font-semibold text-neutral-900 leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors">
                      <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                    </h2>

                    <p className="text-xs sm:text-[13px] text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                      {summary}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{readTime}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}