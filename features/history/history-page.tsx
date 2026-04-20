"use client";

import { useState } from "react";
import { Filter } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateHeading, formatTimeLabel, isWithinDateRange } from "@/lib/date";
import { useAllLogs } from "@/hooks/use-logs";
import { normalizeFieldValue } from "@/features/logging/schemas";

type FilterField =
  | "attentionMode"
  | "mentalTexture"
  | "emotionalTone"
  | "bodySignal";

const filterFieldLabels: Record<FilterField, string> = {
  attentionMode: "Attention",
  mentalTexture: "Texture",
  emotionalTone: "Tone",
  bodySignal: "Body",
};

export function HistoryPage() {
  const logs = useAllLogs();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [visibleCount, setVisibleCount] = useState(40);
  const [selectedFilters, setSelectedFilters] = useState<
    Partial<Record<FilterField, string>>
  >({});

  const filteredLogs = logs.filter((log) => {
    if (!isWithinDateRange(log.dateLocal, startDate || undefined, endDate || undefined)) {
      return false;
    }

    return (Object.entries(selectedFilters) as [FilterField, string | undefined][])
      .every(([field, value]) => {
        if (!value) {
          return true;
        }

        return normalizeFieldValue(log[field]) === normalizeFieldValue(value);
      });
  });
  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const groupedLogs = visibleLogs.reduce<Record<string, typeof visibleLogs>>(
    (accumulator, log) => {
      accumulator[log.dateLocal] ??= [];
      accumulator[log.dateLocal].push(log);

      return accumulator;
    },
    {},
  );

  function toggleFilter(field: FilterField, value: string) {
    setVisibleCount(40);
    setSelectedFilters((current) => ({
      ...current,
      [field]: current[field] === value ? undefined : value,
    }));
  }

  function getFieldOptions(field: FilterField) {
    return [...new Set(logs.map((log) => log[field]).filter(Boolean))].sort();
  }

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="History"
        title="Every saved line, grouped by date."
        copy="History stays fast and readable: date range filters, quick value filters, canonical lines, and structured details on demand."
        actions={
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setVisibleCount(40);
                setStartDate(event.target.value);
              }}
              className="h-11 rounded-lg border border-[color:var(--border-strong)] bg-white px-4 text-sm text-slate-700 outline-none"
            />
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setVisibleCount(40);
                setEndDate(event.target.value);
              }}
              className="h-11 rounded-lg border border-[color:var(--border-strong)] bg-white px-4 text-sm text-slate-700 outline-none"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                  Value filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[360px] space-y-5">
                {(Object.keys(filterFieldLabels) as FilterField[]).map((field) => (
                  <div key={field} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                      {filterFieldLabels[field]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getFieldOptions(field).map((value) => (
                        <button
                          key={`${field}-${value}`}
                          type="button"
                          onClick={() => toggleFilter(field, value)}
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                            selectedFilters[field] === value
                              ? "bg-[color:var(--accent-soft)] text-slate-900"
                              : "bg-[color:var(--surface-muted)] text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        }
      />

      {Object.values(selectedFilters).some(Boolean) ? (
        <div className="flex flex-wrap gap-2">
          {(Object.entries(selectedFilters) as [FilterField, string | undefined][])
            .filter(([, value]) => value)
            .map(([field, value]) => (
              <button
                key={`${field}-${value}`}
                type="button"
                onClick={() => toggleFilter(field, value!)}
                className="pill-chip"
              >
                {filterFieldLabels[field]}: {value}
              </button>
            ))}
        </div>
      ) : null}

      {!logs.length ? (
        <EmptyState
          title="History will appear after the first save."
          copy="Once a log is stored, this page groups entries by date and keeps the canonical line easy to scan."
        />
      ) : !filteredLogs.length ? (
        <EmptyState
          title="No logs match the current filters."
          copy="Try widening the date range or clearing one of the selected value filters."
        />
      ) : (
        <>
          {Object.entries(groupedLogs).map(([dateLocal, logsForDate]) => (
            <Card key={dateLocal}>
              <CardHeader>
                <CardDescription>{formatDateHeading(dateLocal)}</CardDescription>
                <CardTitle>{logsForDate.length} logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logsForDate.map((log) => (
                  <details
                    key={log.id}
                    className="surface-soft overflow-hidden"
                  >
                    <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 marker:hidden md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{log.canonicalLine}</p>
                        <p className="text-sm text-slate-500">
                          Logged at {formatTimeLabel(log.createdAt)}
                        </p>
                      </div>
                      <span className="pill-chip">Log {log.daySequence}</span>
                    </summary>
                    <div className="hairline" />
                    <div className="grid gap-4 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Energy
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{log.energyRaw}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Mental texture
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{log.mentalTexture}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Attention mode
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{log.attentionMode}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Emotional tone
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{log.emotionalTone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Dominant thought vector
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          {log.dominantThoughtVector}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-normal text-slate-400">
                          Body signal
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{log.bodySignal}</p>
                      </div>
                    </div>
                  </details>
                ))}
              </CardContent>
            </Card>
          ))}

          {filteredLogs.length > visibleCount ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((count) => count + 40)}>
                Load more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
