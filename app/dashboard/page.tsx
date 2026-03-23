import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { FundamentalsDashboardWorkspace } from "@/components/dashboard/FundamentalsDashboardWorkspace";

export const metadata: Metadata = {
  title: "Dashboard | Venture Math Lab",
  description: "Power-law fundamentals, dilution benchmarks, and threshold math for venture finance.",
};

export default function DashboardPage() {
  return (
    <PageShell>
      <FundamentalsDashboardWorkspace />
    </PageShell>
  );
}
