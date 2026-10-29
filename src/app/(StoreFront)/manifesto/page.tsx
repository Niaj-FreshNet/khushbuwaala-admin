import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Award, Handshake, Sparkles, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Values | Khushbuwaala",
  description:
    "Discover what Khushbuwaala stands for—authenticity, quality, honesty, personal fragrance stories, and customer-first service.",
  openGraph: {
    title: "Our Values | Khushbuwaala",
    description: "Fragrance is identity—crafted with authenticity, quality, and trust.",
    url: "https://www.khushbuwaala.com/manifesto",
  },
};

export default function ManifestoPage() {
  const values = [
    {
      icon: <Fingerprint className="h-8 w-8 text-amber-600" />,
      title: "Authenticity Above All",
      description:
        "We believe in real scents with real soul. Every attar and perfume we offer is carefully selected for its originality, purity, and true character — no shortcuts, no compromises.",
    },
    {
      icon: <Award className="h-8 w-8 text-amber-600" />,
      title: "Quality You Can Feel",
      description:
        "From the first note to the final dry-down, quality defines us. Our fragrances are crafted and sourced to last longer, smell richer, and leave a lasting impression — because you deserve nothing less.",
    },
    {
      icon: <Handshake className="h-8 w-8 text-amber-600" />,
      title: "Honesty Builds Trust",
      description:
        "We believe trust is earned, not claimed. Transparent pricing, clear information, and genuine recommendations are at the heart of how we serve our customers.",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-amber-600" />,
      title: "Fragrance for Every Story",
      description:
        "No two people are the same — and neither should their scent be. Whether bold, soft, mysterious, or elegant, we help you find a fragrance that truly represents you.",
    },
    {
      icon: <HeartHandshake className="h-8 w-8 text-amber-600" />,
      title: "Customer First, Always",
      description:
        "Your satisfaction matters more than a sale. Every bottle we deliver carries our promise of care, respect, and responsibility — from our store to your hands.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            At <strong>Khushbuwaala</strong>, fragrance is more than a product — it is an identity, a
            memory, and a quiet statement of who you are.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((value, index) => (
            <Card
              key={index}
              className="border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100">
                  {value.icon}
                </div>
                <CardTitle className="text-xl">{value.title}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-gray-700 text-center leading-relaxed">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            <strong>Khushbuwaala</strong> — Authentic scents. Honest service. Trusted experience.
          </p>
        </div>
      </div>
    </div>
  );
}
