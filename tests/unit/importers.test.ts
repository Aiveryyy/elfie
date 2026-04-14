import { parseBackupJson } from "@/lib/importers";
import { sampleLogs, sampleSettings } from "@/tests/unit/fixtures";

describe("importers", () => {
  it("accepts a valid backup document", () => {
    const backup = JSON.stringify({
      app: "elfie",
      version: 1,
      exportedAt: "2026-04-14T10:00:00.000Z",
      settings: {
        accentTheme: sampleSettings.accentTheme,
        reducedMotion: sampleSettings.reducedMotion,
        defaultExportFormat: sampleSettings.defaultExportFormat,
        aiEnabled: sampleSettings.aiEnabled,
        updatedAt: sampleSettings.updatedAt,
      },
      logs: sampleLogs,
    });

    const parsed = parseBackupJson(backup);

    expect(parsed.logs).toHaveLength(2);
    expect(parsed.settings.accentTheme).toBe("lavender");
  });

  it("rejects numbering inconsistencies", () => {
    const backup = JSON.stringify({
      app: "elfie",
      version: 1,
      exportedAt: "2026-04-14T10:00:00.000Z",
      settings: {
        accentTheme: sampleSettings.accentTheme,
        reducedMotion: sampleSettings.reducedMotion,
        defaultExportFormat: sampleSettings.defaultExportFormat,
        aiEnabled: sampleSettings.aiEnabled,
        updatedAt: sampleSettings.updatedAt,
      },
      logs: [
        sampleLogs[0],
        {
          ...sampleLogs[1],
          daySequence: 4,
          canonicalLine:
            "2026-04-13 | Log 4 | E:7 | T:clear | A:locked-in | M:curious | D:systems | B:warm",
        },
      ],
    });

    expect(() => parseBackupJson(backup)).toThrow(/should contain Log 2/i);
  });
});
