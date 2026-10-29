import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us | Khushbuwaala Perfumes - Authentic Fragrances from Dhaka",
  description: "Learn about Khushbuwaala Perfumes: Dhaka's premier destination for original perfumes since 2020. Our story, commitment to quality, and passion for scents.",
  openGraph: {
    title: "About Khushbuwaala Perfumes - Dhaka's Scent Story",
    description: "From passion to perfume: Discover our journey in bringing luxury fragrances to Bangladesh.",
    url: "https://www.khushbuwaala.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Our Story</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Khushbuwaala Perfumes</h1>
          <p className="text-xl text-gray-600">Bringing the world's finest scents to Dhaka since 2020.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-amber-600" />
              Our Passion
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              Founded in the heart of Dhaka, Khushbuwaala Perfumes was born from a simple love for fragrances that tell stories. We curate authentic, long-lasting perfumes from global brands, making luxury accessible to every Bangladeshi. From our flagship showroom in Khilgaon, we blend tradition with modernity—offering everything from classic attars to contemporary eau de parfums.
            </p>
            <p>
              Our mission: <strong>Empower confidence through scent.</strong> We source directly from trusted suppliers, ensuring 100% originality without compromise.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl">10K+</h3>
                <p className="text-gray-600">Happy Customers</p>
              </div>
              <div className="text-center">
                <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl">50+</h3>
                <p className="text-gray-600">Fragrance Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <a href="/stores">Visit Our Showroom</a>
          </Button>
        </div>
      </div>
    </div>
  );
}