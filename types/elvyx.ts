export const SETTINGS_RECORD_ID = "app-settings";
export const ELVYX_BACKUP_VERSION = 1;

export const accentThemes = ["lavender", "matcha", "soft-pink"] as const;
export const exportFormats = [
  "json",
  "csv",
  "markdown",
  "notion-markdown",
  "backup",
] as const;
export const insightModes = [
  "reflect",
  "pattern",
  "tiny-next-move",
  "deep-analysis",
] as const;

export type AccentTheme = (typeof accentThemes)[number];
export type ExportFormat = (typeof exportFormats)[number];
export type InsightMode = (typeof insightModes)[number];
export type AiModelTier = "light" | "pattern" | "deep";
export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "signed-out"
  | "conflict"
  | "error";

export interface ElvyxLog {
  id: string;
  createdAt: string;
  dateLocal: string;
  daySequence: number;
  canonicalLine: string;
  energyRaw: string;
  energyValue: number;
  mentalTexture: string;
  attentionMode: string;
  emotionalTone: string;
  dominantThoughtVector: string;
  bodySignal: string;
}

export interface StoredElvyxLog extends ElvyxLog {
  mentalTextureNormalized: string;
  attentionModeNormalized: string;
  emotionalToneNormalized: string;
  dominantThoughtVectorNormalized: string;
  bodySignalNormalized: string;
}

export interface ElvyxSettings {
  id: typeof SETTINGS_RECORD_ID;
  accentTheme: AccentTheme;
  reducedMotion: boolean;
  defaultExportFormat: ExportFormat;
  aiEnabled: boolean;
  updatedAt: string;
}

export interface SyncMeta {
  id: "drive-sync";
  driveFileId?: string | null;
  lastRemoteModifiedTime?: string | null;
  lastSyncHash?: string | null;
  lastSyncedAt?: string | null;
  lastDeviceId?: string | null;
  syncStatus: SyncStatus;
  statusMessage?: string | null;
}

export interface ElvyxBackupV1 {
  app: "elfie";
  version: typeof ELVYX_BACKUP_VERSION;
  exportedAt: string;
  settings: Omit<ElvyxSettings, "id">;
  logs: ElvyxLog[];
}

export interface ElfieSyncDocumentV1 {
  syncVersion: 1;
  updatedAt: string;
  deviceId: string;
  backupHash: string;
  backup: ElvyxBackupV1;
}

export interface AiInsightRequest {
  mode: InsightMode;
  logs: ElvyxLog[];
  localeDate: string;
  patternSummaries?: string[];
}

export type AiInsightUnavailableReason =
  | "missing_api_key"
  | "disabled"
  | "invalid_request";

export interface AiInsightSuccessResponse {
  available: true;
  mode: InsightMode;
  title: string;
  body: string;
  bullets?: string[];
  modelTier?: AiModelTier;
  tone: "calm";
  caution?: string | null;
}

export interface AiInsightUnavailableResponse {
  available: false;
  reason: AiInsightUnavailableReason;
}

export type AiInsightResponse =
  | AiInsightSuccessResponse
  | AiInsightUnavailableResponse;

export const defaultSettings: ElvyxSettings = {
  id: SETTINGS_RECORD_ID,
  accentTheme: "matcha",
  reducedMotion: false,
  defaultExportFormat: "backup",
  aiEnabled: false,
  updatedAt: new Date(0).toISOString(),
};

export const defaultSyncMeta: SyncMeta = {
  id: "drive-sync",
  driveFileId: null,
  lastRemoteModifiedTime: null,
  lastSyncHash: null,
  lastSyncedAt: null,
  lastDeviceId: null,
  syncStatus: "signed-out",
  statusMessage: null,
};
