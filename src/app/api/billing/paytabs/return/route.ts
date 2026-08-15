import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("respStatus") || url.searchParams.get("status") || "pending";
  const result = status.toLowerCase() === "a" || status.toLowerCase() === "success" ? "success" : status.toLowerCase() === "c" || status.toLowerCase() === "cancel" ? "canceled" : "pending";
  return NextResponse.redirect(new URL(`/tarifs?payment=${result}`, url.origin));
}
