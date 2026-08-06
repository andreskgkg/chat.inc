import { NextResponse } from "next/server";
import { claimOutbox } from "@/lib/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.OUTBOX_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { limit?: number };
  const messages = await claimOutbox(
    typeof body.limit === "number" ? body.limit : 10,
  );

  return NextResponse.json({ messages });
}
