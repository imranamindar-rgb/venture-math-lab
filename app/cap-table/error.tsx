"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function CapTableError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[VML cap-table error]", error?.message, error?.stack);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Cap table and waterfall output</p>
        <h2 className="mt-2 font-heading text-2xl font-semibold">The cap-table route hit a browser-side error</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The cap-table page hit a client-side exception before it could render. Try resetting the page or return to the
          calculator and reopen the page from a live scenario.
        </p>
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 font-mono text-xs text-red-700">
          {error?.message ?? "Unknown error"}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={reset}>Retry page</Button>
          <Link
            href="/calculator"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Open calculator
          </Link>
        </div>
      </Card>
    </div>
  );
}
