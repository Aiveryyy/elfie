import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });
  const tokenToRevoke = token?.refreshToken ?? token?.accessToken;

  if (!tokenToRevoke) {
    return NextResponse.json({ ok: true, revoked: false });
  }

  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: tokenToRevoke,
    }),
  }).catch(() => null);

  return NextResponse.json({ ok: true, revoked: true });
}
