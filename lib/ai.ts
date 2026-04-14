import { zodTextFormat } from "openai/helpers/zod";

import { aiInsightModelSchema } from "@/features/logging/schemas";
import type { AiInsightRequest } from "@/types/elvyx";

export const aiInsightTextFormat = zodTextFormat(
  aiInsightModelSchema,
  "elfie_insight",
);

export function buildAiPrompt(request: AiInsightRequest) {
  const actionLabel =
    request.mode === "reflect"
      ? "Offer one gentle reflection."
      : request.mode === "pattern"
        ? "Name one neutral descriptive pattern."
        : "Suggest one tiny next move.";

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
            "Keep outputs brief and practical.",
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
            "Recent logs:",
            ...request.logs.map((log) => `- ${log.canonicalLine}`),
          ].join("\n"),
        },
      ],
    },
  ];
}
