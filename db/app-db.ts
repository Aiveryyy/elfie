"use client";

import Dexie, { type Table } from "dexie";

import type { ElvyxSettings, StoredElvyxLog } from "@/types/elvyx";

export class ElvyxDatabase extends Dexie {
  logs!: Table<StoredElvyxLog, string>;
  settings!: Table<ElvyxSettings, string>;

  constructor() {
    super("elfie");

    this.version(1).stores({
      logs: "&id,[dateLocal+daySequence],dateLocal,createdAt,energyValue,mentalTextureNormalized,attentionModeNormalized,emotionalToneNormalized,dominantThoughtVectorNormalized,bodySignalNormalized",
      settings: "&id,updatedAt",
    });
  }
}

export const db = new ElvyxDatabase();
