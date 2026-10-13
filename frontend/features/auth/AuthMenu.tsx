"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

export function AuthMenu({ stacked = false }: { stacked?: boolean }) {
  const { status, user, logout } = useAuth();
  const layout = stacked ? "flex flex-col gap-2" : "flex items-center gap-2";

  if (status === "loading") {
    // Reserve space so the header doesn't jump
    return <div aria-hidden="true" className="h-9 w-28" />;
  }

  if (!user) {
    return (
      <div className={layout}>
        <Link href="/login" className={buttonClasses("ghost", "sm")}>
          Log in
        </Link>
        <Link href="/register" className={buttonClasses("secondary", "sm")}>
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className={layout}>
      <span className="max-w-40 truncate text-sm text-ink-soft" title={user.email}>
        {user.name}
      </span>
      <button type="button" onClick={() => void logout()} className={buttonClasses("secondary", "sm")}>
        Log out
      </button>
    </div>
  );
}
