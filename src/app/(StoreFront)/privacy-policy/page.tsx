import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy Policy | Khushbuwaala",
  description:
    "Learn how Khushbuwaala collects, uses, stores, and protects your personal information when you visit or purchase from khushbuwaala.com.",
  openGraph: {
    title: "Privacy Policy | Khushbuwaala",
    description: "Your trust matters. Learn how we protect your data.",
    url: "https://www.khushbuwaala.com/privacy-policy",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <CardDescription className="mt-2">Last updated: November 02, 2025</CardDescription>
          </CardHeader>

          <CardContent className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              At <strong>Khushbuwaala</strong>, we respect your privacy and are committed to protecting
              your personal information. This Privacy Policy explains how we collect, use, store, and
              safeguard your data when you visit or make a purchase from{" "}
              <strong>khushbuwaala.com</strong>.
            </p>
            <p>By using our website, you agree to the practices described in this policy.</p>

            <h2>1. Information We Collect</h2>
            <p>When you visit or interact with our website, we may collect the following information:</p>

            <h3>a) Personal Information</h3>
            <ul>
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Shipping and billing address</li>
              <li>
                Order and payment details (payment methods are handled securely by third-party gateways)
              </li>
            </ul>

            <h3>b) Technical Information</h3>
            <ul>
              <li>IP address</li>
              <li>Browser type and device information</li>
              <li>Pages visited and interaction data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and deliver your orders</li>
              <li>Communicate order updates and customer support</li>
              <li>Improve our website, products, and services</li>
              <li>Prevent fraud and unauthorized transactions</li>
              <li>Send promotional offers or updates (only if you choose to receive them)</li>
            </ul>
            <p>
              We do <strong>not</strong> sell or rent your personal information to third parties.
            </p>

            <h2>3. Cookies &amp; Tracking Technologies</h2>
            <p>Khushbuwaala uses cookies to:</p>
            <ul>
              <li>Enhance user experience</li>
              <li>Remember preferences</li>
              <li>Analyze website traffic and performance</li>
            </ul>
            <p>
              You can disable cookies through your browser settings, but some website features may not
              function properly.
            </p>

            <h2>4. Payment Security</h2>
            <p>
              All payments are processed through secure third-party payment gateways. Khushbuwaala does
              not store your card or payment details on its servers.
            </p>
            <p>We take reasonable technical and organizational measures to protect your information.</p>

            <h2>5. Sharing of Information</h2>
            <p>We may share your information only with:</p>
            <ul>
              <li>Delivery partners for order fulfillment</li>
              <li>Payment gateways for transaction processing</li>
              <li>Legal authorities if required by law</li>
            </ul>
            <p>All third parties are required to keep your information confidential.</p>

            <h2>6. Data Protection &amp; Security</h2>
            <p>We implement appropriate security measures to protect your personal data from:</p>
            <ul>
              <li>Unauthorized access</li>
              <li>Disclosure</li>
              <li>Alteration</li>
              <li>Destruction</li>
            </ul>
            <p>
              However, no online platform is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Request correction or deletion</li>
              <li>Opt out of promotional communications</li>
            </ul>
            <p>To exercise these rights, please contact us using the details below.</p>

            <h2>8. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the
              privacy practices or content of those sites.
            </p>

            <h2>9. Changes to This Privacy Policy</h2>
            <p>
              Khushbuwaala reserves the right to update this Privacy Policy at any time. Any changes will
              be posted on this page with an updated revision date.
            </p>
            <p>We encourage you to review this policy periodically.</p>

            <div className="border-t pt-6 mt-8">
              <h2>10. Contact Us</h2>
              <p>
                If you have any questions or concerns about this Privacy Policy, please contact us:
                <br />
                <strong>Email:</strong>{" "}
                <a href="mailto:khushbuwaala@gmail.com" className="text-blue-600 hover:underline">
                  khushbuwaala@gmail.com
                </a>
                <br />
                <strong>Phone:</strong>{" "}
                <a href="tel:+8801777152588" className="text-blue-600 hover:underline">
                  01777152588
                </a>
                <br />
                <strong>Address:</strong> Shop No. G/138, Eastern Banabithi Shopping Complex, South
                Banasree, Dhaka, Bangladesh
              </p>

              <p className="mt-4 text-sm text-gray-600">
                <strong>Khushbuwaala</strong>
                <br />
                Your trust matters. Your privacy matters.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
