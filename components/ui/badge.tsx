import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

const baseStyles =
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border";

export function Badge({ children, className = "" }: BadgeProps) {
  return <span className={`${baseStyles} ${className}`}>{children}</span>;
}
