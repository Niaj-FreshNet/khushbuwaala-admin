import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogDetailClient from '../_components/BlogDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

async function fetchBlog(slug: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/blog/get-blog/${slug}`,
      { cache: 'no-store' }
    );

    if (!response.ok) return null;
    const json = await response.json();
    return json?.data || null; // Extracts { blog, relatedBlogs }
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchBlog(slug);
  const blog = data?.blog;

  if (!blog) {
    return {
      title: 'Blog Not Found | Khushbuwaala',
      description: 'The requested blog post could not be found.',
    };
  }

  const plainSummary = blog.metaDescription || blog.content?.replace(/<[^>]*>?/gm, '').slice(0, 160) || '';

  return {
    title: `${blog.metaTitle || blog.title} | Khushbuwaala`,
    description: plainSummary,
    keywords: blog.keywords ? blog.keywords.split(',').map((k: string) => k.trim()) : [],
    openGraph: {
      title: blog.metaTitle || blog.title,
      description: plainSummary,
      images: blog.imageUrl ? [{ url: blog.imageUrl }] : [],
      url: `/blog/${blog.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.metaTitle || blog.title,
      description: plainSummary,
      images: blog.imageUrl ? [blog.imageUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await fetchBlog(slug);

  if (!data?.blog) {
    notFound();
  }

  return <BlogDetailClient slug={slug} initialData={data} />;
}