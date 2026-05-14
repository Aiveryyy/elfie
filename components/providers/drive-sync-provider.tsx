"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createBackupDocument,
  replaceAllData,
  saveSyncMeta,
} from "@/db/log-service";
import { useAllLogs } from "@/hooks/use-logs";
import { useSettings } from "@/hooks/use-settings";
import { useSyncMeta } from "@/hooks/use-sync-meta";
import { downloadTextFile } from "@/lib/download";
import {
  createBackupHash,
  createSyncDocument,
  getSyncStatusLabel,
  resolveSyncState,
} from "@/lib/sync";
import type { ElfieSyncDocumentV1, SyncMeta } from "@/types/elvyx";

interface RemoteSyncPayload {
  authenticated: boolean;
  configured: boolean;
  remote: {
    fileId: string;
    modifiedTime: string | null;
    document: ElfieSyncDocumentV1;
  } | null;
}

interface PushSyncPayload {
  ok: boolean;
  remote?: {
    fileId: string | null;
    modifiedTime: string | null;
    document: ElfieSyncDocumentV1;
  };
  reason?: string;
}

interface ConflictState {
  remote: NonNullable<RemoteSyncPayload["remote"]>;
  localDocument: ElfieSyncDocumentV1;
}

interface DriveSyncContextValue {
  sessionStatus: "authenticated" | "loading" | "unauthenticated";
  userName?: string | null;
  userEmail?: string | null;
  isSignedIn: boolean;
  isSyncing: boolean;
  syncMeta: SyncMeta;
  statusLabel: string;
  signInWithGoogle: () => void;
  signOutFromGoogle: () => Promise<void>;
  syncNow: () => Promise<void>;
  pushLocal: () => Promise<void>;
  pullRemote: () => Promise<void>;
}

const DriveSyncContext = createContext<DriveSyncContextValue | null>(null);

function getOrCreateDeviceId() {
  const storageKey = "elfie-device-id";
  const current = window.localStorage.getItem(storageKey);

  if (current) {
    return current;
  }

  const next = crypto.randomUUID();
  window.localStorage.setItem(storageKey, next);

  return next;
}

async function fetchRemoteSync() {
  const response = await fetch("/api/sync/remote", {
    method: "GET",
  });

  return (await response.json()) as RemoteSyncPayload;
}

