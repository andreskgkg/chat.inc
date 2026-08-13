import { NextResponse } from "next/server";
import type { Person } from "@/lib/db";
import { updatePerson } from "@/lib/db";
import { verifyWebhook } from "@/lib/stripe";
import { sbSelectOne } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const raw = await request.text();
  const sig = request.headers.get("stripe-signature") || "";
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (!verifyWebhook(raw, sig, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (event.type === "account.updated") {
    const acct = event.data.object;
    const id = String(acct.id || "");
    if (id && acct.payouts_enabled) {
      const person = await sbSelectOne<Person>(
        "people",
        `select=*&stripe_account_id=eq.${encodeURIComponent(id)}`,
      );
      if (person && !person.payout_ready) {
        await updatePerson(person.id, { payout_ready: true });
      }
    }
  }

  return NextResponse.json({ received: true });
}
