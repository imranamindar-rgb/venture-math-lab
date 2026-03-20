import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[rgba(249,246,239,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-slate-900">
            VC
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-foreground">Venture Math Lab</p>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Three engines for venture finance
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate-600">
          <Link href="/calculator" className="hover:text-slate-950">
            Calculator
          </Link>
          <Link href="/simulator" className="hover:text-slate-950">
            Simulator
          </Link>
          <Link href="/cap-table" className="hover:text-slate-950">
            Cap Table
          </Link>
          <Link href="/compare" className="hover:text-slate-950">
            Compare
          </Link>
          <Link href="/methodology" className="hover:text-slate-950">
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
