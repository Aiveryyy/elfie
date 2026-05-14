"use client";

import Dexie, { type Table } from "dexie";

import type { ElvyxSettings, StoredElvyxLog, SyncMeta } from "@/types/elvyx";

export class ElvyxDatabase extends Dexie {
  logs!: Table<StoredElvyxLog, string>;
  settings!: Table<ElvyxSettings, string>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super("elfie");

    this.version(1).stores({
      logs: "&id,[dateLocal+daySequence],dateLocal,createdAt,energyValue,mentalTextureNormalized,attentionModeNormalized,emotionalToneNormalized,dominantThoughtVectorNormalized,bodySignalNormalized",
      settings: "&id,updatedAt",
    });

    this.version(2).stores({
      logs: "&id,[dateLocal+daySequence],dateLocal,createdAt,energyValue,mentalTextureNormalized,attentionModeNormalized,emotionalToneNormalized,dominantThoughtVectorNormalized,bodySignalNormalized",
      settings: "&id,updatedAt",
      syncMeta: "&id,lastSyncedAt,lastRemoteModifiedTime,syncStatus",
    });
  }
}

export const db = new ElvyxDatabase();
