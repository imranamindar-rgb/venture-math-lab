import type { PropsWithChildren } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";

export function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
