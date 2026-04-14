"use client";

import Dexie from "dexie";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db/app-db";
import { toPublicLog } from "@/db/log-service";
import { compareLogsDescending, getLocalDateString } from "@/lib/date";

export function useAllLogs() {
  return (
    useLiveQuery(
      async () => {
        const logs = await db.logs.toArray();

        return logs.map(toPublicLog).sort(compareLogsDescending);
      },
      [],
      [],
    ) ?? []
  );
}

export function useRecentLogs(limit = 8) {
  const logs = useAllLogs();

  return logs.slice(0, limit);
}

export function useTodayLogCount(dateLocal = getLocalDateString()) {
  return (
    useLiveQuery(
      () =>
        db.logs
          .where("[dateLocal+daySequence]")
          .between([dateLocal, Dexie.minKey], [dateLocal, Dexie.maxKey])
          .count(),
      [dateLocal],
      0,
    ) ?? 0
  );
}
