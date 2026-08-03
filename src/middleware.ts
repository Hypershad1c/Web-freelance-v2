import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Deliberately built from the Edge-safe authConfig only — NOT from "@/lib/auth" —
// so this middleware never pulls in Prisma/pg (which don't run on the Edge runtime).
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (!isAdminRoute) return NextResponse.next();

  const role = req.auth?.user?.role;
  if (!req.auth || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) {
    const signInUrl = new URL("/connexion", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
