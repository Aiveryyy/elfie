"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

import { PageIntro } from "@/components/layout/page-intro";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLogEntry } from "@/db/log-service";
import {
  attentionModeOptions,
  bodySignalOptions,
  dominantThoughtExamples,
  emotionalToneOptions,
  loggingStepOrder,
  mentalTextureOptions,
  type LoggingStep,
} from "@/features/logging/constants";
import { energyRawSchema, makeCanonicalLogLine } from "@/features/logging/schemas";
import { useLogWizardStore } from "@/features/logging/store";
import { formatTimeLabel, getLocalDateString } from "@/lib/date";
import { useAllLogs } from "@/hooks/use-logs";

const stepTitles: Record<LoggingStep, string> = {
  energy: "Energy level? (0-10)",
  mentalTexture: "Mental Texture",
  attentionMode: "Attention Mode",
  emotionalTone: "Emotional Tone",
  dominantThoughtVector: "Dominant Thought Vector",
  bodySignal: "Body Signal",
};

const stepDescriptions: Record<LoggingStep, string> = {
  energy: "Numeric input only. Integer or one decimal place.",
  mentalTexture: "Options first, with custom text if the list misses it.",
  attentionMode: "Choose the closest lane of attention or type your own.",
  emotionalTone: "Keep it plain and immediate.",
  dominantThoughtVector: "Short phrase only.",
  bodySignal: "Optional. Skip if nothing stands out.",
};

const stepFieldMap = {
  energy: "energyRaw",
  mentalTexture: "mentalTexture",
  attentionMode: "attentionMode",
  emotionalTone: "emotionalTone",
  dominantThoughtVector: "dominantThoughtVector",
  bodySignal: "bodySignal",
} as const;

