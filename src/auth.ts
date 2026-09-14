import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";

import { authSecret, kompassiOidc } from "@/config";
import prisma from "@/prisma";

// TODO make this expire at the same time as the Kompassi access token
// currently we just assume this is the validity period of the Kompassi access token
const fallbackMaxAge = 10 * 60 * 60; // 10 hours

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  // The app is only ever reached through the cluster ingress, which sets the Host header itself.
  trustHost: true,
  providers: [
    {
      id: "kompassi",
      name: "Kompassi",
      type: "oidc",
      // PKCE binds the code to this login, nonce binds the ID token to it; PKCE alone is the default.
      checks: ["pkce", "state", "nonce"],

      profile(profile) {
        return {
          image: null,
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      },
      ...kompassiOidc,
    },
  ],

  // session.maxAge governs both the session cookie's Max-Age and the
  // database session row's expires; without it set explicitly it defaults
  // to Auth.js's 30 days, letting stale sessions vastly outlive the
  // Kompassi access token they're associated with.
  session: {
    maxAge: fallbackMaxAge,
  },

  // NOTE: if you ever need authenticated access to Kompassi API, look at auth.ts in Kompassi
};

export const { handlers, auth } = NextAuth(config);
