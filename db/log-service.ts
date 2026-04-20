"use client";

import Dexie from "dexie";

import { db } from "@/db/app-db";
import { compareLogsAscending, getLocalDateString } from "@/lib/date";
import {
  backupSchema,
  coerceSettings,
  createLogInputSchema,
  elvyxLogSchema,
  exportableSettingsSchema,
  makeCanonicalLogLine,
  normalizeFieldValue,
  parseEnergyValue,
} from "@/features/logging/schemas";
import {
  defaultSettings,
  defaultSyncMeta,
  SETTINGS_RECORD_ID,
  type ElvyxBackupV1,
  type ElvyxLog,
  type ElvyxSettings,
  type StoredElvyxLog,
  type SyncMeta,
} from "@/types/elvyx";

export async function getSettings() {
  const stored = await db.settings.get(SETTINGS_RECORD_ID);

  return stored ?? defaultSettings;
}

export async function saveSettings(
  partialSettings: Partial<Omit<ElvyxSettings, "id" | "updatedAt">>,
) {
  const current = await getSettings();
  const nextSettings = coerceSettings({
    ...current,
    ...partialSettings,
    id: SETTINGS_RECORD_ID,
    updatedAt: new Date().toISOString(),
  });

  await db.settings.put(nextSettings);

  return nextSettings;
}

export async function clearAllLocalData() {
  await db.transaction("rw", db.logs, db.settings, db.syncMeta, async () => {
    await db.logs.clear();
    await db.settings.clear();
    await db.syncMeta.clear();
  });
}

export async function getSyncMeta() {
  const stored = await db.syncMeta.get(defaultSyncMeta.id);

  return stored ?? defaultSyncMeta;
}

export async function saveSyncMeta(
  partialSyncMeta: Partial<Omit<SyncMeta, "id">>,
) {
  const current = await getSyncMeta();
  const nextSyncMeta = {
    ...current,
    ...partialSyncMeta,
    id: defaultSyncMeta.id,
  };

  await db.syncMeta.put(nextSyncMeta);

  return nextSyncMeta;
}

function toStoredLog(log: ElvyxLog): StoredElvyxLog {
  return {
    ...log,
    mentalTextureNormalized: normalizeFieldValue(log.mentalTexture),
    attentionModeNormalized: normalizeFieldValue(log.attentionMode),
    emotionalToneNormalized: normalizeFieldValue(log.emotionalTone),
    dominantThoughtVectorNormalized: normalizeFieldValue(
      log.dominantThoughtVector,
    ),
    bodySignalNormalized: normalizeFieldValue(log.bodySignal),
  };
}

export function toPublicLog(log: StoredElvyxLog): ElvyxLog {
  return {
    id: log.id,
    createdAt: log.createdAt,
    dateLocal: log.dateLocal,
    daySequence: log.daySequence,
    canonicalLine: log.canonicalLine,
    energyRaw: log.energyRaw,
    energyValue: log.energyValue,
    mentalTexture: log.mentalTexture,
    attentionMode: log.attentionMode,
    emotionalTone: log.emotionalTone,
    dominantThoughtVector: log.dominantThoughtVector,
    bodySignal: log.bodySignal,
  };
}

async function getNextDaySequence(dateLocal: string) {
  const lastLogForDay = await db.logs
    .where("[dateLocal+daySequence]")
    .between([dateLocal, Dexie.minKey], [dateLocal, Dexie.maxKey])
    .last();

  return (lastLogForDay?.daySequence ?? 0) + 1;
}

export async function createLogEntry(
  input: Parameters<typeof createLogInputSchema.parse>[0],
  options?: {
    createdAt?: string;
    dateLocal?: string;
  },
) {
  const parsed = createLogInputSchema.parse(input);
  const dateLocal = options?.dateLocal ?? getLocalDateString();
  const createdAt = options?.createdAt ?? new Date().toISOString();
  const daySequence = await getNextDaySequence(dateLocal);
  const bodySignal = parsed.bodySignal ?? "none";

  const log = elvyxLogSchema.parse({
    id: crypto.randomUUID(),
    createdAt,
    dateLocal,
    daySequence,
    canonicalLine: makeCanonicalLogLine({
      dateLocal,
      daySequence,
      energyRaw: parsed.energyRaw,
      mentalTexture: parsed.mentalTexture,
      attentionMode: parsed.attentionMode,
      emotionalTone: parsed.emotionalTone,
      dominantThoughtVector: parsed.dominantThoughtVector,
      bodySignal,
    }),
    energyRaw: parsed.energyRaw,
    energyValue: parseEnergyValue(parsed.energyRaw),
    mentalTexture: parsed.mentalTexture,
    attentionMode: parsed.attentionMode,
    emotionalTone: parsed.emotionalTone,
    dominantThoughtVector: parsed.dominantThoughtVector,
    bodySignal,
  });

  await db.logs.add(toStoredLog(log));

  return log;
}

export function createBackupDocument(input: {
  logs: ElvyxLog[];
  settings: ElvyxSettings;
}): ElvyxBackupV1 {
  const settings = exportableSettingsSchema.parse({
    accentTheme: input.settings.accentTheme,
    reducedMotion: input.settings.reducedMotion,
    defaultExportFormat: input.settings.defaultExportFormat,
    aiEnabled: input.settings.aiEnabled,
    updatedAt: input.settings.updatedAt,
  });

  return backupSchema.parse({
    app: "elfie",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    logs: [...input.logs].sort(compareLogsAscending),
  });
}

export async function replaceAllData(
  backup: ElvyxBackupV1,
  options?: {
    preserveSettingsUpdatedAt?: boolean;
  },
) {
  const parsed = backupSchema.parse(backup);
  const settings = coerceSettings({
    ...defaultSettings,
    ...parsed.settings,
    id: SETTINGS_RECORD_ID,
    updatedAt: options?.preserveSettingsUpdatedAt
      ? parsed.settings.updatedAt
      : new Date().toISOString(),
  });
  const logs = parsed.logs.map((log) => toStoredLog(log));

  await db.transaction("rw", db.logs, db.settings, async () => {
    await db.logs.clear();
    await db.settings.clear();

    if (logs.length) {
      await db.logs.bulkAdd(logs);
    }

    await db.settings.put(settings);
  });
}
