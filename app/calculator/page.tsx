import { PageShell } from "@/components/layout/PageShell";
import { DeterministicCalculatorWorkspace } from "@/components/calculator/DeterministicCalculatorWorkspace";

export default function CalculatorPage() {
  return (
    <PageShell>
      <DeterministicCalculatorWorkspace />
    </PageShell>
  );
}
