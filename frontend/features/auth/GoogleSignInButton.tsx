"use client";

import { GoogleLogin } from "@react-oauth/google";

/** Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured. */
export function GoogleSignInButton({
  onToken,
  onError,
}: {
  onToken: (idToken: string) => void;
  onError: (message: string) => void;
}) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-center">
        <GoogleLogin
          theme="filled_black"
          shape="pill"
          text="continue_with"
          onSuccess={({ credential }) =>
            credential ? onToken(credential) : onError("Google did not return a credential. Please try again.")
          }
          onError={() => onError("Google sign-in failed. Please try again.")}
        />
      </div>
      <div className="flex w-full items-center gap-3 text-xs text-ink-soft" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
