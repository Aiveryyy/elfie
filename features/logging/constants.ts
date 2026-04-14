export const mentalTextureOptions = [
  "smooth",
  "sharp",
  "foggy",
  "heavy",
  "fast",
  "clear",
  "noisy",
] as const;

export const attentionModeOptions = [
  "scattered",
  "exploratory",
  "locked-in",
  "drifting",
] as const;

export const emotionalToneOptions = [
  "neutral",
  "calm",
  "curious",
  "restless",
  "tense",
  "low",
  "uplifted",
] as const;

export const dominantThoughtExamples = [
  "systems",
  "learning",
  "future",
  "nothing specific",
  "meta",
  "task-related",
] as const;

export const bodySignalOptions = [
  "hungry",
  "restless",
  "tense",
  "tired",
  "light",
  "warm",
  "none",
] as const;

export const loggingStepOrder = [
  "energy",
  "mentalTexture",
  "attentionMode",
  "emotionalTone",
  "dominantThoughtVector",
  "bodySignal",
] as const;

export type LoggingStep = (typeof loggingStepOrder)[number];
