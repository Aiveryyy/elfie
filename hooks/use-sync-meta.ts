"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/db/app-db";
import { saveSyncMeta } from "@/db/log-service";
import { defaultSyncMeta } from "@/types/elvyx";

export function useSyncMeta() {
  const syncMeta =
    useLiveQuery(() => db.syncMeta.get(defaultSyncMeta.id), [], defaultSyncMeta) ??
    defaultSyncMeta;

  return {
    syncMeta,
    updateSyncMeta: saveSyncMeta,
  };
}
