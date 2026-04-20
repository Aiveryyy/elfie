import OpenAI from "openai";
import { NextResponse } from "next/server";

import { aiInsightRequestSchema } from "@/features/logging/schemas";
import { buildAiPrompt, aiInsightTextFormat, getAiModelForMode } from "@/lib/ai";
import type { AiInsightResponse } from "@/types/elvyx";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json<AiInsightResponse>({
      available: false,
      reason: "missing_api_key",
    });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<AiInsightResponse>(
      {
        available: false,
        reason: "invalid_request",
      },
      { status: 400 },
    );
  }

  const parsed = aiInsightRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json<AiInsightResponse>(
      {
        available: false,
        reason: "invalid_request",
      },
      { status: 400 },
    );
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const selectedModel = getAiModelForMode(parsed.data.mode);

    const response = await client.responses.parse({
      model: selectedModel.model,
      input: buildAiPrompt(parsed.data),
      text: {
        format: aiInsightTextFormat,
      },
    });

    const output = response.output_parsed;

    if (!output) {
      return NextResponse.json<AiInsightResponse>(
        {
          available: false,
          reason: "invalid_request",
        },
        { status: 502 },
      );
    }

    return NextResponse.json<AiInsightResponse>({
      available: true,
      mode: parsed.data.mode,
      title: output.title,
      body: output.body,
      bullets: output.bullets ?? undefined,
      modelTier: selectedModel.tier,
      tone: "calm",
      caution: output.caution,
    });
  } catch {
    return NextResponse.json<AiInsightResponse>(
      {
        available: false,
        reason: "invalid_request",
      },
      { status: 500 },
    );
  }
}
