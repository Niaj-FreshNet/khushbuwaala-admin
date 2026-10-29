import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms & Conditions | Khushbuwaala",
  description:
    "Read Khushbuwaala Terms & Conditions covering orders, payments, shipping, returns, privacy, liability, and more.",
};

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Terms & Conditions — Khushbuwaala</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Last updated: November 02, 2025</p>
          </CardHeader>

          <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              Welcome to <strong>Khushbuwaala</strong>. By accessing or using our website{" "}
              <strong>khushbuwaala.com</strong>, you agree to be bound by the following Terms &amp;
              Conditions. Please read them carefully before using our services.
            </p>
            <p>If you do not agree with any part of these terms, please discontinue use of the website.</p>

            <h2>1. About Us</h2>
            <p>
              Khushbuwaala is a fragrance brand based in Bangladesh, offering attars, perfume oils,
              perfumes, and related products through online and physical stores.
            </p>
            <p>These Terms apply to all users, customers, and visitors of the website.</p>

            <h2>2. Product Information</h2>
            <ul>
              <li>All product descriptions, images, and prices are provided for informational purposes.</li>
              <li>Actual product color, packaging, or appearance may vary slightly.</li>
              <li>
                Fragrance longevity and performance may differ depending on skin type, environment, and
                usage.
              </li>
            </ul>

            <h2>3. Pricing &amp; Availability</h2>
            <ul>
              <li>All prices are listed in Bangladeshi Taka (BDT).</li>
              <li>Prices and product availability may change without prior notice.</li>
              <li>We reserve the right to limit quantities or cancel orders at our discretion.</li>
            </ul>

            <h2>4. Orders &amp; Payments</h2>
            <ul>
              <li>Orders can be placed online through our website.</li>
              <li>We offer Cash on Delivery (COD) and prepaid online payment options.</li>
              <li>Orders are considered confirmed only after verification by our team.</li>
              <li>
                Providing incorrect or misleading order information may result in order cancellation.
              </li>
            </ul>

            <h2>5. Shipping &amp; Delivery</h2>
            <ul>
              <li>Delivery timelines and charges are outlined in our Shipping Policy.</li>
              <li>Customers must provide accurate delivery details.</li>
              <li>
                Khushbuwaala is not responsible for delays caused by courier services or unforeseen
                circumstances.
              </li>
            </ul>

            <h2>6. Returns, Refunds &amp; Exchanges</h2>
            <ul>
              <li>Returns and exchanges are governed by our Return &amp; Exchange Policy.</li>
              <li>
                Due to hygiene and safety reasons, opened or used perfumes and attars are non-returnable.
              </li>
              <li>Refunds (if applicable) are processed according to our stated policy.</li>
            </ul>

            <h2>7. Order Cancellation</h2>
            <ul>
              <li>Orders may be cancelled before dispatch only.</li>
              <li>Once dispatched, cancellation is not possible.</li>
              <li>
                Repeated refusal of COD orders may lead to restriction or suspension of future COD
                services.
              </li>
            </ul>

            <h2>8. User Responsibilities</h2>
            <p>By using this website, you agree that you will not:</p>
            <ul>
              <li>Misuse or attempt to harm the website or its services.</li>
              <li>Copy, reproduce, or distribute website content without permission.</li>
              <li>Provide false, incomplete, or misleading information.</li>
              <li>Attempt unauthorized access to our systems.</li>
            </ul>

            <h2>9. Intellectual Property</h2>
            <p>
              All content on this website, including logos, text, images, graphics, and branding, is the
              property of Khushbuwaala. Unauthorized use, reproduction, or distribution is strictly
              prohibited.
            </p>

            <h2>10. Privacy &amp; Data Protection</h2>
            <p>
              Your personal information is handled according to our Privacy Policy. We take reasonable
              measures to protect customer data but cannot guarantee absolute security.
            </p>

            <h2>11. Health &amp; Safety Disclaimer</h2>
            <ul>
              <li>Fragrance products may cause skin sensitivity or allergic reactions in rare cases.</li>
              <li>Customers are advised to perform a patch test before full use.</li>
              <li>
                Khushbuwaala shall not be held liable for adverse reactions caused by product use.
              </li>
            </ul>

            <h2>12. Limitation of Liability</h2>
            <p>Khushbuwaala shall not be liable for:</p>
            <ul>
              <li>Indirect, incidental, or consequential damages.</li>
              <li>Delivery delays beyond our control.</li>
              <li>Customer dissatisfaction due to personal fragrance preference.</li>
            </ul>

            <h2>13. Third-Party Services</h2>
            <p>
              We may use third-party services such as payment gateways and courier partners. Khushbuwaala
              is not responsible for issues caused by these third parties.
            </p>

            <h2>14. Governing Law</h2>
            <p>
              These Terms &amp; Conditions are governed by the laws of Bangladesh. Any disputes shall
              fall under the jurisdiction of Bangladeshi courts.
            </p>

            <h2>15. Changes to Terms</h2>
            <p>
              We reserve the right to update or modify these Terms &amp; Conditions at any time.
              Continued use of the website constitutes acceptance of any changes.
            </p>

            <div className="border-t pt-6 mt-8">
              <h2>16. Contact Information</h2>
              <p>
                For any questions regarding these Terms &amp; Conditions:
                <br />
                <strong>Email:</strong>{" "}
                <a href="mailto:khushbuwaala@gmail.com" className="text-blue-600">
                  khushbuwaala@gmail.com
                </a>
                <br />
                <strong>Phone / WhatsApp:</strong>{" "}
                <a href="tel:+8801777152588" className="text-blue-600">
                  +8801777152588
                </a>
                <br />
                <strong>Location:</strong> Shop No. G/138 Eastern Banabithi Shopping Complex, South
                Banasree, Dhaka, Bangladesh
              </p>

              <p className="mt-4 text-sm text-gray-600">
                <strong>Khushbuwaala</strong>
                <br />
                Authentic scents. Honest terms. Trusted experience.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
