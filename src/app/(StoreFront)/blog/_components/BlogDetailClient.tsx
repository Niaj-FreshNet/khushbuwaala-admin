"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MessageCircle, Send, Link2 } from "lucide-react";
import { toast } from "sonner";

interface BlogData {
    blog: {
        id: string;
        title: string;
        slug: string;
        content: string;
        imageUrl: string;
        createdAt: string;
        keywords?: string;
        metaDescription?: string;
        user?: {
            name: string;
            imageUrl?: string;
        };
    };
    relatedBlogs: Array<{
        id: string;
        title: string;
        slug: string;
        content: string;
        imageUrl: string;
        createdAt: string;
    }>;
}

interface TocItem {
    id: string;
    text: string;
    level: number;
}

function calculateReadingTime(text: string): string {
    const plainText = text?.replace(/<[^>]*>?/gm, "") || "";
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
}

export default function BlogDetailClient({ initialData }: { slug: string; initialData: BlogData }) {
    const { blog } = initialData;

    // 1. Parse HTML to extract Table of Contents headings and inject unique IDs
    const { parsedHtml, toc } = useMemo(() => {
        if (typeof window === "undefined" || !blog.content) {
            return { parsedHtml: blog.content, toc: [] };
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(blog.content, "text/html");
        const headings = doc.querySelectorAll("h2, h3");
        const tocList: TocItem[] = [];

        headings.forEach((heading, index) => {
            const text = heading.textContent || "";
            const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
            heading.setAttribute("id", id);
            tocList.push({
                id,
                text,
                level: heading.tagName.toLowerCase() === "h2" ? 2 : 3,
            });
        });

        return {
            parsedHtml: doc.body.innerHTML,
            toc: tocList,
        };
    }, [blog.content]);

    const primaryCategory = blog.keywords?.split(",")[0]?.trim() || "Attar Guides";
    const authorName = blog.user?.name || "Khushbuwaala";
    const formattedDate = new Date(blog.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
    const readTime = calculateReadingTime(blog.content);

    // Social Share Handlers
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    const handleWhatsAppShare = () => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(blog.title + " " + window.location.href)}`, "_blank");
    };

    const handleMessengerShare = () => {
        window.open(`fb-messenger://share/?link=${encodeURIComponent(window.location.href)}`, "_blank");
    };

    return (
        <div className="bg-white text-[#1A1A1A] min-h-screen">
            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Breadcrumb Navigation */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400 mb-6 font-normal">
                    <Link href="/" className="hover:text-neutral-700 transition-colors">Home</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/blog" className="hover:text-neutral-700 transition-colors">Blog</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-neutral-900 font-medium truncate max-w-[260px] sm:max-w-md">{blog.title}</span>
                </nav>

                {/* Main Two-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16 items-start">
                    {/* Left Column: Article Body */}
                    <main className="w-full min-w-0">
                        {/* Category Subheading */}
                        <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                            {primaryCategory}
                        </span>

                        {/* Article Headline */}
                        <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-bold text-neutral-900 mt-2 mb-4 leading-tight tracking-tight">
                            {blog.title}
                        </h1>

                        {/* Sub-headline / Meta summary */}
                        {blog.metaDescription && (
                            <p className="text-neutral-500 text-sm sm:text-base leading-relaxed mb-6 font-normal">
                                {blog.metaDescription}
                            </p>
                        )}

                        {/* Author Meta Line */}
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-8 pb-6 border-b border-neutral-100">
                            <span className="font-semibold text-neutral-900">{authorName}</span>
                            <span>•</span>
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{readTime}</span>
                        </div>

                        {/* Primary Cover Image */}
                        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-neutral-100 mb-10 shadow-xs">
                            <Image
                                src={blog.imageUrl || "/images/placeholder.webp"}
                                alt={blog.title}
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 840px"
                                className="object-cover"
                            />
                        </div>

                        {/* Rendered Prose Content */}
                        <div
                            className="prose prose-neutral max-w-none 
                prose-headings:text-neutral-900 prose-headings:font-bold prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-neutral-700 prose-p:text-[15px] prose-p:leading-[1.8] prose-p:font-normal
                prose-li:text-neutral-700 prose-li:text-[15px]
                prose-img:rounded-2xl prose-img:w-full prose-img:my-8"
                            dangerouslySetInnerHTML={{ __html: parsedHtml }}
                        />
                    </main>

                    {/* Right Column: Sticky Sidebar */}
                    <aside className="hidden lg:block sticky top-24 space-y-10">
                        {/* Table of Contents */}
                        {toc.length > 0 && (
                            <div className="border-t-2 border-neutral-900 pt-4">
                                <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 mb-4">
                                    Contents
                                </h3>
                                <nav className="space-y-2.5 max-h-[420px] overflow-y-auto pr-2">
                                    {toc.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={`block text-[13px] leading-snug transition-colors ${item.level === 3 ? "pl-3 text-neutral-400" : "text-neutral-600 font-medium"
                                                } hover:text-emerald-800`}
                                        >
                                            {item.text}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        )}

                        {/* Share This Article */}
                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-900 mb-3">
                                Share this article
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleWhatsAppShare}
                                    aria-label="Share on WhatsApp"
                                    className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleMessengerShare}
                                    aria-label="Share on Messenger"
                                    className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    aria-label="Copy article link"
                                    className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                                >
                                    <Link2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Newsletter Subscription Box */}
                        <div className="border-t border-neutral-200 pt-6">
                            <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                                Do not miss new articles
                            </h3>
                            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                                Attar guides, notes, and exclusive stories straight to your inbox.
                            </p>
                            <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed!"); }} className="space-y-2">
                                <input
                                    type="email"
                                    required
                                    placeholder="Your email"
                                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-neutral-900 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="w-full text-xs font-semibold py-2.5 px-4 rounded-lg bg-[#A46338] hover:bg-[#8D532D] text-white transition-colors"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}