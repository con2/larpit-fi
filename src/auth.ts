import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import { encode as defaultEncode } from "next-auth/jwt";

import { authSecret, kompassiOidc } from "@/config";
import { db } from "@/prisma/db";

// Assumed to match the validity period of the Kompassi access token.
const fallbackMaxAgeSeconds = 10 * 60 * 60;

const kompassiProvider = "kompassi";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
  }
}

interface KompassiProfile {
  sub: string;
  name?: string;
  email?: string;
}

/**
 * Finds the larpit.fi user for a Kompassi identity, creating the user and the account link on
 * first sign-in. An account row (provider + subject) is the authoritative link; a user without
 * one is matched by email, which is how the earlier database-session setup linked them.
 */
async function resolveUser(profile: KompassiProfile): Promise<string> {
  const account = await db.orm.public.Account.first({
    provider: kompassiProvider,
    providerAccountId: profile.sub,
  });
  if (account) return account.userId;

  const email = profile.email ?? "";
  const existing = email ? await db.orm.public.User.first({ email }) : null;
  const user =
    existing ??
    (await db.orm.public.User.create({
      email,
      name: profile.name ?? null,
    }));

  await db.orm.public.Account.create({
    userId: user.id,
    type: "oidc",
    provider: kompassiProvider,
    providerAccountId: profile.sub,
  });
  return user.id;
}

const config: NextAuthConfig = {
  secret: authSecret,
  // The app is only ever reached through the cluster ingress, which sets the Host header itself.
  trustHost: true,
  providers: [
    {
      id: kompassiProvider,
      name: "Kompassi",
      type: "oidc",
      // PKCE binds the code to this login, nonce binds the ID token to it; PKCE alone is the default.
      checks: ["pkce", "state", "nonce"],
      profile(profile: KompassiProfile) {
        return {
          id: profile.sub,
          name: profile.name ?? null,
          email: profile.email ?? null,
          image: null,
        };
      },
      ...kompassiOidc,
    },
  ],
  session: { strategy: "jwt", maxAge: fallbackMaxAgeSeconds },
  jwt: {
    maxAge: fallbackMaxAgeSeconds,
    // Make the session JWT expire together with the Kompassi access token it was issued for.
    encode(params) {
      const exp = params.token?.exp;
      const maxAge =
        typeof exp === "number"
          ? exp - Math.floor(Date.now() / 1000)
          : params.maxAge;
      return defaultEncode({ ...params, maxAge });
    },
  },
  logger: {
    error(error) {
      // Expected once the JWT outlives the Kompassi access token; the user simply signs in again.
      if (error.name === "JWTSessionError") return;
      console.error(error);
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        if (typeof account.expires_at === "number") {
          token.exp = account.expires_at;
        }
        const kompassi = profile as KompassiProfile;
        token.userId = await resolveUser(kompassi);
        token.email = kompassi.email ?? token.email;
      }
      return token;
    },
    session({ session, token }) {
      session.user = { ...session.user, id: token.userId ?? "" };
      return session;
    },
  },
};

export const { handlers, auth } = NextAuth(config);
