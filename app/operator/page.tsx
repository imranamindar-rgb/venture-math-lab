import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { OperatorWorkspace } from "@/components/operator/OperatorWorkspace";

export const metadata: Metadata = {
  title: "Operator | Venture Math Lab",
  description: "Cash discipline metrics: runway, burn multiple, working capital, and financing gap analysis.",
};

export default function OperatorPage() {
  return (
    <PageShell>
      <OperatorWorkspace />
    </PageShell>
  );
}
