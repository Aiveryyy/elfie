"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CloudOff, Download, Sparkles } from "lucide-react";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatTimeLabel, getLocalDateString } from "@/lib/date";
import { summarizePatterns } from "@/lib/patterns";
import { formatCountLabel } from "@/lib/utils";
import { useAllLogs } from "@/hooks/use-logs";
import { useSettings } from "@/hooks/use-settings";
import type { AiInsightResponse, InsightMode } from "@/types/elvyx";

const actionLabels: Record<InsightMode, string> = {
  reflect: "Reflect",
  pattern: "Name the pattern",
  "tiny-next-move": "Suggest a tiny next move",
};

export function DashboardPage({ aiAvailable = false }: { aiAvailable?: boolean }) {
  const logs = useAllLogs();
  const { settings } = useSettings();
  const [today] = useState(() => getLocalDateString());
  const [insightState, setInsightState] = useState<{
    status: "idle" | "loading" | "done" | "error";
    response?: AiInsightResponse;
    mode?: InsightMode;
    error?: string;
  }>({
    status: "idle",
  });

  const todayLogs = logs.filter((log) => log.dateLocal === today);
  const recentLogs = logs.slice(0, 6);
  const lastSevenDate = getLocalDateString(
    new Date(new Date(`${today}T00:00:00`).getTime() - 6 * 24 * 60 * 60 * 1000),
  );
  const recentSummary = summarizePatterns(logs, { startDate: lastSevenDate });
  const uniqueStates = new Set(
    logs.slice(0, 14).map((log) => `${log.attentionMode}|${log.mentalTexture}|${log.emotionalTone}`),
  ).size;

  async function requestInsight(mode: InsightMode) {
    setInsightState({
      status: "loading",
      mode,
    });

    try {
      const response = await fetch("/api/ai/insight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          localeDate: today,
          logs: logs.slice(0, 12),
        }),
      });
      const data = (await response.json()) as AiInsightResponse;

      if (!response.ok || !data.available) {
        setInsightState({
          status: "error",
          mode,
          response: data,
          error:
            data.available === false && data.reason === "missing_api_key"
              ? "AI is unavailable locally right now. Add OPENAI_API_KEY to enable it."
              : "AI could not produce a response right now.",
        });

        return;
      }

      setInsightState({
        status: "done",
        mode,
        response: data,
      });
    } catch {
      setInsightState({
        status: "error",
        mode,
        error: "AI could not be reached right now.",
      });
    }
  }

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Dashboard"
        title="A calm view of your recent state."
        copy="Elfie keeps the surface quiet: today's logs, recent context, and gentle descriptions of what is recurring. Core logging stays fully local."
        actions={
          <>
            <Button asChild>
              <Link href="/log">Log state</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/data">Export data</Link>
            </Button>
          </>
        }
      />

      {!logs.length ? (
        <EmptyState
          title="Nothing has been logged yet."
          copy="Start with a single state log. The dashboard, history, and patterns view will stay intentionally sparse until there is real data to show."
          action={
            <Button asChild>
              <Link href="/log">Create your first log</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <Card>
              <CardHeader>
                <CardDescription>Today</CardDescription>
                <CardTitle>{formatCountLabel(todayLogs.length, "log")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-500">
                <p>{todayLogs.length ? `Last logged ${formatTimeLabel(todayLogs[0]!.createdAt)}.` : "No state logged yet today."}</p>
                <p>Daily numbering resets with the local calendar on this device.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Recent variation</CardDescription>
                <CardTitle>{uniqueStates}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-500">
                <p>{uniqueStates === 1 ? "One recurring combination across the last 14 logs." : "Distinct attention / texture / tone combinations in the last 14 logs."}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Pattern note</CardDescription>
                <CardTitle className="text-[1.55rem] leading-tight">
                  {recentSummary.descriptiveSummaries[0] ?? "Patterns will appear once more logs exist."}
                </CardTitle>
              </CardHeader>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader className="flex-row items-end justify-between gap-4 space-y-0">
                <div className="space-y-1.5">
                  <CardDescription>Recent logs</CardDescription>
                  <CardTitle>Canonical lines</CardTitle>
                </div>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/history">
                    View history
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="surface-soft flex flex-col gap-2 p-4"
                  >
                    <p className="font-medium text-slate-900">{log.canonicalLine}</p>
                    <p className="text-sm text-slate-500">
                      Logged at {formatTimeLabel(log.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Local-first</CardDescription>
                <CardTitle>Privacy stays the default posture.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-6 text-slate-500">
                <p>
                  Logs stay in IndexedDB on this device unless you explicitly export a file
                  or use AI.
                </p>
                <p>
                  AI remains optional and scoped to brief reflections, pattern naming, or a
                  tiny next move.
                </p>
              </CardContent>
            </Card>
          </section>

          {settings.aiEnabled ? (
            <Card>
              <CardHeader>
                <CardDescription>AI support</CardDescription>
                <CardTitle>Brief, optional guidance from recent logs.</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {!aiAvailable ? (
                  <div className="surface-soft flex items-start gap-3 p-4 text-sm text-slate-600">
                    <CloudOff className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">AI is unavailable locally.</p>
                      <p>Add `OPENAI_API_KEY` to enable reflections without changing core logging.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3">
                      {(
                        Object.keys(actionLabels) as InsightMode[]
                      ).map((mode) => (
                        <Button
                          key={mode}
                          variant={insightState.mode === mode ? "default" : "outline"}
                          onClick={() => requestInsight(mode)}
                          disabled={!logs.length || insightState.status === "loading"}
                        >
                          {actionLabels[mode]}
                        </Button>
                      ))}
                    </div>

                    {insightState.status === "loading" ? (
                      <p className="text-sm text-slate-500">
                        Reading the recent logs and keeping the response short.
                      </p>
                    ) : null}

                    {insightState.status === "done" &&
                    insightState.response?.available ? (
                      <div className="surface-soft space-y-3 p-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--accent-ink)]">
                          <Sparkles className="h-4 w-4" />
                          Calm output
                        </div>
                        <h3 className="font-serif text-2xl tracking-tight text-slate-900">
                          {insightState.response.title}
                        </h3>
                        <p className="text-sm leading-7 text-slate-600">
                          {insightState.response.body}
                        </p>
                        {insightState.response.caution ? (
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                            {insightState.response.caution}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {insightState.status === "error" ? (
                      <p className="text-sm text-[#9d4259]">{insightState.error}</p>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex-row items-end justify-between gap-4 space-y-0">
              <div className="space-y-1.5">
                <CardDescription>Data controls</CardDescription>
                <CardTitle>Take your history with you when you need it.</CardTitle>
              </div>
              <Button asChild variant="soft">
                <Link href="/data">
                  <Download className="h-4 w-4" />
                  Open export tools
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </>
      )}
    </div>
  );
}
