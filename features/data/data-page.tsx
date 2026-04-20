"use client";

import { useRef, useState } from "react";

import { PageIntro } from "@/components/layout/page-intro";
import { DriveSyncPanel } from "@/components/sync/drive-sync-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadTextFile } from "@/lib/download";
import {
  getExportFilename,
  getExportMimeType,
  serializeExport,
} from "@/lib/exporters";
import { getImportErrorMessage, parseBackupJson } from "@/lib/importers";
import { replaceAllData } from "@/db/log-service";
import { useAllLogs } from "@/hooks/use-logs";
import { useSettings } from "@/hooks/use-settings";
import type { ElvyxBackupV1, ExportFormat } from "@/types/elvyx";

const formatDescriptions: Record<ExportFormat, string> = {
  json: "Structured logs only, exported as a readable JSON array.",
  csv: "Flat file for spreadsheet workflows.",
  markdown: "Date-grouped Markdown with canonical lines and details.",
  "notion-markdown": "Simpler Markdown formatting that pastes cleanly into Notion.",
  backup: "Stable versioned backup with settings and all logs for restore.",
};

export function DataPage() {
  const logs = useAllLogs();
  const { settings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingBackup, setPendingBackup] = useState<ElvyxBackupV1 | null>(null);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  function handleExport(format: ExportFormat) {
    const content = serializeExport(format, logs, settings);

    downloadTextFile({
      filename: getExportFilename(format),
      content,
      mimeType: getExportMimeType(format),
    });
    setStatusMessage(`${formatDescriptions[format]} Download started.`);
  }

  async function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const backup = parseBackupJson(text);

      setPendingBackup(backup);
      setIsRestoreOpen(true);
      setStatusMessage(null);
    } catch (error) {
      setPendingBackup(null);
      setStatusMessage(getImportErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function confirmRestore() {
    if (!pendingBackup) {
      return;
    }

    try {
      await replaceAllData(pendingBackup);
      setStatusMessage("Backup restored successfully.");
      setPendingBackup(null);
      setIsRestoreOpen(false);
    } catch (error) {
      setStatusMessage(getImportErrorMessage(error));
      setIsRestoreOpen(false);
    }
  }

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Export / Import"
        title="Keep your data portable."
        copy="Plain exports are one-way for reading and external use. Restore only accepts the stable full-backup format so numbering and structure stay trustworthy."
        actions={
          <>
            <Button onClick={() => handleExport(settings.defaultExportFormat)}>
              Quick export: {settings.defaultExportFormat}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Restore backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleFileSelection}
              className="hidden"
            />
          </>
        }
      />

      {statusMessage ? (
        <div className="surface-soft px-5 py-4 text-sm text-slate-600">{statusMessage}</div>
      ) : null}

      <DriveSyncPanel />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {(Object.keys(formatDescriptions) as ExportFormat[]).map((format) => (
          <Card key={format}>
            <CardHeader>
              <CardDescription>{format}</CardDescription>
              <CardTitle>{formatDescriptions[format]}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant={format === settings.defaultExportFormat ? "default" : "outline"}
                onClick={() => handleExport(format)}
              >
                Export {format}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardDescription>Restore rules</CardDescription>
          <CardTitle>Only versioned full backups can be imported.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
          <p>Restore validates schema version, duplicate ids, canonical line consistency, and per-day numbering before replacing local data.</p>
          <p>CSV and Markdown exports are intentionally not round-trippable.</p>
        </CardContent>
      </Card>

      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore this backup?</DialogTitle>
            <DialogDescription>
              Restore replaces the current local dataset with the selected full backup.
            </DialogDescription>
          </DialogHeader>
          {pendingBackup ? (
            <div className="space-y-3 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-slate-600">
              <p>
                Exported at <strong>{pendingBackup.exportedAt}</strong>
              </p>
              <p>
                Contains <strong>{pendingBackup.logs.length}</strong> logs and the stored local
                preferences.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={confirmRestore}>Replace local data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
