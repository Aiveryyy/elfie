import { db } from "@/db/app-db";
import { createLogEntry } from "@/db/log-service";
import { makeCanonicalLogLine } from "@/features/logging/schemas";

describe("logging", () => {
  beforeEach(async () => {
    await db.logs.clear();
    await db.settings.clear();
  });

  it("resets numbering when the local date changes", async () => {
    const first = await createLogEntry(
      {
        energyRaw: "4",
        mentalTexture: "foggy",
        attentionMode: "drifting",
        emotionalTone: "low",
        dominantThoughtVector: "nothing specific",
        bodySignal: undefined,
      },
      {
        dateLocal: "2026-04-13",
        createdAt: "2026-04-13T03:00:00.000Z",
      },
    );
    const second = await createLogEntry(
      {
        energyRaw: "7",
        mentalTexture: "clear",
        attentionMode: "locked-in",
        emotionalTone: "curious",
        dominantThoughtVector: "systems",
        bodySignal: "warm",
      },
      {
        dateLocal: "2026-04-13",
        createdAt: "2026-04-13T05:00:00.000Z",
      },
    );
    const third = await createLogEntry(
      {
        energyRaw: "6.5",
        mentalTexture: "smooth",
        attentionMode: "exploratory",
        emotionalTone: "calm",
        dominantThoughtVector: "learning",
        bodySignal: undefined,
      },
      {
        dateLocal: "2026-04-14",
        createdAt: "2026-04-14T02:00:00.000Z",
      },
    );

    expect(first.daySequence).toBe(1);
    expect(second.daySequence).toBe(2);
    expect(third.daySequence).toBe(1);
  });

  it("formats canonical lines exactly and stores B:none when omitted", () => {
    expect(
      makeCanonicalLogLine({
        dateLocal: "2026-04-14",
        daySequence: 3,
        energyRaw: "6.5",
        mentalTexture: "clear",
        attentionMode: "locked-in",
        emotionalTone: "curious",
        dominantThoughtVector: "systems",
      }),
    ).toBe(
      "2026-04-14 | Log 3 | E:6.5 | T:clear | A:locked-in | M:curious | D:systems | B:none",
    );
  });
});
