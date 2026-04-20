"use client";

import { Cloud, LogOut, RefreshCcw, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDriveSync } from "@/components/providers/drive-sync-provider";

export function DriveSyncPanel() {
  const sync = useDriveSync();

  return (
    <Card>
      <CardHeader>
        <CardDescription>Google Drive sync</CardDescription>
        <CardTitle>Optional sign-in, hidden Drive storage.</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="surface-soft flex items-start gap-3 p-4 text-sm leading-6 text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-[color:var(--accent-strong)]" />
          <div className="space-y-1">
            <p className="font-medium text-slate-900">
              {sync.isSignedIn
                ? sync.userEmail ?? sync.userName ?? "Signed in with Google"
                : "Signed out"}
            </p>
            <p>{sync.statusLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {sync.isSignedIn ? (
            <>
              <Button onClick={() => void sync.syncNow()} disabled={sync.isSyncing}>
                <RefreshCcw className="h-4 w-4" />
                {sync.isSyncing ? "Syncing" : "Sync now"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void sync.signOutFromGoogle()}
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={sync.signInWithGoogle}>
              <Cloud className="h-4 w-4" />
              Sign in with Google
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
