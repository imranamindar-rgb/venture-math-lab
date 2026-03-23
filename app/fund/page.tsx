import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { FundConstructionWorkspace } from "@/components/fund/FundConstructionWorkspace";

export const metadata: Metadata = {
  title: "Fund Lab | Venture Math Lab",
  description: "Portfolio construction, J-curve modeling, and reserve constraint analysis for venture funds.",
};

export default function FundPage() {
  return (
    <PageShell>
      <FundConstructionWorkspace />
    </PageShell>
  );
}
