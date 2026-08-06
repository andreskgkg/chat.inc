import { NextResponse } from "next/server";
import {
  IDENTITY_MESSAGE,
  normalizePhone,
  registerRoute,
  sendText,
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
    await sendText(phone, IDENTITY_MESSAGE);

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
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not start texting.",
      },
      { status: 500 },
    );
  }
}
