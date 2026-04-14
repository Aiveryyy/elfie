import { ZodError } from "zod";

import { compareLogsAscending } from "@/lib/date";
import {
  backupSchema,
  makeCanonicalLogLine,
  parseEnergyValue,
} from "@/features/logging/schemas";
import type { ElvyxBackupV1 } from "@/types/elvyx";

export class ElvyxImportError extends Error {
  details?: string[];

  constructor(message: string, details?: string[]) {
    super(message);
    this.name = "ElvyxImportError";
    this.details = details;
  }
}

export function validateBackupDocument(input: unknown): ElvyxBackupV1 {
  const backup = backupSchema.parse(input);
  const sortedLogs = [...backup.logs].sort(compareLogsAscending);
  const seenIds = new Set<string>();
  const issues: string[] = [];
  let currentDate = "";
  let expectedSequence = 1;

  for (const log of sortedLogs) {
    if (seenIds.has(log.id)) {
      issues.push(`Duplicate log id detected: ${log.id}.`);
    }

    seenIds.add(log.id);

    if (log.dateLocal !== currentDate) {
      currentDate = log.dateLocal;
      expectedSequence = 1;
    }

    if (log.daySequence !== expectedSequence) {
      issues.push(
        `${log.dateLocal} should contain Log ${expectedSequence}, but the backup has Log ${log.daySequence}.`,
      );
    }

    const expectedCanonicalLine = makeCanonicalLogLine({
      dateLocal: log.dateLocal,
      daySequence: log.daySequence,
      energyRaw: log.energyRaw,
      mentalTexture: log.mentalTexture,
      attentionMode: log.attentionMode,
      emotionalTone: log.emotionalTone,
      dominantThoughtVector: log.dominantThoughtVector,
      bodySignal: log.bodySignal,
    });

    if (log.canonicalLine !== expectedCanonicalLine) {
      issues.push(
        `Canonical line mismatch for ${log.dateLocal} Log ${log.daySequence}.`,
      );
    }

    if (log.energyValue !== parseEnergyValue(log.energyRaw)) {
      issues.push(
        `Energy value mismatch for ${log.dateLocal} Log ${log.daySequence}.`,
      );
    }

    expectedSequence += 1;
  }

  if (issues.length) {
    throw new ElvyxImportError(issues[0] ?? "Backup validation failed.", issues);
  }

  return backup;
}

export function parseBackupJson(text: string) {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new ElvyxImportError(
      "This file could not be parsed as JSON. Export a fresh Elfie backup and try again.",
    );
  }

  return validateBackupDocument(parsedJson);
}

export function getImportErrorMessage(error: unknown) {
  if (error instanceof ElvyxImportError) {
    return error.details?.[0] ?? error.message;
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "This file does not match the Elfie backup schema.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Import failed for an unknown reason.";
}
