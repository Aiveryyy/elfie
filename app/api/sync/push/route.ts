import { NextResponse, type NextRequest } from "next/server";

import { syncDocumentSchema } from "@/features/logging/schemas";
import {
  getDriveClientForRequest,
  isGoogleSyncConfigured,
  upsertRemoteSyncFile,
} from "@/lib/google-drive";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isGoogleSyncConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "not_configured",
      },
      { status: 503 },
    );
  }

  const drive = await getDriveClientForRequest(request);

  if (!drive) {
    return NextResponse.json(
      {
        ok: false,
        reason: "unauthenticated",
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_request",
      },
      { status: 400 },
    );
  }

  const parsed = syncDocumentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_sync_document",
      },
      { status: 400 },
    );
  }

  const metadata = await upsertRemoteSyncFile({
    drive,
    document: parsed.data,
    driveFileId:
      typeof request.nextUrl.searchParams.get("fileId") === "string"
        ? request.nextUrl.searchParams.get("fileId")
        : null,
  });

  return NextResponse.json({
    ok: true,
    remote: {
      ...metadata,
      document: parsed.data,
    },
  });
}
