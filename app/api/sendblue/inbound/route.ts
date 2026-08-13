import { NextResponse } from "next/server";
import { addMessage, getPersonByPhone } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { handleInbound } from "@/lib/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Inbound = {
  content?: string;
  number?: string;
  from_number?: string;
  is_outbound?: boolean;
  message_handle?: string;
  status?: string;
};

export async function POST(request: Request) {
  const secret = process.env.SENDBLUE_WEBHOOK_SECRET?.trim();
  if (secret) {
    const url = new URL(request.url);
    const provided =
      url.searchParams.get("secret") ||
      request.headers.get("x-webhook-secret") ||
      "";
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: Inbound;
  try {
    payload = (await request.json()) as Inbound;
  } catch {
    return NextResponse.json({ ok: true });
  }

  // Skip our own outbound messages + delivery-status callbacks.
  if (payload.is_outbound) {
    return NextResponse.json({ ok: true, outbound: true });
  }

  const phone = normalizePhone(payload.from_number || payload.number || "");
  const content = (payload.content || "").trim();
  if (!phone || !content) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const person = await getPersonByPhone(phone);
    await addMessage({
      person_id: person?.id ?? null,
      phone,
      direction: "in",
      body: content,
      provider_id: payload.message_handle ?? null,
      status: payload.status ?? "received",
    });
    const result = await handleInbound(phone, content);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("sendblue inbound failed", error);
    return NextResponse.json({ ok: true, error: true });
  }
}
