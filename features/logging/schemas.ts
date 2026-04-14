import { z } from "zod";

import {
  defaultSettings,
  ELVYX_BACKUP_VERSION,
  type ElvyxLog,
  type ElvyxSettings,
} from "@/types/elvyx";

const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD.");

const isoDateTimeSchema = z.string().datetime({ offset: true });

const trimmedField = (label: string, max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, `${label} is required.`)
    .refine(
      (value) => value.length <= max,
      `${label} must be ${max} characters or fewer.`,
    );

const optionalTrimmedField = (label: string, max: number) =>
  z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine(
      (value) => value.length <= max,
      `${label} must be ${max} characters or fewer.`,
    )
    .transform((value) => (value.length ? value : undefined));

export const energyRawSchema = z
  .string()
  .transform((value) => value.trim())
  .refine(
    (value) => /^(?:10(?:\.0)?|[0-9](?:\.\d)?)$/.test(value),
    "Energy must be a number from 0 to 10, with at most one decimal place.",
  );

export const createLogInputSchema = z.object({
  energyRaw: energyRawSchema,
  mentalTexture: trimmedField("Mental texture", 32),
  attentionMode: trimmedField("Attention mode", 32),
  emotionalTone: trimmedField("Emotional tone", 32),
  dominantThoughtVector: trimmedField("Dominant thought vector", 80),
  bodySignal: optionalTrimmedField("Body signal", 32),
});

export const elvyxLogSchema = z.object({
  id: z.string().uuid(),
  createdAt: isoDateTimeSchema,
  dateLocal: localDateSchema,
  daySequence: z.number().int().positive(),
  canonicalLine: z.string().min(1),
  energyRaw: energyRawSchema,
  energyValue: z.number().min(0).max(10),
  mentalTexture: trimmedField("Mental texture", 32),
  attentionMode: trimmedField("Attention mode", 32),
  emotionalTone: trimmedField("Emotional tone", 32),
  dominantThoughtVector: trimmedField("Dominant thought vector", 80),
  bodySignal: trimmedField("Body signal", 32),
});

export const elvyxSettingsSchema = z.object({
  id: z.literal(defaultSettings.id),
  accentTheme: z.enum(["lavender", "soft-pink"]),
  reducedMotion: z.boolean(),
  defaultExportFormat: z.enum([
    "json",
    "csv",
    "markdown",
    "notion-markdown",
    "backup",
  ]),
  aiEnabled: z.boolean(),
  updatedAt: isoDateTimeSchema,
});

export const exportableSettingsSchema = elvyxSettingsSchema.omit({ id: true });

export const backupSchema = z.object({
  app: z.literal("elfie"),
  version: z.literal(ELVYX_BACKUP_VERSION),
  exportedAt: isoDateTimeSchema,
  settings: exportableSettingsSchema,
  logs: z.array(elvyxLogSchema),
});

export const aiInsightRequestSchema = z.object({
  mode: z.enum(["reflect", "pattern", "tiny-next-move"]),
  logs: z.array(elvyxLogSchema).min(1).max(24),
  localeDate: localDateSchema,
});

export const aiInsightModelSchema = z.object({
  title: z.string().trim().min(1).max(72),
  body: z.string().trim().min(1).max(280),
  caution: z.string().trim().max(120).nullable().optional(),
});

export function parseEnergyValue(energyRaw: string) {
  return Number.parseFloat(energyRaw);
}

export function normalizeFieldValue(value: string) {
  return value.trim().toLowerCase();
}

export function makeCanonicalLogLine(log: {
  dateLocal: string;
  daySequence: number;
  energyRaw: string;
  mentalTexture: string;
  attentionMode: string;
  emotionalTone: string;
  dominantThoughtVector: string;
  bodySignal?: string;
}) {
  const bodySignal = log.bodySignal?.trim() || "none";

  return `${log.dateLocal} | Log ${log.daySequence} | E:${log.energyRaw} | T:${log.mentalTexture} | A:${log.attentionMode} | M:${log.emotionalTone} | D:${log.dominantThoughtVector} | B:${bodySignal}`;
}

export function coerceStructuredLog(log: ElvyxLog) {
  return elvyxLogSchema.parse(log);
}

export function coerceSettings(settings: ElvyxSettings) {
  return elvyxSettingsSchema.parse(settings);
}
