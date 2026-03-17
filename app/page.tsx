import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col overflow-hidden">

      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(var(--color-text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-primary) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top nav bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)]/50">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div className="w-6 h-6 rounded-[5px] bg-[var(--color-text-primary)] flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2h3v3H2zM7 2h3v3H7zM2 7h3v3H2zM7 7h3v3H7z" fill="var(--color-background)" opacity="0.9"/>
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-[-0.2px]">
            Pathly
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!userId ? (
            <>
              <SignInButton mode="modal">
                <button className="px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-150 rounded-md hover:bg-[var(--color-secondary)]">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3.5 py-1.5 text-[12px] font-medium bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] rounded-md hover:opacity-85 transition-opacity duration-150">
                  Get started
                </button>
              </SignUpButton>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 text-[12px] font-medium bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] rounded-md hover:opacity-85 transition-opacity duration-150"
            >
              Dashboard →
            </Link>
          )}
        </div>
      </header>

      {/* Main content — vertically centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

        {/* Status pill */}
        <div className="mb-7 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-secondary)] text-[11px] font-medium text-[var(--color-text-muted)] tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Early access · Now open
        </div>

        {/* Headline */}
        <h1
          className="text-[clamp(2rem,5vw,3.5rem)] font-semibold text-[var(--color-text-primary)] tracking-[-0.04em] leading-[1.1] max-w-[640px] mb-5"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          The IDE for
          <br />
          <span className="italic font-normal text-[var(--color-text-muted)]">learning anything.</span>
        </h1>

        {/* Sub-copy */}
        <p className="text-[14px] text-[var(--color-text-muted)] max-w-[400px] leading-[1.65] mb-9">
          Upload your resources, set a goal, and let AI build you a structured, adaptive roadmap — with chat, docs, and progress tracking in one place.
        </p>

        {/* CTAs */}
        {!userId ? (
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <SignUpButton mode="modal">
              <button className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] text-[13px] font-medium hover:opacity-85 transition-opacity duration-150">
                Start learning free
                <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="px-5 py-2.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-primary)] text-[var(--color-text-muted)] text-[13px] font-medium hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]/40 transition-all duration-150">
                Sign in
              </button>
            </SignInButton>
          </div>
        ) : (
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-text-highlight)] text-[13px] font-medium hover:opacity-85 transition-opacity duration-150"
          >
            Open dashboard
            <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </Link>
        )}

        {/* Feature row */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {[
            { icon: "◈", label: "AI roadmaps" },
            { icon: "⌘", label: "Chat interface" },
            { icon: "◎", label: "Progress tracking" },
            { icon: "⊞", label: "Resource hub" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-muted)]">
              <span className="text-[11px] opacity-50">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center px-6 py-4 border-t border-[var(--color-border-primary)]/40">
        <p className="text-[11px] text-[var(--color-text-muted)]/60 tracking-wide">
          Pre-MVP · v0.0 · Built by Lakshay Diwan
        </p>
      </footer>

    </div>
  );
}