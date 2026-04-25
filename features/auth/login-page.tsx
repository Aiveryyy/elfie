"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  ArrowRight,
  GitBranch,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authProviderIds } from "@/lib/auth";
import { cn } from "@/lib/utils";

const providerLabels = {
  google: "Google",
  twitter: "Twitter / X",
  github: "GitHub",
} as const;

const providerDescriptions = {
  google: "Continue with a Google account.",
  twitter: "Continue with Twitter or X.",
  github: "Continue with a GitHub account.",
} as const;

const providerAccentClasses = {
  google: "bg-white text-slate-900",
  twitter: "bg-slate-950 text-white",
  github: "bg-slate-900 text-white",
} as const;

function GoogleMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 shadow-[0_12px_24px_rgba(148,163,184,0.2)]">
      G
    </span>
  );
}

function TwitterMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
      X
    </span>
  );
}

function ProviderMark({ providerId }: { providerId: (typeof authProviderIds)[number] }) {
  if (providerId === "google") {
    return <GoogleMark />;
  }

  if (providerId === "twitter") {
    return <TwitterMark />;
  }

  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
      <GitBranch className="h-5 w-5" />
    </span>
  );
}

function getAuthErrorCopy(error: string | null) {
  if (!error) {
    return null;
  }

  if (error === "Configuration") {
    return "This sign-in method needs provider credentials before it can be used.";
  }

  if (error === "OAuthAccountNotLinked") {
    return "That email is already linked to a different sign-in method.";
  }

  return "Sign-in could not be completed. Please try another method.";
}

export function LoginPage({ configuredProviders }: { configuredProviders: string[] }) {
  const { data: session, status } = useSession();
  const searchParams =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const safeCallbackUrl = callbackUrl.startsWith("/") ? callbackUrl : "/";
  const errorCopy = getAuthErrorCopy(searchParams.get("error"));

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Login"
        title="Choose how Elfie should recognize you."
        copy="Sign in when you want a lightweight account layer. Your logs still stay in this browser until you explicitly export, import, or connect future sync features."
        actions={
          <Button asChild variant="outline">
            <Link href="/">Continue without login</Link>
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardDescription>Sign-in methods</CardDescription>
            <CardTitle>Continue with a provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorCopy ? (
              <div className="surface-soft px-4 py-3 text-sm leading-6 text-slate-600">
                {errorCopy}
              </div>
            ) : null}

            {status === "loading" ? (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking your current session...
              </div>
            ) : null}

            {session?.user ? (
              <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
                <p className="font-medium text-slate-900">
                  Signed in{session.user.name ? ` as ${session.user.name}` : ""}.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  You can return to Elfie or sign out before choosing another method.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={safeCallbackUrl}>
                      Return to Elfie
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                  >
                    Sign out
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              {authProviderIds.map((providerId) => {
                const isConfigured = configuredProviders.includes(providerId);

                return (
                  <button
                    key={providerId}
                    type="button"
                    disabled={!isConfigured || status === "loading"}
                    onClick={() => void signIn(providerId, { callbackUrl: safeCallbackUrl })}
                    className="group rounded-[1.5rem] border border-[color:var(--border)] bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:shadow-[0_18px_38px_rgba(226,214,236,0.45)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:border-[color:var(--border)] disabled:hover:shadow-none"
                  >
                    <span className="flex items-center gap-4">
                      <ProviderMark providerId={providerId} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-slate-900">
                          Continue with {providerLabels[providerId]}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">
                          {isConfigured
                            ? providerDescriptions[providerId]
                            : `${providerLabels[providerId]} credentials are not configured yet.`}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          isConfigured
                            ? providerAccentClasses[providerId]
                            : "bg-[color:var(--surface-muted)] text-slate-500",
                        )}
                      >
                        {isConfigured ? "Ready" : "Setup needed"}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardDescription>Privacy boundary</CardDescription>
              <CardTitle>Login does not move your logs.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
              <p>
                Elfie still stores state logs in local IndexedDB. OAuth only identifies
                the current browser session for account-aware screens.
              </p>
              <p>
                Future sync can build on this without changing today&apos;s export and
                restore flow.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <CardDescription>Provider setup</CardDescription>
              <CardTitle>Credentials stay server-side.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
              <p>
                Add client IDs and secrets in environment variables to enable each
                button. Missing providers stay visible but disabled.
              </p>
              <p className="pill-chip">
                <Sparkles className="h-3.5 w-3.5" />
                Google, Twitter / X, and GitHub are wired.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
