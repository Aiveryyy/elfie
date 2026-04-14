import { compareLogsAscending, getLocalDateString } from "@/lib/date";
import { createBackupDocument } from "@/db/log-service";
import type {
  ElvyxLog,
  ElvyxSettings,
  ExportFormat,
} from "@/types/elvyx";

function escapeCsvCell(value: string | number) {
  const raw = String(value);

  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }

  return raw;
}

function getSortedLogs(logs: ElvyxLog[]) {
  return [...logs].sort(compareLogsAscending);
}

export function exportLogsAsJson(logs: ElvyxLog[]) {
  return JSON.stringify(getSortedLogs(logs), null, 2);
}

export function exportLogsAsCsv(logs: ElvyxLog[]) {
  const header = [
    "dateLocal",
    "daySequence",
    "createdAt",
    "canonicalLine",
    "energyRaw",
    "energyValue",
    "mentalTexture",
    "attentionMode",
    "emotionalTone",
    "dominantThoughtVector",
    "bodySignal",
  ];

  const rows = getSortedLogs(logs).map((log) =>
    [
      log.dateLocal,
      log.daySequence,
      log.createdAt,
      log.canonicalLine,
      log.energyRaw,
      log.energyValue,
      log.mentalTexture,
      log.attentionMode,
      log.emotionalTone,
      log.dominantThoughtVector,
      log.bodySignal,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}

export function exportLogsAsMarkdown(logs: ElvyxLog[]) {
  const grouped = getSortedLogs(logs).reduce<Record<string, ElvyxLog[]>>(
    (accumulator, log) => {
      accumulator[log.dateLocal] ??= [];
      accumulator[log.dateLocal].push(log);

      return accumulator;
    },
    {},
  );

  return Object.entries(grouped)
    .map(([dateLocal, logsForDate]) => {
      const rows = logsForDate
        .map(
          (log) =>
            `- ${log.canonicalLine}\n  - Created: ${log.createdAt}\n  - Details: Energy ${log.energyRaw}, texture ${log.mentalTexture}, attention ${log.attentionMode}, tone ${log.emotionalTone}, thought ${log.dominantThoughtVector}, body ${log.bodySignal}`,
        )
        .join("\n");

      return `## ${dateLocal}\n${rows}`;
    })
    .join("\n\n");
}

export function exportLogsAsNotionMarkdown(logs: ElvyxLog[]) {
  return getSortedLogs(logs)
    .map(
      (log) =>
        `- **${log.dateLocal} - Log ${log.daySequence}**\n  - Canonical: ${log.canonicalLine}\n  - Energy: ${log.energyRaw}\n  - Mental Texture: ${log.mentalTexture}\n  - Attention Mode: ${log.attentionMode}\n  - Emotional Tone: ${log.emotionalTone}\n  - Dominant Thought Vector: ${log.dominantThoughtVector}\n  - Body Signal: ${log.bodySignal}`,
    )
    .join("\n");
}

export function exportFullBackup(logs: ElvyxLog[], settings: ElvyxSettings) {
  return JSON.stringify(createBackupDocument({ logs, settings }), null, 2);
}

export function getExportFilename(format: ExportFormat, today = getLocalDateString()) {
  const base = `elfie-${today}`;

  switch (format) {
    case "json":
      return `${base}.json`;
    case "csv":
      return `${base}.csv`;
    case "markdown":
      return `${base}.md`;
    case "notion-markdown":
      return `${base}-notion.md`;
    case "backup":
      return `${base}-backup-v1.json`;
  }
}

export function getExportMimeType(format: ExportFormat) {
  switch (format) {
    case "csv":
      return "text/csv";
    case "json":
    case "backup":
      return "application/json";
    case "markdown":
    case "notion-markdown":
      return "text/markdown";
  }
}

export function serializeExport(
  format: ExportFormat,
  logs: ElvyxLog[],
  settings: ElvyxSettings,
) {
  switch (format) {
    case "json":
      return exportLogsAsJson(logs);
    case "csv":
      return exportLogsAsCsv(logs);
    case "markdown":
      return exportLogsAsMarkdown(logs);
    case "notion-markdown":
      return exportLogsAsNotionMarkdown(logs);
    case "backup":
      return exportFullBackup(logs, settings);
  }
}

