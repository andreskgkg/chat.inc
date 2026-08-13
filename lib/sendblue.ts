// Sendblue: send blue-bubble iMessages and log every outbound message.
import { addMessage } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

const API_ID = (process.env.SENDBLUE_API_KEY_ID || "").trim();
const API_SECRET = (process.env.SENDBLUE_API_SECRET || "").trim();
const FROM = (process.env.SENDBLUE_FROM_NUMBER || "").trim();
const ADMIN = normalizePhone(process.env.ADMIN_PHONE || "");

type SendOpts = { personId?: string | null; isAdmin?: boolean };

export function sendblueReady() {
  return Boolean(API_ID && API_SECRET);
}

type SendblueResponse = {
  message_handle?: string;
  status?: string;
  error_message?: string;
};

async function callSendblue(
  number: string,
  content: string,
): Promise<SendblueResponse> {
  const res = await fetch("https://api.sendblue.co/api/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "sb-api-key-id": API_ID,
      "sb-api-secret-key": API_SECRET,
    },
    body: JSON.stringify({
      number,
      content,
      ...(FROM ? { from_number: FROM } : {}),
    }),
  });

  const text = await res.text();
  let json: SendblueResponse = {};
  try {
    json = text ? (JSON.parse(text) as SendblueResponse) : {};
  } catch {
    json = {};
  }

  if (!res.ok) {
    throw new Error(
      `Sendblue ${res.status}: ${json.error_message || text || "send failed"}`,
    );
  }
  return json;
}

/** Send one iMessage and record it in the messages table. */
export async function sendText(
  phone: string,
  body: string,
  opts: SendOpts = {},
) {
  const number = normalizePhone(phone);
  if (!number || !body.trim()) {
    return { ok: false as const, reason: "invalid" };
  }

  if (!sendblueReady()) {
    await addMessage({
      person_id: opts.personId ?? null,
      phone: number,
      direction: "out",
      body,
      status: "unsent_no_config",
      is_admin: Boolean(opts.isAdmin),
    });
    return { ok: false as const, reason: "not_configured" };
  }

  try {
    const res = await callSendblue(number, body);
    await addMessage({
      person_id: opts.personId ?? null,
      phone: number,
      direction: "out",
      body,
      provider_id: res.message_handle ?? null,
      status: res.status ?? "sent",
      is_admin: Boolean(opts.isAdmin),
    });
    return { ok: true as const, handle: res.message_handle };
  } catch (error) {
    await addMessage({
      person_id: opts.personId ?? null,
      phone: number,
      direction: "out",
      body,
      status: "failed",
      is_admin: Boolean(opts.isAdmin),
    });
    throw error;
  }
}

/** Send several iMessages in order. */
export async function sendMany(
  phone: string,
  bodies: readonly string[],
  opts: SendOpts = {},
) {
  const results = [];
  for (const body of bodies) {
    results.push(await sendText(phone, body, opts));
  }
  return results;
}

/** Text yourself (admin) an alert. */
export async function notifyAdmin(body: string) {
  if (!ADMIN) return { ok: false as const, reason: "no_admin" };
  return sendText(ADMIN, body, { isAdmin: true });
}
