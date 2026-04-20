import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

export const googleDriveScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.appdata",
] as const;

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}

async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      authError: "missing_refresh_token",
    };
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      error?: string;
    };

    if (!response.ok || !refreshedTokens.access_token) {
      throw new Error(refreshedTokens.error ?? "Refresh token request failed.");
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      authError: undefined,
    };
  } catch {
    return {
      ...token,
      authError: "refresh_failed",
    };
  }
}

export async function ensureFreshGoogleAccessToken(token: JWT | null) {
  if (!token?.accessToken) {
    return null;
  }

  if (
    typeof token.accessTokenExpires === "number" &&
    Date.now() < token.accessTokenExpires - 60_000
  ) {
    return token.accessToken;
  }

  const refreshedToken = await refreshGoogleAccessToken(token);

  return typeof refreshedToken.accessToken === "string"
    ? refreshedToken.accessToken
    : null;
}

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          access_type: "offline",
          include_granted_scopes: "true",
          prompt: "consent",
          scope: googleDriveScopes.join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          accessTokenExpires:
            typeof account.expires_at === "number"
              ? account.expires_at * 1000
              : Date.now() + 3600 * 1000,
          refreshToken: account.refresh_token ?? token.refreshToken,
          authError: undefined,
        };
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires - 60_000
      ) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      return {
        ...session,
        hasDriveAccess: Boolean(token.accessToken || token.refreshToken),
        authError:
          typeof token.authError === "string" ? token.authError : undefined,
      };
    },
  },
};
