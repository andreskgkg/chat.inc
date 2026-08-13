import { NextResponse } from "next/server";
import { appUrl } from "@/lib/config";
import { refreshPayoutStatus } from "@/lib/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const person = new URL(request.url).searchParams.get("person");
  if (person) {
    try {
      await refreshPayoutStatus(person);
    } catch (error) {
      console.error("stripe return refresh failed", error);
    }
  }
  return NextResponse.redirect(`${appUrl()}/?payout=done`);
}
