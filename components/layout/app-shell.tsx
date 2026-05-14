"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock3,
  Cloud,
  Database,
  Home,
  LogOut,
  Settings2,
  Sparkles,
  SquarePen,
} from "lucide-react";

import { useDriveSync } from "@/components/providers/drive-sync-provider";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/log", label: "Log State", icon: SquarePen },
  { href: "/history", label: "History", icon: Clock3 },
  { href: "/patterns", label: "Patterns", icon: BarChart3 },
  { href: "/data", label: "Export / Import", icon: Database },
  { href: "/settings", label: "Settings", icon: Settings2 },
] as const;

function AppMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] shadow-[0_8px_18px_rgba(50,47,40,0.08)]">
        <Sparkles className="h-4 w-4 text-[color:var(--accent-strong)]" />
      </div>
      <div className="space-y-1">
        <Link href="/" className="font-serif text-2xl tracking-normal text-slate-900">
          Elfie
        </Link>
        <p className="text-sm text-slate-500">Reflective state logging, kept local.</p>
      </div>
    </div>
  );
}

function AccountButton() {
  const sync = useDriveSync();

  if (sync.isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => void sync.signOutFromGoogle()}
        className="inline-flex h-11 max-w-[220px] items-center gap-2 rounded-lg border border-[color:var(--border)] bg-white px-3 text-sm font-medium text-slate-700 shadow-[0_8px_18px_rgba(50,47,40,0.07)] transition hover:border-[color:var(--accent)] hover:text-slate-900"
        title="Sign out of Google"
      >
        <LogOut className="h-4 w-4 shrink-0 text-[color:var(--accent-strong)]" />
        <span className="truncate">
          {sync.userEmail ?? sync.userName ?? "Signed in"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={sync.signInWithGoogle}
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[color:var(--accent-strong)] px-4 text-sm font-medium text-white shadow-[0_8px_18px_rgba(50,47,40,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(50,47,40,0.16)]"
    >
      <Cloud className="h-4 w-4" />
      <span>Sign in</span>
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] gap-5 px-4 pb-24 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[288px] shrink-0 flex-col rounded-lg border border-[color:var(--border)] bg-white/90 px-5 py-6 shadow-[0_16px_36px_rgba(50,47,40,0.08)] backdrop-blur lg:flex">
        <AppMark />
        <nav className="mt-8 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5",
                  isActive
                    ? "bg-[color:var(--accent-soft)] text-slate-900 shadow-[0_8px_18px_rgba(50,47,40,0.08)]"
                    : "text-slate-600 hover:bg-[color:var(--surface-muted)] hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <p className="text-sm font-medium text-slate-900">Local-first by design</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Logs live in your browser unless you explicitly export or ask for AI support.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mb-5 hidden items-center justify-end lg:flex">
          <AccountButton />
        </header>

        <header className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-white/88 px-5 py-4 shadow-[0_12px_28px_rgba(50,47,40,0.08)] backdrop-blur lg:hidden">
          <AppMark />
          <div className="flex shrink-0 items-center gap-2">
            <AccountButton />
            <Link
              href="/log"
              className="rounded-lg bg-[color:var(--accent-strong)] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_18px_rgba(50,47,40,0.12)]"
            >
              New log
            </Link>
          </div>
        </header>

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-white/95 px-2 py-2 shadow-[0_14px_30px_rgba(50,47,40,0.12)] backdrop-blur lg:hidden">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "bg-[color:var(--accent-soft)] text-slate-900"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
