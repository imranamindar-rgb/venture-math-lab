"use client";

import { useEffect, useId, useState } from "react";

interface InfoTipProps {
  content: string;
  label?: string;
}

export function InfoTip({ content, label = "More information" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleWindowClick = () => {
      setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleWindowClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleWindowClick);
    };
  }, [open]);

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-[11px] font-semibold leading-none text-slate-500 transition hover:border-slate-400 hover:text-slate-700 focus:border-primary focus:text-slate-700 focus:outline-none"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setOpen(false);
          }
        }}
      >
        i
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`absolute left-0 top-full z-30 mt-2 w-56 max-w-[calc(100vw-3rem)] rounded-2xl border border-slate-200 bg-white/95 p-3 text-left text-xs leading-5 text-slate-700 shadow-lg transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        {content}
      </span>
    </span>
  );
}
