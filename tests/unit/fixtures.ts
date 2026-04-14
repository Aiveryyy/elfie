import type { ElvyxLog, ElvyxSettings } from "@/types/elvyx";

export const sampleSettings: ElvyxSettings = {
  id: "app-settings",
  accentTheme: "lavender",
  reducedMotion: false,
  defaultExportFormat: "backup",
  aiEnabled: false,
  updatedAt: "2026-04-14T08:30:00.000Z",
};

export const sampleLogs: ElvyxLog[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-04-13T03:00:00.000Z",
    dateLocal: "2026-04-13",
    daySequence: 1,
    canonicalLine:
      "2026-04-13 | Log 1 | E:3.5 | T:foggy | A:drifting | M:low | D:nothing specific | B:none",
    energyRaw: "3.5",
    energyValue: 3.5,
    mentalTexture: "foggy",
    attentionMode: "drifting",
    emotionalTone: "low",
    dominantThoughtVector: "nothing specific",
    bodySignal: "none",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    createdAt: "2026-04-13T09:30:00.000Z",
    dateLocal: "2026-04-13",
    daySequence: 2,
    canonicalLine:
      "2026-04-13 | Log 2 | E:7 | T:clear | A:locked-in | M:curious | D:systems | B:warm",
    energyRaw: "7",
    energyValue: 7,
    mentalTexture: "clear",
    attentionMode: "locked-in",
    emotionalTone: "curious",
    dominantThoughtVector: "systems",
    bodySignal: "warm",
  },
];
