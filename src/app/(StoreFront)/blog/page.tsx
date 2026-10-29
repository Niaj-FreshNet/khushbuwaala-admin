import { Metadata } from "next";
import BlogListClient from "./_components/BlogListClient";

export const metadata: Metadata = {
  title: "Perfume Insights & Fragrance Journal | Khushbuwaala",
  description: "Explore in-depth articles on natural attars, oud distillation, and fragrance notes.",
};

export const dynamic = "force-dynamic";

async function getBlogsData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blog/get-all-blogs?page=1&limit=9`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null; // Access json.data from standard sendResponse
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return null;
  }
}

export default async function BlogPage() {
  const initialData = await getBlogsData();

  return (
    <main className="min-h-screen bg-neutral-50/60 pb-16">
      {/* Blog List View */}
      <BlogListClient initialData={initialData} />
    </main>
  );
}