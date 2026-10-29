import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Return & Exchange Policy | Khushbuwaala",
  description:
    "Apply for return or exchange within 7 days of receiving your product. View eligibility rules and contact details.",
};

export default function ExchangePolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Return &amp; Exchange Policy</CardTitle>
            <Badge variant="secondary" className="mt-2">
              7-Day Window
            </Badge>
          </CardHeader>

          <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              You may apply for exchange or return within <strong>7 days</strong> of receiving the
              product.
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="m-0 font-semibold text-amber-900">
                RETURN AND EXCHANGE ARE NOT AVAILABLE DURING DISCOUNT CAMPAIGNS UNLESS STATED.
              </p>
            </div>

            <h2>Eligibility for Return or Exchange</h2>
            <p>
              Due to the nature of perfumes and attars, we follow strict hygiene and quality
              standards.
            </p>

            <ul>
              <li>
                Product must be <strong>unused</strong> (testing allowed)
              </li>
              <li>
                You must notify us within <strong>48 hours</strong> of receiving the product
              </li>
              <li>Requests made after this time may not be accepted</li>
              <li>
                Original packaging, tags, barcode, and receipt <strong>required</strong>
              </li>
              <li>
                Product must be received first — <strong>no instant exchange/refund</strong> with
                delivery agent
              </li>
            </ul>

            <div className="border-t pt-6 mt-8">
              <h2>Contact Us</h2>
              <p className="m-0">
                <strong>Phone:</strong>{" "}
                <a href="tel:+8801777152588" className="text-blue-600 hover:underline">
                  +8801777152588
                </a>
                ,{" "}
                <a href="tel:+8801777152588" className="text-blue-600 hover:underline">
                  +8801777152588
                </a>
                <br />
                <strong>Email:</strong>{" "}
                <a href="mailto:khushbuwaala@gmail.com" className="text-blue-600 hover:underline">
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
