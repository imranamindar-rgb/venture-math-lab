"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  calculator: "Calculator",
  simulator: "Simulator",
  "cap-table": "Cap Table",
  compare: "Compare",
  fund: "Fund Lab",
  operator: "Operator",
  report: "Report",
  methodology: "Methodology",
};

export function Breadcrumb() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const label = routeLabels[segments[0]] ?? segments[0];

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
      <ol className="flex items-center gap-2 text-xs text-slate-500">
        <li>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">/</li>
        <li className="font-semibold text-foreground">{label}</li>
      </ol>
    </nav>
  );
}
