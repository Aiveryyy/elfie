import {
  aiInsightModelSchema,
  aiInsightRequestSchema,
} from "@/features/logging/schemas";
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
      caution: "Descriptive only.",
    });

    expect(request.mode).toBe("reflect");
    expect(output.title).toBe("A calm pattern");
  });
});
