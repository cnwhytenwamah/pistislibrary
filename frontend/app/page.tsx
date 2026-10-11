import { SystemStatus } from "@/features/system/SystemStatus";
import { siteConfig } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="bg-aura flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center px-6 py-6">
        <span className="text-sm font-semibold tracking-[0.32em] text-ink">PISTISLIBRARY</span>
      </header>

      <main
        id="main"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center"
      >
        <p className="rounded-full border border-line px-4 py-1 text-xs tracking-widest text-copper-soft uppercase">
          Foundation online
        </p>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Discover. <span className="text-copper-bright">Read.</span> Grow.
        </h1>

        <p className="max-w-xl text-balance text-base text-ink-soft sm:text-lg">
          {siteConfig.description}
        </p>

        <SystemStatus />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-ink-soft">
        {siteConfig.name} · {siteConfig.tagline}
      </footer>
    </div>
  );
}
