import { compareLogsAscending, isWithinDateRange } from "@/lib/date";
import { sentenceCase } from "@/lib/utils";
import type { ElvyxLog } from "@/types/elvyx";

export interface PatternCombination {
  key: string;
  attentionMode: string;
  mentalTexture: string;
  emotionalTone: string;
  count: number;
  statement: string;
}

export interface PatternTransition {
  key: string;
  from: string;
  to: string;
  count: number;
  statement: string;
}

export interface PatternFrequency {
  label: string;
  kind: "attention" | "texture" | "tone" | "energy-band";
  count: number;
}

export interface PatternSummary {
  totalLogs: number;
  filteredLogs: ElvyxLog[];
  recurringCombinations: PatternCombination[];
  transitions: PatternTransition[];
  recentFrequencies: PatternFrequency[];
  descriptiveSummaries: string[];
}

function getEnergyBand(energyValue: number) {
  if (energyValue <= 3.9) {
    return "Lower energy";
  }

  if (energyValue <= 6.9) {
    return "Mid energy";
  }

  return "Higher energy";
}

export function summarizePatterns(
  logs: ElvyxLog[],
  options?: {
    startDate?: string;
    endDate?: string;
  },
): PatternSummary {
  const filteredLogs = [...logs]
    .filter((log) =>
      isWithinDateRange(log.dateLocal, options?.startDate, options?.endDate),
    )
    .sort(compareLogsAscending);

  const combinationCounts = new Map<string, PatternCombination>();
  const transitionCounts = new Map<string, PatternTransition>();
  const frequencyCounts = new Map<string, PatternFrequency>();

  for (const log of filteredLogs) {
    const comboKey = `${log.attentionMode}__${log.mentalTexture}__${log.emotionalTone}`;
    const existingCombo = combinationCounts.get(comboKey);

    combinationCounts.set(comboKey, {
      key: comboKey,
      attentionMode: log.attentionMode,
      mentalTexture: log.mentalTexture,
      emotionalTone: log.emotionalTone,
      count: (existingCombo?.count ?? 0) + 1,
      statement: `${sentenceCase(log.attentionMode)} attention often appears with ${log.mentalTexture} texture and ${log.emotionalTone} tone.`,
    });

    for (const [kind, label] of [
      ["attention", log.attentionMode],
      ["texture", log.mentalTexture],
      ["tone", log.emotionalTone],
      ["energy-band", getEnergyBand(log.energyValue)],
    ] as const) {
      const frequencyKey = `${kind}:${label}`;
      const existingFrequency = frequencyCounts.get(frequencyKey);

      frequencyCounts.set(frequencyKey, {
        label,
        kind,
        count: (existingFrequency?.count ?? 0) + 1,
      });
    }
  }

  for (let index = 1; index < filteredLogs.length; index += 1) {
    const previous = filteredLogs[index - 1];
    const current = filteredLogs[index];

    const transitionKey = `${previous.attentionMode}__${current.attentionMode}`;
    const existingTransition = transitionCounts.get(transitionKey);

    transitionCounts.set(transitionKey, {
      key: transitionKey,
      from: previous.attentionMode,
      to: current.attentionMode,
      count: (existingTransition?.count ?? 0) + 1,
      statement: `${sentenceCase(previous.attentionMode)} attention often moves into ${current.attentionMode} attention later on.`,
    });
  }

  const recurringCombinations = [...combinationCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const transitions = [...transitionCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 5);
  const recentFrequencies = [...frequencyCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const descriptiveSummaries: string[] = [];
  const topCombination = recurringCombinations[0];
  const lowEnergyDrifting = filteredLogs.filter(
    (log) => getEnergyBand(log.energyValue) === "Lower energy" && log.attentionMode === "drifting",
  );
  const topTransition = transitions[0];

  if (topCombination && topCombination.count > 1) {
    descriptiveSummaries.push(topCombination.statement);
  }

  if (lowEnergyDrifting.length > 1) {
    descriptiveSummaries.push(
      "Lower energy tends to cluster with drifting attention.",
    );
  }

  if (topTransition && topTransition.count > 1) {
    descriptiveSummaries.push(topTransition.statement);
  }

  if (!descriptiveSummaries.length && filteredLogs.length) {
    descriptiveSummaries.push(
      "Patterns will become more descriptive as more logs accumulate.",
    );
  }

  return {
    totalLogs: logs.length,
    filteredLogs,
    recurringCombinations,
    transitions,
    recentFrequencies,
    descriptiveSummaries,
  };
}
