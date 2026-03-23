import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SimulationWorkspace } from "@/components/simulator/SimulationWorkspace";

export const metadata: Metadata = {
  title: "Simulator | Venture Math Lab",
  description: "Monte Carlo simulation of venture outcomes across thousands of financing and exit paths.",
};

export default function SimulatorPage() {
  return (
    <PageShell>
      <SimulationWorkspace />
    </PageShell>
  );
}
