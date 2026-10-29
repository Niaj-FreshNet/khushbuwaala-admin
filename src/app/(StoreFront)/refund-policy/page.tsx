import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refund & Exchange Policy | Khushbuwaala",
  description:
    "Read Khushbuwaala's Return, Refund & Exchange Policy including eligibility, non-returnable items, and return process.",
};

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">
              Refund &amp; Exchange Policy
            </CardTitle>
          </CardHeader>

          <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              At <strong>Khushbuwaala</strong>, customer satisfaction is our top priority.
              If you face any issue with your order, we are here to help. Please read
              our Return &amp; Exchange Policy carefully before making a purchase.
            </p>

            <h2>Exchange &amp; Return Window</h2>
            <p>
              You may apply for exchange or return within{" "}
              <strong>7 days</strong> of receiving the product.
            </p>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="m-0 font-semibold text-amber-900">
                RETURN AND EXCHANGE ARE NOT AVAILABLE DURING DISCOUNT CAMPAIGNS
                UNLESS STATED.
              </p>
            </div>

            <h2>Eligibility for Return or Exchange</h2>
            <p>
              Due to the nature of perfumes and attars, we follow strict hygiene
              and quality standards.
            </p>

            <ul>
              <li>
                Product must be <strong>unused</strong> (testing allowed)
              </li>
              <li>
                You must notify us within <strong>48 hours</strong> of receiving
                the product
              </li>
              <li>Requests made after this time may not be accepted</li>
              <li>
                Original packaging, tags, barcode, and receipt required
              </li>
              <li>
                Product must be received first —{" "}
                <strong>no instant exchange/refund</strong> with delivery agent
              </li>
            </ul>

            <h2>Lost Receipt / Packaging?</h2>
            <p>
              We may verify your order via your registered phone number. Inner
              packaging is mandatory for any return or exchange request.
            </p>

            <h2>Non-Returnable Items</h2>
            <p>The following items are non-returnable and non-refundable:</p>
            <ul>
              <li>Opened or used perfumes / attars</li>
              <li>Sample items</li>
              <li>Discounted or clearance items</li>
              <li>Gift items (unless damaged or incorrect)</li>
            </ul>

            <h2>Return Process</h2>
            <p>To request a return or exchange:</p>
            <ul>
              <li>Contact us via WhatsApp, phone, or email</li>
              <li>Share your order number</li>
              <li>Provide clear photos or video showing the issue</li>
              <li>Wait for our confirmation before sending the product back</li>
            </ul>

            <p className="font-semibold text-red-600">
              Unauthorized returns will not be accepted.
            </p>

            <div className="border-t pt-6 mt-8">
              <h2>Contact Us</h2>
              <p>
                <strong>Phone / WhatsApp:</strong>{" "}
                <a
                  href="tel:+8801777152588"
                  className="text-blue-600 hover:underline"
                >
                  +8801777152588
                </a>
                ,{" "}
                <a
                  href="tel:+8801777152588"
                  className="text-blue-600 hover:underline"
                >
                  +8801777152588
                </a>
                <br />
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:khushbuwaala@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  khushbuwaala@gmail.com
                </a>
              </p>

              <p className="mt-4 text-sm text-gray-600">
                <strong>Khushbuwaala</strong>
                <br />
                Authentic scents. Honest service. Customer-first experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