export function DriveSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const logs = useAllLogs();
  const { settings } = useSettings();
  const { syncMeta } = useSyncMeta();
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const hasRunInitialSync = useRef(false);
  const backup = useMemo(
    () => createBackupDocument({ logs, settings }),
    [logs, settings],
  );
  const localHash = useMemo(() => createBackupHash(backup), [backup]);
  const statusLabel = getSyncStatusLabel(syncMeta);

  const pushDocument = useCallback(
    async (document: ElfieSyncDocumentV1, fileId?: string | null) => {
      const response = await fetch(
        `/api/sync/push${fileId ? `?fileId=${encodeURIComponent(fileId)}` : ""}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(document),
        },
      );
      const payload = (await response.json()) as PushSyncPayload;

      if (!response.ok || !payload.ok || !payload.remote) {
        throw new Error(payload.reason ?? "Google Drive push failed.");
      }

      await saveSyncMeta({
        driveFileId: payload.remote.fileId ?? fileId ?? null,
        lastRemoteModifiedTime: payload.remote.modifiedTime,
        lastSyncHash: document.backupHash,
        lastSyncedAt: new Date().toISOString(),
        lastDeviceId: document.deviceId,
        syncStatus: "synced",
        statusMessage: "Saved to hidden Google Drive app data.",
      });
    },
    [],
  );

  const applyRemote = useCallback(
    async (remote: NonNullable<RemoteSyncPayload["remote"]>) => {
      await replaceAllData(remote.document.backup, {
        preserveSettingsUpdatedAt: true,
      });
      await saveSyncMeta({
        driveFileId: remote.fileId,
        lastRemoteModifiedTime: remote.modifiedTime,
        lastSyncHash: remote.document.backupHash,
        lastSyncedAt: new Date().toISOString(),
        lastDeviceId: remote.document.deviceId,
        syncStatus: "synced",
        statusMessage: "Pulled the latest Google Drive copy.",
      });
      setConflict(null);
    },
    [],
  );

  const syncNow = useCallback(async () => {
    if (sessionStatus !== "authenticated") {
      await saveSyncMeta({
        syncStatus: "signed-out",
        statusMessage: "Sign in with Google to sync through hidden Drive app data.",
      });
      return;
    }

    const deviceId = getOrCreateDeviceId();
    const localDocument = createSyncDocument({ backup, deviceId });

    setIsSyncing(true);
    setConflict(null);
    await saveSyncMeta({
      syncStatus: "syncing",
      statusMessage: "Checking Google Drive.",
    });

    try {
      const remotePayload = await fetchRemoteSync();

      if (!remotePayload.configured) {
        await saveSyncMeta({
          syncStatus: "error",
          statusMessage: "Google sync needs AUTH and Google OAuth env vars.",
        });
        return;
      }

      if (!remotePayload.authenticated) {
        await saveSyncMeta({
          syncStatus: "signed-out",
          statusMessage: "Sign in with Google to sync through hidden Drive app data.",
        });
        return;
      }

      const remote = remotePayload.remote;
      const resolution = resolveSyncState({
        localHash: localDocument.backupHash,
        localLogCount: backup.logs.length,
        remoteHash: remote?.document.backupHash ?? null,
        lastSyncHash: syncMeta.lastSyncHash,
      });

      if (resolution === "pull" && remote) {
        await applyRemote(remote);
        return;
      }

      if (resolution === "push") {
        await pushDocument(localDocument, remote?.fileId ?? syncMeta.driveFileId);
        return;
      }

      if (resolution === "conflict" && remote) {
        setConflict({ remote, localDocument });
        await saveSyncMeta({
          driveFileId: remote.fileId,
          lastRemoteModifiedTime: remote.modifiedTime,
          syncStatus: "conflict",
          statusMessage: "Local and Google Drive data both changed.",
        });
        return;
      }

      await saveSyncMeta({
        driveFileId: remote?.fileId ?? syncMeta.driveFileId ?? null,
        lastRemoteModifiedTime: remote?.modifiedTime ?? syncMeta.lastRemoteModifiedTime,
        lastSyncHash: localDocument.backupHash,
        lastSyncedAt: new Date().toISOString(),
        lastDeviceId: deviceId,
        syncStatus: "synced",
        statusMessage: "Local data and Google Drive are in sync.",
      });
    } catch {
      await saveSyncMeta({
        syncStatus: "error",
        statusMessage: "Google Drive sync failed. Try manual sync again.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [
    applyRemote,
    backup,
    pushDocument,
    sessionStatus,
    syncMeta.driveFileId,
    syncMeta.lastRemoteModifiedTime,
    syncMeta.lastSyncHash,
  ]);

  const pushLocal = useCallback(async () => {
    const deviceId = getOrCreateDeviceId();
    const localDocument = createSyncDocument({ backup, deviceId });

    setIsSyncing(true);
    try {
      await pushDocument(localDocument, syncMeta.driveFileId);
      setConflict(null);
    } catch {
      await saveSyncMeta({
        syncStatus: "error",
        statusMessage: "Could not overwrite the Google Drive copy.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [backup, pushDocument, syncMeta.driveFileId]);

  const pullRemote = useCallback(async () => {
    setIsSyncing(true);
    try {
      const remotePayload = await fetchRemoteSync();

      if (remotePayload.remote) {
        await applyRemote(remotePayload.remote);
      }
    } catch {
      await saveSyncMeta({
        syncStatus: "error",
        statusMessage: "Could not pull from Google Drive.",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [applyRemote]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      hasRunInitialSync.current = false;
      void saveSyncMeta({
        syncStatus: "signed-out",
        statusMessage: "Sign in with Google to sync through hidden Drive app data.",
      });
      return;
    }

    if (sessionStatus === "authenticated" && !hasRunInitialSync.current) {
      hasRunInitialSync.current = true;
      void syncNow();
    }
  }, [sessionStatus, syncNow]);

  useEffect(() => {
    if (
      sessionStatus !== "authenticated" ||
      !syncMeta.lastSyncHash ||
      syncMeta.syncStatus === "conflict" ||
      isSyncing ||
      localHash === syncMeta.lastSyncHash
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void syncNow();
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [
    isSyncing,
    localHash,
    sessionStatus,
    syncMeta.lastSyncHash,
    syncMeta.syncStatus,
    syncNow,
  ]);

  const value = useMemo<DriveSyncContextValue>(
    () => ({
      sessionStatus,
      userName: session?.user?.name,
      userEmail: session?.user?.email,
      isSignedIn: sessionStatus === "authenticated",
      isSyncing,
      syncMeta,
      statusLabel,
      signInWithGoogle: () => void signIn("google"),
      signOutFromGoogle: async () => {
        await fetch("/api/sync/revoke", { method: "POST" }).catch(() => null);
        await saveSyncMeta({
          syncStatus: "signed-out",
          statusMessage: "Google Drive sync is disconnected on this device.",
        });
        await signOut({ redirect: false });
      },
      syncNow,
      pushLocal,
      pullRemote,
    }),
    [
      isSyncing,
      pullRemote,
      pushLocal,
      session?.user?.email,
      session?.user?.name,
      sessionStatus,
      statusLabel,
      syncMeta,
      syncNow,
    ],
  );

  function exportLocalBackup() {
    downloadTextFile({
      filename: `elfie-local-backup-before-sync-${new Date().toISOString().slice(0, 10)}.json`,
      content: JSON.stringify(backup, null, 2),
      mimeType: "application/json",
    });
  }

  return (
    <DriveSyncContext.Provider value={value}>
      {children}
      <Dialog open={Boolean(conflict)} onOpenChange={() => null}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose which Elfie copy to keep</DialogTitle>
            <DialogDescription>
              Local data and the hidden Google Drive copy both changed since the last sync.
              Elfie will not merge them automatically because daily log numbering must stay
              trustworthy.
            </DialogDescription>
          </DialogHeader>
          <div className="surface-soft space-y-2 p-4 text-sm text-slate-600">
            <p>
              Local logs: <strong>{backup.logs.length}</strong>
            </p>
            <p>
              Drive logs: <strong>{conflict?.remote.document.backup.logs.length ?? 0}</strong>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={exportLocalBackup}>
              Export local backup first
            </Button>
            <Button
              variant="outline"
              disabled={isSyncing || !conflict}
              onClick={() => conflict && void applyRemote(conflict.remote)}
            >
              Use Drive copy
            </Button>
            <Button disabled={isSyncing} onClick={() => void pushLocal()}>
              Keep local copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DriveSyncContext.Provider>
  );
}

export function useDriveSync() {
  const context = useContext(DriveSyncContext);

  if (!context) {
    throw new Error("useDriveSync must be used inside DriveSyncProvider.");
  }

  return context;
}
