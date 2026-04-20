import { backupSchema } from "@/features/logging/schemas";
import {
  createBackupHash,
  createSyncDocument,
  parseSyncDocument,
  resolveSyncState,
} from "@/lib/sync";
import { sampleLogs, sampleSettings } from "@/tests/unit/fixtures";

const backup = backupSchema.parse({
  app: "elfie",
  version: 1,
  exportedAt: "2026-04-14T00:00:00.000Z",
  settings: {
    accentTheme: sampleSettings.accentTheme,
    reducedMotion: sampleSettings.reducedMotion,
    defaultExportFormat: sampleSettings.defaultExportFormat,
    aiEnabled: sampleSettings.aiEnabled,
    updatedAt: sampleSettings.updatedAt,
  },
  logs: sampleLogs,
});

describe("Drive sync helpers", () => {
  it("creates and parses a v1 sync document", () => {
    const document = createSyncDocument({
      backup,
      deviceId: "11111111-1111-4111-8111-111111111111",
      updatedAt: "2026-04-14T01:00:00.000Z",
    });

    expect(parseSyncDocument(document).syncVersion).toBe(1);
    expect(document.backupHash).toBe(createBackupHash(backup));
  });

  it("rejects malformed sync documents", () => {
    expect(() =>
      parseSyncDocument({
        syncVersion: 2,
        backup,
      }),
    ).toThrow();
  });

  it("hashes backup content deterministically without exportedAt churn", () => {
    const sameContentLaterExport = {
      ...backup,
      exportedAt: "2026-04-15T00:00:00.000Z",
    };

    expect(createBackupHash(backup)).toBe(
      createBackupHash(sameContentLaterExport),
    );
  });

  it("resolves first push and first pull", () => {
    expect(
      resolveSyncState({
        localHash: "local",
        localLogCount: 1,
        remoteHash: null,
        lastSyncHash: null,
      }),
    ).toBe("push");
    expect(
      resolveSyncState({
        localHash: "empty",
        localLogCount: 0,
        remoteHash: "remote",
        lastSyncHash: null,
      }),
    ).toBe("pull");
  });

  it("resolves one-sided changes and conflicts", () => {
    expect(
      resolveSyncState({
        localHash: "base",
        localLogCount: 2,
        remoteHash: "remote",
        lastSyncHash: "base",
      }),
    ).toBe("pull");
    expect(
      resolveSyncState({
        localHash: "local",
        localLogCount: 2,
        remoteHash: "base",
        lastSyncHash: "base",
      }),
    ).toBe("push");
    expect(
      resolveSyncState({
        localHash: "local",
        localLogCount: 2,
        remoteHash: "remote",
        lastSyncHash: "base",
      }),
    ).toBe("conflict");
  });
});
