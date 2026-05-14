import { NextResponse, type NextRequest } from "next/server";

import {
  getDriveClientForRequest,
  getRemoteSyncFile,
  isGoogleSyncConfigured,
} from "@/lib/google-drive";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!isGoogleSyncConfigured()) {
    return NextResponse.json({
      authenticated: false,
      configured: false,
      remote: null,
    });
  }

  const drive = await getDriveClientForRequest(request);

  if (!drive) {
    return NextResponse.json({
      authenticated: false,
      configured: true,
      remote: null,
    });
  }

  const remote = await getRemoteSyncFile(drive);

  return NextResponse.json({
    authenticated: true,
    configured: true,
    remote,
  });
}
