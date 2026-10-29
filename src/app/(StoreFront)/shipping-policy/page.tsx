import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Shipping Policy | Khushbuwaala Perfumes",
  description: "Nationwide & international shipping from Khushbuwaala Perfumes. Delivery in 2-5 days inside Bangladesh.",
};

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Shipping Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 text-gray-700">
            <p>
              We offer <strong>nationwide and international shipping</strong>. One address per order.
            </p>

            <h2 className="text-xl font-semibold">Delivery Timeline</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Order Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Inside Dhaka</TableCell>
                  <TableCell>00:00 – 23:59</TableCell>
                  <TableCell>Regular</TableCell>
                  <TableCell>70 BDT</TableCell>
                  <TableCell>2–3 working days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Outside Dhaka</TableCell>
                  <TableCell>00:00 – 23:59</TableCell>
                  <TableCell>Regular</TableCell>
                  <TableCell>100 BDT</TableCell>
                  <TableCell>3–5 working days</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>International</TableCell>
                  <TableCell>00:00 – 23:59</TableCell>
                  <TableCell>Regular</TableCell>
                  <TableCell>Depends</TableCell>
                  <TableCell>Depends</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <p className="text-sm">
              *International cost depends on weight & destination. Contact us for quote.
            </p>

            <h2 className="text-xl font-semibold">Order Tracking</h2>
            <p>Call <strong>+8801777152588</strong> or message us on social media.</p>

            <h2 className="text-xl font-semibold">Delayed Delivery?</h2>
            <p>Contact us immediately. We’ll resolve it.</p>

            <h2 className="text-xl font-semibold">Not Home?</h2>
            <p>Anyone can receive. For COD, pay via provided method.</p>

            <div className="border-t pt-6 mt-8">
              <h2 className="text-xl font-semibold">Contact Us</h2>
              <p>
                <strong>Phone:</strong> <a href="tel:+8801777152588" className="text-blue-600">+8801777152588</a><br />
                <strong>Email:</strong> <a href="mailto:khushbuwaala@gmail.com" className="text-blue-600">khushbuwaala@gmail.com</a><br />
                <strong>Hours:</strong> 10:00 AM – 10:00 PM
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}