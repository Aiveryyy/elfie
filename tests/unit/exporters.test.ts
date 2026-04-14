import {
  exportFullBackup,
  exportLogsAsCsv,
  exportLogsAsJson,
  exportLogsAsMarkdown,
} from "@/lib/exporters";
import { sampleLogs, sampleSettings } from "@/tests/unit/fixtures";

describe("exporters", () => {
  it("exports logs as JSON in ascending order", () => {
    const json = exportLogsAsJson([...sampleLogs].reverse());
    expect(json).toContain('"dateLocal": "2026-04-13"');
    expect(json.indexOf("Log 1")).toBeLessThan(json.indexOf("Log 2"));
  });

  it("exports CSV with canonical line and structured fields", () => {
    const csv = exportLogsAsCsv(sampleLogs);

    expect(csv).toContain("canonicalLine");
    expect(csv).toContain("2026-04-13 | Log 1 | E:3.5");
    expect(csv).toContain("locked-in");
  });

  it("exports Markdown and full backups", () => {
    const markdown = exportLogsAsMarkdown(sampleLogs);
    const backup = exportFullBackup(sampleLogs, sampleSettings);

    expect(markdown).toContain("## 2026-04-13");
    expect(markdown).toContain(sampleLogs[0]!.canonicalLine);
    expect(backup).toContain('"app": "elfie"');
    expect(backup).toContain('"version": 1');
  });
});
