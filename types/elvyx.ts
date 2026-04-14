export const SETTINGS_RECORD_ID = "app-settings";
export const ELVYX_BACKUP_VERSION = 1;

export const accentThemes = ["lavender", "soft-pink"] as const;
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
] as const;

export type AccentTheme = (typeof accentThemes)[number];
export type ExportFormat = (typeof exportFormats)[number];
export type InsightMode = (typeof insightModes)[number];

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

export interface ElvyxBackupV1 {
  app: "elfie";
  version: typeof ELVYX_BACKUP_VERSION;
  exportedAt: string;
  settings: Omit<ElvyxSettings, "id">;
  logs: ElvyxLog[];
}

export interface AiInsightRequest {
  mode: InsightMode;
  logs: ElvyxLog[];
  localeDate: string;
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
  accentTheme: "lavender",
  reducedMotion: false,
  defaultExportFormat: "backup",
  aiEnabled: false,
  updatedAt: new Date(0).toISOString(),
};
