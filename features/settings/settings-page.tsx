"use client";

import { startTransition, useState } from "react";
import { ShieldCheck, Sparkles, Trash2 } from "lucide-react";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { clearAllLocalData } from "@/db/log-service";
import { useAllLogs } from "@/hooks/use-logs";
import { useSettings } from "@/hooks/use-settings";
import { exportFormats, type AccentTheme, type ExportFormat } from "@/types/elvyx";

const accentThemeLabels: Record<AccentTheme, string> = {
  lavender: "Lavender",
  "soft-pink": "Soft pink",
};

const exportFormatLabels: Record<ExportFormat, string> = {
  json: "JSON",
  csv: "CSV",
  markdown: "Markdown",
  "notion-markdown": "Notion Markdown",
  backup: "Full backup",
};

export function SettingsPage({ aiAvailable = false }: { aiAvailable?: boolean }) {
  const { settings, updateSettings } = useSettings();
  const logs = useAllLogs();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  function updateSetting(
    nextSettings: Partial<Pick<typeof settings, "accentTheme" | "defaultExportFormat" | "reducedMotion" | "aiEnabled">>,
    message: string,
  ) {
    startTransition(() => {
      void updateSettings(nextSettings)
        .then(() => setStatusMessage(message))
        .catch(() => setStatusMessage("That setting could not be saved locally."));
    });
  }

  async function handleClearAllData() {
    try {
      await clearAllLocalData();
      setStatusMessage("All local data was cleared. Elfie is back to its default local state.");
    } catch {
      setStatusMessage("Local data could not be cleared.");
    }
  }

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Settings"
        title="Keep the defaults calm."
        copy="Appearance, motion, export preference, AI, and optional Google Drive sync remain under your control."
      />

      {statusMessage ? (
        <div className="surface-soft px-5 py-4 text-sm text-slate-600">{statusMessage}</div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardDescription>Appearance</CardDescription>
            <CardTitle>Accent and motion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Accent theme</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  Object.keys(accentThemeLabels) as AccentTheme[]
                ).map((theme) => {
                  const isActive = settings.accentTheme === theme;

                  return (
                    <button
                      key={theme}
                      type="button"
                      onClick={() =>
                        updateSetting(
                          { accentTheme: theme },
                          `Accent theme updated to ${accentThemeLabels[theme]}.`,
                        )
                      }
                      className={`rounded-lg border px-4 py-4 text-left transition ${
                        isActive
                          ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                          : "border-[color:var(--border)] bg-white hover:border-[color:var(--accent)]"
                      }`}
                    >
                      <p className="font-medium text-slate-900">{accentThemeLabels[theme]}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {theme === "lavender"
                          ? "Quiet lavender ink with a softer bloom."
                          : "A warmer blush accent with the same light surface."}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
              <div className="space-y-1">
                <p className="font-medium text-slate-900">Reduced motion</p>
                <p className="text-sm leading-6 text-slate-500">
                  Keep animation nearly still across the interface.
                </p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) =>
                  updateSetting(
                    { reducedMotion: checked },
                    checked ? "Reduced motion enabled." : "Reduced motion disabled.",
                  )
                }
              />
            </div>

            <p className="text-sm text-slate-500">Light-only is intentional in v1.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Export preferences</CardDescription>
            <CardTitle>Choose the default export shape</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {exportFormats.map((format) => {
              const isActive = settings.defaultExportFormat === format;

              return (
                <button
                  key={format}
                  type="button"
                  onClick={() =>
                    updateSetting(
                      { defaultExportFormat: format },
                      `${exportFormatLabels[format]} is now the default export.`,
                    )
                  }
                  className={`rounded-lg border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                      : "border-[color:var(--border)] bg-white hover:border-[color:var(--accent)]"
                  }`}
                >
                  <p className="font-medium text-slate-900">
                    {exportFormatLabels[format]}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {format === "backup"
                      ? "Versioned restore format with settings and all logs."
                      : "Quick export for reading or external use."}
                  </p>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DriveSyncPanel />

        <Card>
          <CardHeader>
            <CardDescription>AI features</CardDescription>
            <CardTitle>Optional and server-backed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-4">
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-medium text-slate-900">
                  <Sparkles className="h-4 w-4 text-[color:var(--accent-strong)]" />
                  Enable AI actions
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  Reflections stay brief and optional. Core logging still works offline.
                </p>
              </div>
              <Switch
                checked={settings.aiEnabled && aiAvailable}
                disabled={!aiAvailable}
                onCheckedChange={(checked) =>
                  updateSetting(
                    { aiEnabled: checked },
                    checked ? "AI actions enabled." : "AI actions disabled.",
                  )
                }
              />
            </div>
            <div className="surface-soft flex items-start gap-3 p-4 text-sm leading-6 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[color:var(--accent-strong)]" />
              <p>
                {aiAvailable
                  ? "AI is available on the server, but only runs when you explicitly ask for it."
                  : "AI is unavailable until OPENAI_API_KEY is configured on the server."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Local data</CardDescription>
            <CardTitle>{logs.length} logs currently stored on this device</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-500">
            <p>
              Elfie stores logs in IndexedDB and keeps all non-AI features available without
              sign-in.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Clear all local data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear all local data?</DialogTitle>
                  <DialogDescription>
                    This removes every log and resets local settings. If you want a safety net,
                    export a full backup first.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleClearAllData}>
                    Clear everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
