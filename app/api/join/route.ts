import { NextResponse } from "next/server";
import {
  IDENTITY_MESSAGES,
  normalizePhone,
  registerRoute,
  sendTexts,
} from "@/lib/claw";
import { upsertLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const phone = normalizePhone(body.phone ?? "");

    if (!phone) {
      return NextResponse.json(
        { error: "Enter a valid phone number." },
        { status: 400 },
      );
    }

    const transport = process.env.MESSAGE_TRANSPORT || "openclaw-imessage";
    if (transport !== "openclaw-imessage" && !process.env.CLAW_API_KEY) {
      return NextResponse.json(
        { error: "Texting isn’t configured yet. Add CLAW_API_KEY." },
        { status: 503 },
      );
    }

    if (transport !== "openclaw-imessage" && process.env.CLAW_API_KEY) {
      await registerRoute(phone);
    }

    await sendTexts(phone, [...IDENTITY_MESSAGES]);

    const now = new Date().toISOString();
    await upsertLead({
      phone,
      createdAt: now,
      updatedAt: now,
      status: "awaiting_identity",
    });

    return NextResponse.json({ ok: true, phone });
  } catch (error) {
    console.error("join failed", error);
    const raw = error instanceof Error ? error.message : "";
    const friendly =
      /GitHub|BLOB|Supabase|storage/i.test(raw)
        ? "Could not start texting. Please try again in a moment."
        : raw || "Could not start texting.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
