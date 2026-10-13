import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: { href: string; label: ReactNode };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="shrink-0 text-sm text-copper-soft hover:text-copper-bright">
          {action.label}
        </Link>
      )}
    </div>
  );
}
