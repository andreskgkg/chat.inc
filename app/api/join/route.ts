import { NextResponse } from "next/server";
import { startLead } from "@/lib/service";
import { supabaseReady } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!supabaseReady()) {
      return NextResponse.json(
        { error: "Texting isn't set up yet — try again soon." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { phone?: string };
    const person = await startLead(body.phone ?? "");
    return NextResponse.json({ ok: true, phone: person.phone });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not text you.";
    const status = /valid phone/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
