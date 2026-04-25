import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import TwitterProvider from "next-auth/providers/twitter";

export const authProviderIds = ["google", "twitter", "github"] as const;

type AuthProviderId = (typeof authProviderIds)[number];

type AuthProviderEnv = {
  clientId: string;
  clientSecret: string;
};

const providerEnv: Record<AuthProviderId, AuthProviderEnv> = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID ?? "",
    clientSecret: process.env.TWITTER_CLIENT_SECRET ?? "",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  },
};

export function getConfiguredAuthProviders() {
  return authProviderIds.filter((providerId) => {
    const env = providerEnv[providerId];

    return Boolean(env.clientId && env.clientSecret);
  });
}

function createConfiguredProviders() {
  const providers = [];

  if (providerEnv.google.clientId && providerEnv.google.clientSecret) {
    providers.push(
      GoogleProvider({
        clientId: providerEnv.google.clientId,
        clientSecret: providerEnv.google.clientSecret,
      }),
    );
  }

  if (providerEnv.twitter.clientId && providerEnv.twitter.clientSecret) {
    providers.push(
      TwitterProvider({
        clientId: providerEnv.twitter.clientId,
        clientSecret: providerEnv.twitter.clientSecret,
        version: "2.0",
      }),
    );
  }

  if (providerEnv.github.clientId && providerEnv.github.clientSecret) {
    providers.push(
      GitHubProvider({
        clientId: providerEnv.github.clientId,
        clientSecret: providerEnv.github.clientSecret,
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: createConfiguredProviders(),
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.provider === "string") {
        session.user.provider = token.provider;
      }

      return session;
    },
  },
};
