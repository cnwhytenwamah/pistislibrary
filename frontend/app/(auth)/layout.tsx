import Link from "next/link";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const content = (
    <div className="bg-aura flex min-h-screen flex-col items-center px-4 py-10">
      <Link href="/" className="text-sm font-semibold tracking-[0.28em]">
        PISTIS<span className="text-copper-bright">LIBRARY</span>
      </Link>
      <main
        id="main"
        className="mt-10 w-full max-w-md rounded-2xl border border-line bg-surface/80 p-6 shadow-glow backdrop-blur sm:p-8"
      >
        {children}
      </main>
    </div>
  );

  // The Google script is only loaded on the auth pages
  return clientId ? <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider> : content;
}
