import type { ReactNode } from "react";

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line bg-umber px-2.5 py-0.5 text-xs text-ink-soft ${className}`}
    >
      {children}
    </span>
  );
}
