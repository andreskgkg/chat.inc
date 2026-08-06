import { NextResponse } from "next/server";
import {
  SAMPLE_QUESTION,
  THANKS_MESSAGE,
  normalizePhone,
  sendText,
} from "@/lib/claw";
import { getLead, upsertLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InboundBody = {
  type?: string;
  phone_number?: string;
  phone?: string;
  from?: string;
  text?: string;
  body?: string;
  message?: string | { text?: string; body?: string };
  data?: {
    phone_number?: string;
    phone?: string;
    text?: string;
    body?: string;
  };
};

function extractPhone(payload: InboundBody) {
  return normalizePhone(
    payload.phone_number ||
      payload.phone ||
      payload.from ||
      payload.data?.phone_number ||
      payload.data?.phone ||
      "",
  );
}

function extractText(payload: InboundBody) {
  if (typeof payload.text === "string") return payload.text.trim();
  if (typeof payload.body === "string") return payload.body.trim();
  if (typeof payload.message === "string") return payload.message.trim();
  if (payload.message && typeof payload.message === "object") {
    return (payload.message.text || payload.message.body || "").trim();
  }
  return (payload.data?.text || payload.data?.body || "").trim();
}

export async function POST(request: Request) {
  try {
    const secret = process.env.CLAW_WEBHOOK_SECRET?.trim();
    if (secret) {
      const header =
        request.headers.get("x-claw-signature") ||
        request.headers.get("authorization") ||
        "";
      if (!header.includes(secret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = (await request.json()) as InboundBody;

    if (payload.type && payload.type !== "message") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const phone = extractPhone(payload);
    const text = extractText(payload);

    if (!phone || !text) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const lead = await getLead(phone);

    if (!lead || lead.status === "question_sent") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await upsertLead({
      ...lead,
      identity: text,
      status: "question_sent",
      updatedAt: new Date().toISOString(),
    });

    await sendText(phone, `${THANKS_MESSAGE}\n\n${SAMPLE_QUESTION}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("claw inbound failed", error);
    return NextResponse.json({ error: "Inbound handling failed" }, { status: 500 });
  }
}
