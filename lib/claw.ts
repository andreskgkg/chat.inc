const CLAW_BASE = "https://claw-messenger.onrender.com";

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

export const IDENTITY_MESSAGE =
  "Welcome to chat.inc — reply with your LinkedIn or X profile so we can match you with the right questions.";

export const SAMPLE_QUESTION =
  "How was your experience working with Gabor Gorondi? ($35)";

export const THANKS_MESSAGE =
  "Got it. Here’s a paid question you can answer whenever you have a minute:";
