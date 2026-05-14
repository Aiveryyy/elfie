import { z } from "zod";

import { syncDocumentSchema } from "@/features/logging/schemas";
import type {
  ElfieSyncDocumentV1,
  ElvyxBackupV1,
  SyncMeta,
} from "@/types/elvyx";

export const SYNC_FILE_NAME = "elfie-sync-v1.json";
export const SYNC_DOCUMENT_VERSION = 1;

export type SyncDocument = z.infer<typeof syncDocumentSchema>;
export type SyncResolution = "noop" | "pull" | "push" | "conflict";

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

export function hashString(value: string) {
  let first = 0xdeadbeef;
  let second = 0x41c6ce57;

  for (let index = 0; index < value.length; index += 1) {
    const character = value.charCodeAt(index);
    first = Math.imul(first ^ character, 2654435761);
    second = Math.imul(second ^ character, 1597334677);
  }

  first =
    Math.imul(first ^ (first >>> 16), 2246822507) ^
    Math.imul(second ^ (second >>> 13), 3266489909);
  second =
    Math.imul(second ^ (second >>> 16), 2246822507) ^
    Math.imul(first ^ (first >>> 13), 3266489909);

  return `${(second >>> 0).toString(16).padStart(8, "0")}${(first >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

export function getBackupComparablePayload(backup: ElvyxBackupV1) {
  return {
    app: backup.app,
    version: backup.version,
    settings: backup.settings,
    logs: backup.logs,
  };
}

export function createBackupHash(backup: ElvyxBackupV1) {
  return hashString(stableStringify(getBackupComparablePayload(backup)));
}

export function createSyncDocument(input: {
  backup: ElvyxBackupV1;
  deviceId: string;
  updatedAt?: string;
}): ElfieSyncDocumentV1 {
  return syncDocumentSchema.parse({
    syncVersion: SYNC_DOCUMENT_VERSION,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    deviceId: input.deviceId,
    backupHash: createBackupHash(input.backup),
    backup: input.backup,
  });
}

export function parseSyncDocument(input: unknown): ElfieSyncDocumentV1 {
  return syncDocumentSchema.parse(input);
}

export function resolveSyncState(input: {
  localHash: string;
  localLogCount: number;
  remoteHash: string | null;
  lastSyncHash: string | null | undefined;
}): SyncResolution {
  if (!input.remoteHash) {
    return input.localLogCount > 0 ? "push" : "noop";
  }

  if (input.localHash === input.remoteHash) {
    return "noop";
  }

  if (!input.lastSyncHash) {
    return input.localLogCount === 0 ? "pull" : "conflict";
  }

  const localChanged = input.localHash !== input.lastSyncHash;
  const remoteChanged = input.remoteHash !== input.lastSyncHash;

  if (localChanged && remoteChanged) {
    return "conflict";
  }

  if (remoteChanged) {
    return "pull";
  }

  if (localChanged) {
    return "push";
  }

  return "noop";
}

export function getSyncStatusLabel(meta: SyncMeta) {
  if (meta.statusMessage) {
    return meta.statusMessage;
  }

  switch (meta.syncStatus) {
    case "syncing":
      return "Syncing with Google Drive.";
    case "synced":
      return meta.lastSyncedAt
        ? `Synced at ${new Date(meta.lastSyncedAt).toLocaleString()}.`
        : "Synced with Google Drive.";
    case "conflict":
      return "Local and Drive data both changed.";
    case "error":
      return "Google Drive sync needs attention.";
    case "signed-out":
      return "Sign in with Google to sync through hidden Drive app data.";
    case "idle":
    default:
      return "Google Drive sync is ready.";
  }
}
