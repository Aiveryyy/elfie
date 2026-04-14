import OpenAI from "openai";
import { NextResponse } from "next/server";

import { aiInsightRequestSchema } from "@/features/logging/schemas";
import { buildAiPrompt, aiInsightTextFormat } from "@/lib/ai";
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

    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
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
      tone: "calm",
      caution: output.caution ?? null,
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
