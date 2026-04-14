import { summarizePatterns } from "@/lib/patterns";
import { sampleLogs } from "@/tests/unit/fixtures";

describe("patterns", () => {
  it("aggregates recurring combinations and transitions", () => {
    const summary = summarizePatterns([
      ...sampleLogs,
      {
        ...sampleLogs[1]!,
        id: "33333333-3333-4333-8333-333333333333",
        createdAt: "2026-04-14T02:00:00.000Z",
        dateLocal: "2026-04-14",
        daySequence: 1,
        canonicalLine:
          "2026-04-14 | Log 1 | E:7 | T:clear | A:locked-in | M:curious | D:systems | B:warm",
      },
    ]);

    expect(summary.recurringCombinations[0]?.statement).toContain(
      "Locked-in attention often appears",
    );
    expect(summary.descriptiveSummaries.length).toBeGreaterThan(0);
    expect(summary.recentFrequencies.length).toBeGreaterThan(0);
  });
});
