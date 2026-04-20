import { zodTextFormat } from "openai/helpers/zod";

import { aiInsightModelSchema } from "@/features/logging/schemas";
import type { AiInsightRequest, AiModelTier, InsightMode } from "@/types/elvyx";

export const aiInsightTextFormat = zodTextFormat(
  aiInsightModelSchema,
  "elfie_insight",
);

export function getAiModelForMode(mode: InsightMode): {
  model: string;
  tier: AiModelTier;
} {
  const lightModel = process.env.OPENAI_MODEL_LIGHT ?? "gpt-5.4-mini";
  const patternModel = process.env.OPENAI_MODEL_PATTERN || lightModel;
  const deepModel = process.env.OPENAI_MODEL_DEEP ?? "gpt-5.4";

  if (mode === "deep-analysis") {
    return {
      model: deepModel,
      tier: "deep",
    };
  }

  if (mode === "pattern") {
    return {
      model: patternModel,
      tier: "pattern",
    };
  }

  return {
    model: lightModel,
    tier: "light",
  };
}

export function buildAiPrompt(request: AiInsightRequest) {
  const actionLabel =
    request.mode === "reflect"
      ? "Offer one gentle reflection."
      : request.mode === "pattern"
        ? "Name one neutral descriptive pattern."
        : request.mode === "deep-analysis"
          ? "Write a deeper but still non-clinical analysis with a few grounded observations."
          : "Suggest one tiny next move.";
  const summaries = request.patternSummaries?.length
    ? ["Local pattern summaries:", ...request.patternSummaries.map((summary) => `- ${summary}`)]
    : [];

  return [
    {
      role: "system" as const,
      content: [
        {
          type: "input_text" as const,
          text: [
            "You are Elfie, a calm reflective assistant for a local-first state logging app.",
            "Be minimal, gentle, and clear.",
            "Never diagnose, never imitate a therapist, never moralize, never shame, and never speak with false certainty.",
            request.mode === "deep-analysis"
              ? "For deeper analysis, stay grounded in the logs and use cautious descriptive language."
              : "Keep outputs brief and practical.",
            "Use descriptive language only.",
          ].join(" "),
        },
      ],
    },
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: [
            `Today's local date is ${request.localeDate}.`,
            `Requested action: ${actionLabel}`,
            ...summaries,
            "Recent logs:",
            ...request.logs.map((log) => `- ${log.canonicalLine}`),
          ].join("\n"),
        },
      ],
    },
  ];
}
