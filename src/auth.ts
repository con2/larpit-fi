import { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";

import { kompassiOidc } from "@/config";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/prisma";

// TODO make this expire at the same time as the Kompassi access token
// currently we just assume this is the validity period of the Kompassi access token
const fallbackMaxAge = 10 * 60 * 60; // 10 hours

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "kompassi",
      name: "Kompassi",
      type: "oauth",
      idToken: true,

      profile(profile, _tokens) {
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
  // to next-auth's 30 days, letting stale sessions vastly outlive the
  // Kompassi access token they're associated with.
  session: {
    maxAge: fallbackMaxAge,
  },

  // NOTE: if you ever need authenticated access to Kompassi API, look at auth.ts in Kompassi
};

export function auth() {
  return getServerSession(authOptions);
}
