"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global route error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(246,204,107,0.2),_transparent_45%),linear-gradient(180deg,_#fffaf0_0%,_#f8f3e7_100%)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Venture Math Lab</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold text-slate-900">This page hit a browser-side error</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              The app caught a client-side exception before the page could finish rendering. Retry first. If the error persists, go back to the dashboard or calculator and reopen the page from there.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Retry page
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Open dashboard
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Open calculator
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
