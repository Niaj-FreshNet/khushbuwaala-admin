// File: app/dashboard/page.tsx
import { Suspense } from "react";
import AdminDashboardClient from "./_components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  // Optional: If you prefer SSR fetching for initial state, or you can let AdminDashboardClient 
  // handle the queries via RTK Query hooks as designed earlier.

  return (
    <Suspense fallback={<p className="text-gray-500">Loading dashboard...</p>}>
      <AdminDashboardClient />
    </Suspense>
  );
}