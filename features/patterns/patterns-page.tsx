"use client";

import { useState } from "react";

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
import { getLocalDateString } from "@/lib/date";
import { summarizePatterns } from "@/lib/patterns";
import { useAllLogs } from "@/hooks/use-logs";

function getQuickRange(days: number) {
  return getLocalDateString(
    new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000),
  );
}

export function PatternsPage() {
  const logs = useAllLogs();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const summary = summarizePatterns(logs, {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Patterns"
        title="Descriptions of what keeps recurring."
        copy="Patterns remain descriptive, not prescriptive. Elfie highlights combinations, common transitions, and recent frequencies without claiming authority."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => {
              setStartDate("");
              setEndDate("");
            }}>
              All time
            </Button>
            <Button variant="outline" onClick={() => {
              setStartDate(getQuickRange(7));
              setEndDate(getLocalDateString());
            }}>
              Last 7 days
            </Button>
            <Button variant="outline" onClick={() => {
              setStartDate(getQuickRange(30));
              setEndDate(getLocalDateString());
            }}>
              Last 30 days
            </Button>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-11 rounded-full border border-[color:var(--border-strong)] bg-white px-4 text-sm text-slate-700 outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-11 rounded-full border border-[color:var(--border-strong)] bg-white px-4 text-sm text-slate-700 outline-none"
            />
          </div>
        }
      />

      {!logs.length ? (
        <EmptyState
          title="Patterns need real logs."
          copy="Once you have a few saved states, Elfie starts describing combinations, transitions, and recent frequencies."
        />
      ) : !summary.filteredLogs.length ? (
        <EmptyState
          title="No logs fall inside this date range."
          copy="Adjust the filters to bring logs back into scope."
        />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-3">
            {summary.descriptiveSummaries.map((statement) => (
              <Card key={statement}>
                <CardHeader>
                  <CardDescription>Summary</CardDescription>
                  <CardTitle className="text-[1.7rem] leading-tight">{statement}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card>
              <CardHeader>
                <CardDescription>Recurring combinations</CardDescription>
                <CardTitle>Repeated pairings of attention, texture, and tone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.recurringCombinations.map((combination) => (
                  <div key={combination.key} className="surface-soft p-4">
                    <p className="font-medium text-slate-900">{combination.statement}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      {combination.count} matching logs in the current range.
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Common transitions</CardDescription>
                <CardTitle>What tends to follow what</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.transitions.length ? (
                  summary.transitions.map((transition) => (
                    <div key={transition.key} className="surface-soft p-4">
                      <p className="font-medium text-slate-900">{transition.statement}</p>
                      <p className="mt-2 text-sm text-slate-500">
                        {transition.count} transitions in sequence.
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    More than one log is needed before transitions can be described.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardDescription>Recent frequencies</CardDescription>
              <CardTitle>What appears most often right now</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summary.recentFrequencies.map((frequency) => (
                <div key={`${frequency.kind}-${frequency.label}`} className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {frequency.kind.replace("-", " ")}
                  </p>
                  <p className="mt-3 font-medium text-slate-900">{frequency.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{frequency.count} logs</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
