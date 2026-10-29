import React, { Suspense } from "react";
import DashboardShell from "./DashboardShell";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-2">Loading dashboard...</div>}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
