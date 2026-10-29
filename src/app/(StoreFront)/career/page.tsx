import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers | Khushbuwaala Perfumes - Join Our Team in Dhaka",
  description: "Explore job openings at Khushbuwaala Perfumes. We're hiring passionate talent for sales, marketing, and more in our Dhaka showroom. Apply today!",
  openGraph: {
    title: "Careers at Khushbuwaala - Perfume Jobs in Dhaka",
    description: "Be part of our scent revolution. Open positions now.",
    url: "https://www.khushbuwaala.com/career",
  },
};

export default function CareerPage() {
  const openings = [
    {
      title: "Sales Associate",
      location: "Dhaka Showroom",
      type: "Full-Time",
      description: "Assist customers in discovering perfect fragrances. Experience in retail preferred.",
    },
    {
      title: "Marketing Executive",
      location: "Dhaka (Hybrid)",
      type: "Full-Time",
      description: "Drive campaigns for new perfume launches. Creative minds wanted!",
    },
    // Add more
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Hiring Now</Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Careers</h1>
          <p className="text-xl text-gray-600">Join our fragrance family and scent the future.</p>
        </div>

        <div className="space-y-6">
          {openings.map((opening, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    {opening.title}
                  </CardTitle>
                  <Badge>{opening.type}</Badge>
                </div>
                <CardDescription>{opening.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{opening.description}</p>
                <Button variant="outline" asChild>
                  <a href="mailto:khushbuwaala@gmail.com?subject=Job Application: {opening.title}">Apply Now</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">No openings match? Send your resume to khushbuwaala@gmail.com</p>
          <div className="flex justify-center gap-4 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            <span>We're a growing team of 20+ passionate perfumists.</span>
          </div>
        </div>
      </div>
    </div>
  );
}