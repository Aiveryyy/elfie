import {
  aiInsightModelSchema,
  aiInsightRequestSchema,
} from "@/features/logging/schemas";
import { getAiModelForMode } from "@/lib/ai";
import { sampleLogs } from "@/tests/unit/fixtures";

describe("AI schemas", () => {
  it("parses the AI request and structured output schemas", () => {
    const request = aiInsightRequestSchema.parse({
      mode: "reflect",
      localeDate: "2026-04-14",
      logs: sampleLogs,
    });
    const output = aiInsightModelSchema.parse({
      title: "A calm pattern",
      body: "Locked-in attention appears when texture stays clear and the tone remains curious.",
      bullets: null,
      caution: "Descriptive only.",
    });

    expect(request.mode).toBe("reflect");
    expect(output.title).toBe("A calm pattern");
  });

  it("parses deep analysis bullets", () => {
    const request = aiInsightRequestSchema.parse({
      mode: "deep-analysis",
      localeDate: "2026-04-14",
      logs: sampleLogs,
      patternSummaries: ["Clear attention appears with curious tone."],
    });
    const output = aiInsightModelSchema.parse({
      title: "A grounded read",
      body: "The logs suggest a steady relationship between clear texture and locked-in attention.",
      bullets: ["Clear texture appears repeatedly.", "Energy stays in a middle band."],
      caution: null,
    });

    expect(request.mode).toBe("deep-analysis");
    expect(output.bullets).toHaveLength(2);
  });

  it("selects AI model tiers by mode", () => {
    const originalLight = process.env.OPENAI_MODEL_LIGHT;
    const originalPattern = process.env.OPENAI_MODEL_PATTERN;
    const originalDeep = process.env.OPENAI_MODEL_DEEP;

    process.env.OPENAI_MODEL_LIGHT = "light-model";
    process.env.OPENAI_MODEL_PATTERN = "pattern-model";
    process.env.OPENAI_MODEL_DEEP = "deep-model";

    expect(getAiModelForMode("reflect")).toEqual({
      model: "light-model",
      tier: "light",
    });
    expect(getAiModelForMode("pattern")).toEqual({
      model: "pattern-model",
      tier: "pattern",
    });
    expect(getAiModelForMode("deep-analysis")).toEqual({
      model: "deep-model",
      tier: "deep",
    });

    if (originalLight === undefined) {
      delete process.env.OPENAI_MODEL_LIGHT;
    } else {
      process.env.OPENAI_MODEL_LIGHT = originalLight;
    }

    if (originalPattern === undefined) {
      delete process.env.OPENAI_MODEL_PATTERN;
    } else {
      process.env.OPENAI_MODEL_PATTERN = originalPattern;
    }

    if (originalDeep === undefined) {
      delete process.env.OPENAI_MODEL_DEEP;
    } else {
      process.env.OPENAI_MODEL_DEEP = originalDeep;
    }
  });
});
