import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SensitivityWorkspace } from "@/components/sensitivity/SensitivityWorkspace";

export const metadata: Metadata = {
  title: "Sensitivity | Venture Math Lab",
  description: "Parameter sensitivity analysis showing which inputs have the largest impact on founder outcomes.",
};

export default function SensitivityPage() {
  return (
    <PageShell>
      <SensitivityWorkspace />
    </PageShell>
  );
}
