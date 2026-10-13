import type { Metadata } from "next";
import { SystemStatus } from "@/features/system/SystemStatus";

export const metadata: Metadata = { title: "System status", robots: { index: false, follow: false } };

export default function StatusPage() {
  return (
    <main id="main" className="bg-aura flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">System status</h1>
      <SystemStatus />
    </main>
  );
}
