"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calculator", label: "Calculator" },
  { href: "/simulator", label: "Simulator" },
  { href: "/cap-table", label: "Cap Table" },
  { href: "/fund", label: "Fund Lab" },
  { href: "/operator", label: "Operator" },
  { href: "/compare", label: "Compare" },
  { href: "/report", label: "Report" },
  { href: "/methodology", label: "Methodology" },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(249,246,239,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-slate-900">
            VC
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-foreground">Venture Math Lab</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Three engines for venture finance</p>
          </div>
        </Link>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav id="site-navigation" className="hidden items-center gap-5 text-sm text-slate-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>

        {menuOpen ? (
          <nav className="w-full rounded-2xl border border-border bg-white p-4 text-sm text-slate-700 md:hidden">
            <div className="grid gap-2 sm:grid-cols-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-2 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
