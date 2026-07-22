import type { NextAuthConfig } from "next-auth";

// This config must stay Edge-runtime-safe: no Prisma adapter, no providers that
// pull in Node-only packages (like `pg`). It's used by middleware.ts, which runs
// on the Edge runtime. The full config (with Prisma + Credentials) lives in auth.ts
// and is only ever imported from Node-runtime code (API routes, server components,
// server actions).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/connexion",
  },
  providers: [], // populated in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
