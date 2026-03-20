import clsx from "clsx";
import type { HTMLAttributes, PropsWithChildren } from "react";

export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={clsx(
        "rounded-panel border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
