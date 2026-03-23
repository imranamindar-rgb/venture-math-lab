import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { CompareWorkspace } from "@/components/simulator/CompareWorkspace";

export const metadata: Metadata = {
  title: "Compare | Venture Math Lab",
  description: "Side-by-side scenario comparison across deterministic, stochastic, and cap-table engines.",
};

export default function ComparePage() {
  return (
    <PageShell>
      <CompareWorkspace />
    </PageShell>
  );
}
