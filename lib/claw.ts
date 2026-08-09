import { enqueueOutbox, enqueueOutboxMany } from "@/lib/outbox";

const CLAW_BASE = "https://claw-messenger.onrender.com";

/** openclaw-imessage = send via your Mac iMessage (781). claw = Claw Messenger agent line. */
export function messageTransport() {
  return (process.env.MESSAGE_TRANSPORT || "openclaw-imessage").trim();
}

function apiKey() {
  const key = process.env.CLAW_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing CLAW_API_KEY");
  }
  return key;
}

export function normalizePhone(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (hasPlus && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return "";
}

export async function registerRoute(phoneNumber: string) {
  const response = await fetch(`${CLAW_BASE}/api/routes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone_number: phoneNumber }),
  });

  // Route may already exist; don't fail the whole flow.
  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    console.warn("Claw registerRoute failed", response.status, text);
  }
}

export async function sendText(phoneNumber: string, text: string) {
  if (messageTransport() === "openclaw-imessage") {
    const message = await enqueueOutbox(phoneNumber, text);
    return { ok: true, transport: "openclaw-imessage", id: message.id };
  }

  return sendViaClaw(phoneNumber, text);
}

export async function sendTexts(phoneNumber: string, texts: string[]) {
  if (messageTransport() === "openclaw-imessage") {
    const messages = await enqueueOutboxMany(phoneNumber, texts);
    return { ok: true, transport: "openclaw-imessage", ids: messages.map((m) => m.id) };
  }

  for (const text of texts) {
    await sendViaClaw(phoneNumber, text);
  }
  return { ok: true, transport: "claw" };
}

async function sendViaClaw(phoneNumber: string, text: string) {

  const response = await fetch(`${CLAW_BASE}/api/agent/send-message`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      text,
      claim_route: true,
    }),
  });

  const body = await response.text();
  let json: unknown = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = { raw: body };
  }

  if (!response.ok) {
    throw new Error(
      typeof json === "object" && json && "error" in json
        ? String((json as { error: unknown }).error)
        : `Claw send failed (${response.status})`,
    );
  }

  return json;
}

export const IDENTITY_MESSAGES = [
  "Hey welcome to chat.inc!",
  "Reply with your LinkedIn so we know who you are.",
  "After that you'll get your first (paid) question!",
] as const;

export const SAMPLE_QUESTION =
  "What payroll provider does your company use (ADP, Rippling, Gusto, Deel) and what's your experience with it? (up to $20 reward)";

export const THANKS_MESSAGE = "Got it — here’s your paid question:";
