import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { ReportWorkspace } from "@/components/report/ReportWorkspace";

export const metadata: Metadata = {
  title: "Report | Venture Math Lab",
  description: "Board-ready venture math summary with waterfall, simulation, and operator intelligence.",
};

export default function ReportPage() {
  return (
    <PageShell>
      <ReportWorkspace />
    </PageShell>
  );
}
