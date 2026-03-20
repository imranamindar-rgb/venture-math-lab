import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

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
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition",
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
