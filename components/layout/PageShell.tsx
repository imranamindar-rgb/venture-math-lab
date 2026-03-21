import type { PropsWithChildren } from "react";

import { SiteHeader } from "@/components/layout/SiteHeader";

export function PageShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
    </div>
  );
}
