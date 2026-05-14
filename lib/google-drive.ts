import { Readable } from "node:stream";

import { google } from "googleapis";
import type { drive_v3 } from "googleapis";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { ensureFreshGoogleAccessToken } from "@/lib/auth";
import { SYNC_FILE_NAME, parseSyncDocument } from "@/lib/sync";
import type { ElfieSyncDocumentV1 } from "@/types/elvyx";

const SYNC_FILE_FIELDS = "id,name,modifiedTime";

export interface RemoteSyncFile {
  fileId: string;
  modifiedTime: string | null;
  document: ElfieSyncDocumentV1;
}

export function isGoogleSyncConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
  );
}

function createDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  return google.drive({ version: "v3", auth });
}

export async function getDriveClientForRequest(request: NextRequest) {
  if (!isGoogleSyncConfigured()) {
    return null;
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });
  const accessToken = await ensureFreshGoogleAccessToken(token);

  return accessToken ? createDriveClient(accessToken) : null;
}

async function findSyncFile(drive: drive_v3.Drive) {
  const response = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${SYNC_FILE_NAME}' and trashed=false`,
    fields: "files(id,name,modifiedTime)",
    pageSize: 1,
  });

  return response.data.files?.[0] ?? null;
}

export async function getRemoteSyncFile(drive: drive_v3.Drive) {
  const file = await findSyncFile(drive);

  if (!file?.id) {
    return null;
  }

  const response = await drive.files.get(
    {
      fileId: file.id,
      alt: "media",
    },
    {
      responseType: "json",
    },
  );
  const document = parseSyncDocument(response.data);

  return {
    fileId: file.id,
    modifiedTime: file.modifiedTime ?? null,
    document,
  } satisfies RemoteSyncFile;
}

export async function upsertRemoteSyncFile(input: {
  drive: drive_v3.Drive;
  document: ElfieSyncDocumentV1;
  driveFileId?: string | null;
}) {
  const body = Readable.from([JSON.stringify(input.document, null, 2)]);
  const media = {
    mimeType: "application/json",
    body,
  };
  let fileId = input.driveFileId ?? null;

  if (!fileId) {
    fileId = (await findSyncFile(input.drive))?.id ?? null;
  }

  const response = fileId
    ? await input.drive.files.update({
        fileId,
        media,
        fields: SYNC_FILE_FIELDS,
      })
    : await input.drive.files.create({
        requestBody: {
          name: SYNC_FILE_NAME,
          parents: ["appDataFolder"],
          mimeType: "application/json",
        },
        media,
        fields: SYNC_FILE_FIELDS,
      });

  return {
    fileId: response.data.id ?? fileId,
    modifiedTime: response.data.modifiedTime ?? null,
  };
}
