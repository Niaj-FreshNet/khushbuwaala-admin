import { Suspense } from "react";
import AdminDashboardClient from "./_components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading dashboard...</p>}>
      <AdminDashboardClient />
    </Suspense>
  );
}