function OptionGrid({
  options,
  onSelect,
}: {
  options: readonly string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className="rounded-[1.5rem] border border-[color:var(--border)] bg-white px-4 py-4 text-left text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-[color:var(--surface-muted)] hover:text-slate-900"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function LogPage() {
  const logs = useAllLogs();
  const {
    currentStepIndex,
    draft,
    isSaving,
    lastSavedLog,
    saveError,
    answerStep,
    startSaving,
    finishSaving,
    failSaving,
    reset,
  } = useLogWizardStore();
  const [typedValue, setTypedValue] = useState("");
  const [today] = useState(() => getLocalDateString());
  const currentStep = loggingStepOrder[currentStepIndex];
  const todaysCount = logs.filter((log) => log.dateLocal === today).length;
  const isSummaryStep = currentStepIndex >= loggingStepOrder.length;

  function commitStep(step: LoggingStep, value: string) {
    setTypedValue("");
    answerStep(stepFieldMap[step], value);
  }

  function submitTypedValue() {
    if (!currentStep) {
      return;
    }

    if (currentStep === "energy") {
      const parsed = energyRawSchema.safeParse(typedValue);

      if (!parsed.success) {
        failSaving(parsed.error.issues[0]?.message ?? "Enter a valid energy value.");
        return;
      }

      commitStep(currentStep, parsed.data);
      return;
    }

    const nextValue = typedValue.trim();

    if (!nextValue) {
      failSaving("Enter a response before continuing.");
      return;
    }

    commitStep(currentStep, nextValue);
  }

  async function saveLog() {
    if (
      !draft.energyRaw ||
      !draft.mentalTexture ||
      !draft.attentionMode ||
      !draft.emotionalTone ||
      !draft.dominantThoughtVector
    ) {
      failSaving("The wizard is not complete yet.");
      return;
    }

    startSaving();

    try {
      const savedLog = await createLogEntry({
        energyRaw: draft.energyRaw,
        mentalTexture: draft.mentalTexture,
        attentionMode: draft.attentionMode,
        emotionalTone: draft.emotionalTone,
        dominantThoughtVector: draft.dominantThoughtVector,
        bodySignal: draft.bodySignal ?? "none",
      });

      finishSaving(savedLog);
    } catch (error) {
      failSaving(
        error instanceof Error ? error.message : "The log could not be saved.",
      );
    }
  }

  const previewLine =
    draft.energyRaw &&
    draft.mentalTexture &&
    draft.attentionMode &&
    draft.emotionalTone &&
    draft.dominantThoughtVector
      ? makeCanonicalLogLine({
          dateLocal: today,
          daySequence: todaysCount + 1,
          energyRaw: draft.energyRaw,
          mentalTexture: draft.mentalTexture,
          attentionMode: draft.attentionMode,
          emotionalTone: draft.emotionalTone,
          dominantThoughtVector: draft.dominantThoughtVector,
          bodySignal: draft.bodySignal ?? "none",
        })
      : null;

  return (
    <div className="page-shell">
      <PageIntro
        eyebrow="Log State"
        title="One prompt at a time."
        copy="Elfie asks once, records the first response, and moves forward. There is no back-editing in the flow - only start over or save."
        actions={
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
            Start over
          </Button>
        }
      />

      {lastSavedLog ? (
        <Card>
          <CardHeader>
            <CardDescription>Saved locally</CardDescription>
            <CardTitle>{lastSavedLog.canonicalLine}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-slate-500">
              Logged at {formatTimeLabel(lastSavedLog.createdAt)} and stored in IndexedDB on
              this device.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Energy", lastSavedLog.energyRaw],
                ["Texture", lastSavedLog.mentalTexture],
                ["Attention", lastSavedLog.attentionMode],
                ["Tone", lastSavedLog.emotionalTone],
                ["Thought", lastSavedLog.dominantThoughtVector],
                ["Body", lastSavedLog.bodySignal],
              ].map(([label, value]) => (
                <div key={label} className="surface-soft p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                  <p className="mt-2 text-sm text-slate-700">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={reset}>Log another</Button>
              <Button asChild variant="outline">
                <Link href="/history">
                  View history
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardDescription>
                Step {Math.min(currentStepIndex + 1, loggingStepOrder.length)} of{" "}
                {loggingStepOrder.length}
              </CardDescription>
              <CardTitle>
                {isSummaryStep && previewLine ? "Ready to save" : stepTitles[currentStep ?? "bodySignal"]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isSummaryStep && currentStep ? (
                <>
                  <p className="text-sm leading-6 text-slate-500">
                    {stepDescriptions[currentStep]}
                  </p>

                  {currentStep === "energy" ? (
                    <div className="space-y-4">
                      <Label htmlFor="energy-input">Energy</Label>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="energy-input"
                          inputMode="decimal"
                          placeholder="e.g. 6.5"
                          value={typedValue}
                          onChange={(event) => setTypedValue(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              submitTypedValue();
                            }
                          }}
                        />
                        <Button onClick={submitTypedValue}>Continue</Button>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === "mentalTexture" ? (
                    <>
                      <OptionGrid
                        options={mentalTextureOptions}
                        onSelect={(value) => commitStep(currentStep, value)}
                      />
                      <div className="space-y-3">
                        <Label htmlFor="custom-texture">Custom texture</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            id="custom-texture"
                            placeholder="Your own words"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                          />
                          <Button variant="outline" onClick={submitTypedValue}>
                            Save response
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === "attentionMode" ? (
                    <>
                      <OptionGrid
                        options={attentionModeOptions}
                        onSelect={(value) => commitStep(currentStep, value)}
                      />
                      <div className="space-y-3">
                        <Label htmlFor="custom-attention">Custom attention mode</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            id="custom-attention"
                            placeholder="Your own words"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                          />
                          <Button variant="outline" onClick={submitTypedValue}>
                            Save response
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === "emotionalTone" ? (
                    <>
                      <OptionGrid
                        options={emotionalToneOptions}
                        onSelect={(value) => commitStep(currentStep, value)}
                      />
                      <div className="space-y-3">
                        <Label htmlFor="custom-tone">Custom emotional tone</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            id="custom-tone"
                            placeholder="Your own words"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                          />
                          <Button variant="outline" onClick={submitTypedValue}>
                            Save response
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === "dominantThoughtVector" ? (
                    <>
                      <OptionGrid
                        options={dominantThoughtExamples}
                        onSelect={(value) => commitStep(currentStep, value)}
                      />
                      <div className="space-y-3">
                        <Label htmlFor="custom-thought">Custom short phrase</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            id="custom-thought"
                            placeholder="Short phrase only"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                          />
                          <Button variant="outline" onClick={submitTypedValue}>
                            Save response
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === "bodySignal" ? (
                    <>
                      <OptionGrid
                        options={bodySignalOptions}
                        onSelect={(value) => commitStep(currentStep, value)}
                      />
                      <div className="space-y-3">
                        <Label htmlFor="custom-body">Custom body signal</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            id="custom-body"
                            placeholder="Optional custom note"
                            value={typedValue}
                            onChange={(event) => setTypedValue(event.target.value)}
                          />
                          <Button variant="outline" onClick={submitTypedValue}>
                            Save response
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => commitStep(currentStep, "none")}
                          >
                            Skip
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm leading-6 text-slate-500">
                    This preview uses today&apos;s next local log number. Save to commit the
                    canonical line and structured record together.
                  </p>
                  {previewLine ? (
                    <div className="surface-soft p-4">
                      <p className="font-medium text-slate-900">{previewLine}</p>
                    </div>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["Energy", draft.energyRaw],
                      ["Texture", draft.mentalTexture],
                      ["Attention", draft.attentionMode],
                      ["Tone", draft.emotionalTone],
                      ["Thought", draft.dominantThoughtVector],
                      ["Body", draft.bodySignal ?? "none"],
                    ].map(([label, value]) => (
                      <div key={label} className="surface-soft p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={saveLog} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save log"}
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Start over
                    </Button>
                  </div>
                </div>
              )}

              {saveError ? <p className="text-sm text-[#9d4259]">{saveError}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Today so far</CardDescription>
              <CardTitle>{todaysCount} logs already stored today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-500">
              <p>
                The next save will become Log {todaysCount + 1} for {today}.
              </p>
              {logs
                .filter((log) => log.dateLocal === today)
                .slice(0, 3)
                .map((log) => (
                  <div key={log.id} className="surface-soft p-4">
                    <p className="font-medium text-slate-900">{log.canonicalLine}</p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

