"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { navItems } from "./nav-items";

/**
 * Highlights the current section. It uses the first route segment ("books", "authors"...)
 * rather than the full pathname, so it never depends on dynamic URL values: the header stays
 * part of the static shell and pages can still return real 404 status codes.
 */
export function NavLinks({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) {
  const segment = useSelectedLayoutSegment();
  return (
    <ul className={orientation === "horizontal" ? "flex items-center gap-1" : "flex flex-col gap-1"}>
      {navItems.map((item) => {
        const active = segment === item.segment;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-full px-4 py-2 text-sm transition ${
                active ? "bg-brown text-ink" : "text-ink-soft hover:bg-surface hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
