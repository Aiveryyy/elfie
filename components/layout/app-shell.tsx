"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Clock3,
  Database,
  Home,
  Settings2,
  Sparkles,
  SquarePen,
} from "lucide-react";

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
      <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[color:var(--accent-soft)] shadow-[0_16px_40px_rgba(227,208,239,0.45)]">
        <Sparkles className="h-4 w-4 text-[color:var(--accent-strong)]" />
      </div>
      <div className="space-y-1">
        <Link href="/" className="font-serif text-2xl tracking-tight text-slate-900">
          Elfie
        </Link>
        <p className="text-sm text-slate-500">Reflective state logging, kept local.</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1480px] gap-5 px-4 pb-24 pt-4 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
      <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[288px] shrink-0 flex-col rounded-[2rem] border border-[color:var(--border)] bg-white/92 px-5 py-6 shadow-[0_30px_80px_rgba(231,220,238,0.55)] backdrop-blur lg:flex">
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-transform duration-200 hover:-translate-y-0.5",
                  isActive
                    ? "bg-[color:var(--accent-soft)] text-slate-900 shadow-[0_12px_30px_rgba(233,219,239,0.45)]"
                    : "text-slate-600 hover:bg-[color:var(--surface-muted)] hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
          <p className="text-sm font-medium text-slate-900">Local-first by design</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Logs live in your browser unless you explicitly export or ask for AI support.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mb-5 flex items-center justify-between rounded-[1.75rem] border border-[color:var(--border)] bg-white/86 px-5 py-4 shadow-[0_18px_48px_rgba(236,226,241,0.52)] backdrop-blur lg:hidden">
          <AppMark />
          <Link
            href="/log"
            className="rounded-full bg-[color:var(--accent-strong)] px-4 py-2 text-sm font-medium text-white shadow-[0_16px_30px_rgba(180,148,199,0.32)]"
          >
            New log
          </Link>
        </header>

        <main className="flex min-w-0 flex-1 flex-col">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-between rounded-[1.75rem] border border-[color:var(--border)] bg-white/95 px-2 py-2 shadow-[0_22px_40px_rgba(220,201,233,0.45)] backdrop-blur lg:hidden">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
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
