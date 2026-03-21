"use client";

interface InfoTipProps {
  content: string;
  label?: string;
}

export function InfoTip({ content, label = "More information" }: InfoTipProps) {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold leading-none text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:border-primary focus:text-slate-700 focus:outline-none"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white/95 p-3 text-left text-xs leading-5 text-slate-700 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {content}
      </span>
    </span>
  );
}
