import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { DeterministicCalculatorWorkspace } from "@/components/calculator/DeterministicCalculatorWorkspace";

export const metadata: Metadata = {
  title: "Calculator | Venture Math Lab",
  description: "Deterministic venture finance formulas: post-money, break-even exits, return-the-fund thresholds, and ownership drift.",
};

export default function CalculatorPage() {
  return (
    <PageShell>
      <DeterministicCalculatorWorkspace />
    </PageShell>
  );
}
