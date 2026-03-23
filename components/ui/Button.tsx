import clsx from "clsx";
import type { ButtonHTMLAttributes, MouseEventHandler, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700/70 focus-visible:ring-offset-2",
        variant === "primary" &&
          "bg-primary text-white shadow-glow hover:brightness-105 disabled:bg-slate-400",
        variant === "secondary" &&
          "border border-border bg-white text-foreground hover:border-primary/40 hover:bg-amber-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function EditScenarioButton({ className }: { className?: string }) {
  const handleClick: MouseEventHandler = () => {
    window.dispatchEvent(new CustomEvent("open-scenario-editor"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-amber-50 px-4 py-2 text-sm font-semibold text-primary hover:bg-amber-100 transition",
        className,
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Edit scenario
    </button>
  );
}
