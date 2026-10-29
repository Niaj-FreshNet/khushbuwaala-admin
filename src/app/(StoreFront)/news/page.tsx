import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "News & Updates | Khushbuwaala Perfumes - Latest Perfume Launches & Events in Dhaka",
  description: "Stay updated with Khushbuwaala Perfumes: New arrivals, promotions, and events. Discover the latest in fragrances from our Dhaka showroom.",
  openGraph: {
    title: "News - Khushbuwaala Perfumes Updates",
    description: "Fresh scents and stories from Dhaka's perfume experts.",
    url: "https://www.khushbuwaala.com/news",
  },
};

export default function NewsPage() {
  const newsItems = [
    {
      title: "New Arrivals: Winter Collection 2025",
      date: "2025-11-01",
      excerpt: "Introducing warm, spicy notes perfect for the season. Visit our Khilgaon store now.",
      views: 1500,
    },
    {
      title: "Black Friday Perfume Sale",
      date: "2025-10-28",
      excerpt: "Up to 30% off on signature scents. Limited time only!",
      views: 2500,
    },
    // Add more dynamically
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Stay Informed</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">News & Updates</h1>
          <p className="text-xl text-gray-600">The latest from Khushbuwaala Perfumes.</p>
        </div>

        <div className="space-y-6">
          {newsItems.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{item.date}</span>
                  </div>
                  <Badge variant="outline">{item.views} Views</Badge>
                </div>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href={`/news/${index}`}>Read More</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}