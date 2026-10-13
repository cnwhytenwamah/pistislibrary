"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState, type FormEvent } from "react";
import { buttonClasses } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/format";
import { useAuth } from "./AuthProvider";
import { GoogleSignInButton } from "./GoogleSignInButton";

const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-copper";

function describe(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return "Please check the details you entered (the password needs at least 8 characters).";
    if (err.status === 429) return "Too many attempts. Please wait a few minutes and try again.";
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
      // Read at submit time: keeps the form itself free of request-time data (it renders statically)
      router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
      router.refresh();
    } catch (err) {
      setError(describe(err));
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    void run(() => (isLogin ? login(email, password) : register(String(data.get("name") ?? ""), email, password)));
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton onToken={(t) => void run(() => loginWithGoogle(t))} onError={setError} />

      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        {!isLogin && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input id="name" name="name" type="text" required minLength={2} maxLength={100} autoComplete="name" className={fieldClass} />
          </div>
        )}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={isLogin ? 1 : 8}
            maxLength={72}
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-describedby={isLogin ? undefined : "password-hint"}
            className={fieldClass}
          />
          {!isLogin && (
            <p id="password-hint" className="mt-1.5 text-xs text-ink-soft">At least 8 characters.</p>
          )}
        </div>

        <div aria-live="polite">
          {error && (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={pending} className={buttonClasses("primary", "lg", "w-full")}>
          {pending ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        {isLogin ? "New to PistisLibrary? " : "Already have an account? "}
        <Suspense fallback={<SwitchLink href={isLogin ? "/register" : "/login"} isLogin={isLogin} />}>
          <SwitchLinkWithNext isLogin={isLogin} />
        </Suspense>
      </p>
    </div>
  );
}

const switchClass = "text-copper-soft underline-offset-4 hover:text-copper-bright hover:underline";

function SwitchLink({ href, isLogin }: { href: string; isLogin: boolean }) {
  return (
    <Link href={href} className={switchClass}>
      {isLogin ? "Create an account" : "Log in"}
    </Link>
  );
}

/** The link to the other auth page keeps the `next` redirect target. */
function SwitchLinkWithNext({ isLogin }: { isLogin: boolean }) {
  const next = safeNextPath(useSearchParams().get("next"));
  const base = isLogin ? "/register" : "/login";
  return <SwitchLink href={next !== "/" ? `${base}?next=${encodeURIComponent(next)}` : base} isLogin={isLogin} />;
}
