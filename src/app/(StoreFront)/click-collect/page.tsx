import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, ShoppingBag, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Click & Collect | Khushbuwaala Perfumes",
  description: "Order online and pick up your favorite perfumes in-store. Fast, free, and convenient at Khushbuwaala Perfumes.",
  openGraph: {
    title: "Click & Collect – Order Online, Pick Up In-Store",
    description: "Skip shipping. Pick up your order same day or next day.",
    url: "https://www.khushbuwaala.com/click-collect",
  },
};

export default function ClickAndCollect() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            New Service
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Click & Collect
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Order online, pick up in-store. <strong>Free, fast, and fragrance-ready.</strong>
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
              How It Works
            </CardTitle>
            <CardDescription>
              Simple steps to get your perfume without waiting for delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  1
                </div>
                <h3 className="font-semibold text-lg mb-1">Shop Online</h3>
                <p className="text-sm text-gray-600">
                  Browse and add your favorite perfumes to cart.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  2
                </div>
                <h3 className="font-semibold text-lg mb-1">Choose Pickup</h3>
                <p className="text-sm text-gray-600">
                  Select “Click & Collect” at checkout.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                  3
                </div>
                <h3 className="font-semibold text-lg mb-1">Pick Up In-Store</h3>
                <p className="text-sm text-gray-600">
                  Get notified when your order is ready.
                </p>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Benefits of Click & Collect
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Free pickup</strong> – No shipping fee</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Ready in 2 hours</strong> (same-day orders before 6 PM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Try before you leave</strong> – Smell & verify in-store</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Secure & contactless</strong> pickup</span>
                </li>
              </ul>
            </div>

            {/* Store Info */}
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-700" />
                Pickup Location
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>
                  <strong>Khushbuwaala Perfumes – Flagship Store</strong><br />
                  House 12, Road 5, Block C, Banani, Dhaka 1213
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    <strong>Pickup Hours:</strong> 10:00 AM – 10:00 PM (Daily)
                  </span>
                </p>
                <p className="text-sm">
                  <strong>Phone:</strong>{" "}
                  <a href="tel:+8801777152588" className="text-amber-700 hover:underline">
                    +8801777152588
                  </a>
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-6">
              <p className="text-lg font-medium text-gray-800 mb-4">
                Ready to pick up your scent today?
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-700 transition"
              >
                <ShoppingBag className="h-5 w-5" />
                Start Shopping
              </a>
            </div>

            {/* Contact */}
            <div className="border-t pt-6 text-center text-sm text-gray-600">
              <p>
                Need help? Call us at{" "}
                <a href="tel:+8801777152588" className="font-medium text-amber-700 hover:underline">
                  +8801777152588
                </a>{" "}
                or email{" "}
                <a href="mailto:khushbuwaala@gmail.com" className="font-medium text-amber-700 hover:underline">
                  khushbuwaala@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}