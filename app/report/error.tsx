"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ReportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Report route error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Scenario report</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold">Board-ready venture math summary</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          The report route hit a browser-side exception before it could render. Try resetting the page or return to the
          calculator and reopen the report from a live scenario.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={reset}>Retry report</Button>
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
