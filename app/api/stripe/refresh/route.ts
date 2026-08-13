import { NextResponse } from "next/server";
import { appUrl } from "@/lib/config";
import { ensureOnboardingLink } from "@/lib/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const person = new URL(request.url).searchParams.get("person");
  if (!person) return NextResponse.redirect(appUrl());
  try {
    const link = await ensureOnboardingLink(person);
    return NextResponse.redirect(link);
  } catch (error) {
    console.error("stripe refresh failed", error);
    return NextResponse.redirect(appUrl());
  }
}
