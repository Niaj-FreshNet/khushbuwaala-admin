import { Metadata } from "next";
import Head from "next/head";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Store Locator | Khushbuwaala Perfumes - Find Nearest Perfume Store in Dhaka",
  description: "Discover Khushbuwaala Perfumes stores in Dhaka. Visit our flagship showroom at Eastern Banabithi Shopping Complex for authentic fragrances. Locations, hours, and directions.",
  openGraph: {
    title: "Store Locator - Khushbuwaala Perfumes Dhaka",
    description: "Find your nearest Khushbuwaala store for premium perfumes. Open daily 10 AM–10 PM.",
    url: "https://www.khushbuwaala.com/stores",
    type: "website",
  },
};

export default function StoresPage() {
  const stores = [
    {
      name: "Flagship Showroom",
      address: "Shop-G/138, Eastern Banabithi Shopping Complex, South Banasree, Khilgaon, Dhaka-1219",
      phone: "+8801777152588",
      hours: "10:00 AM – 10:00 PM (Daily)",
      mapLink: "https://maps.app.goo.gl/kEXvaRHQ46CbRh7f7", // Replace with real Google Maps link
    },
    // Add more stores if available
  ];

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "Khushbuwaala Perfumes",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Shop-G/138, Eastern Banabithi Shopping Complex, South Banasree",
            addressLocality: "Khilgaon, Dhaka",
            addressRegion: "Dhaka",
            postalCode: "1219",
            addressCountry: "BD",
          },
          telephone: "+8801777152588",
          openingHours: "Mo-Su 10:00-22:00",
        }) }} />
      </Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Find Us</Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Store Locator</h1>
            <p className="text-xl text-gray-600">Experience our collection in person at Khushbuwaala Perfumes stores across Dhaka.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {stores.map((store, index) => (
              <Card key={index} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-amber-600" />
                    {store.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-gray-700">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <p className="text-sm">{store.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <a href={`tel:${store.phone}`} className="text-sm font-medium text-amber-600 hover:underline">{store.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">{store.hours}</p>
                  </div>
                  <Button variant="outline" asChild className="w-full">
                    <a href={store.mapLink} target="_blank">Get Directions</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Coming soon: More locations in Chittagong and Sylhet.</p>
            <Button asChild>
              <a href="/contact">Contact for New Store Inquiries</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}