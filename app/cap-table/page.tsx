import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { CapTableWaterfallWorkspace } from "@/components/cap-table/CapTableWaterfallWorkspace";

export const metadata: Metadata = {
  title: "Cap Table | Venture Math Lab",
  description: "Current and as-converted cap table with multi-series preferred waterfall analysis.",
};

export default function CapTablePage() {
  return (
    <PageShell>
      <CapTableWaterfallWorkspace />
    </PageShell>
  );
}
