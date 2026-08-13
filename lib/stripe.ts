// Stripe Connect Express: onboard an expert once, then pay them repeatedly.
// Uses the REST API directly (form-encoded) so we don't add a dependency.
import crypto from "node:crypto";

const SECRET = (process.env.STRIPE_SECRET_KEY || "").trim();
const API = "https://api.stripe.com/v1";
// "instant" -> debit card in ~30 min (small fee); "standard" -> bank in ~2 days.
const PAYOUT_METHOD = (process.env.STRIPE_PAYOUT_METHOD || "instant").trim();

export function stripeReady() {
  return SECRET.startsWith("sk_");
}

type StripeObject = Record<string, unknown> & {
  id?: string;
  url?: string;
  error?: { message?: string };
};

function form(obj: Record<string, string | number | boolean>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) params.append(key, String(value));
  return params.toString();
}

async function stripe(
  path: string,
  body?: Record<string, string | number | boolean>,
  connectedAccount?: string,
): Promise<StripeObject> {
  if (!stripeReady()) throw new Error("Stripe is not configured");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${SECRET}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (connectedAccount) headers["Stripe-Account"] = connectedAccount;

  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? form(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json()) as StripeObject;
  if (!res.ok) {
    throw new Error(`Stripe: ${json.error?.message || `HTTP ${res.status}`}`);
  }
  return json;
}

export async function createExpressAccount(email?: string) {
  const acct = await stripe("/accounts", {
    type: "express",
    country: "US",
    business_type: "individual",
    "capabilities[transfers][requested]": true,
    ...(email ? { email } : {}),
  });
  return acct.id as string;
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
) {
  const link = await stripe("/account_links", {
    account: accountId,
    type: "account_onboarding",
    refresh_url: refreshUrl,
    return_url: returnUrl,
  });
  return link.url as string;
}

export async function getAccount(accountId: string) {
  const acct = await stripe(`/accounts/${accountId}`);
  return {
    id: acct.id as string,
    payouts_enabled: Boolean(acct.payouts_enabled),
    charges_enabled: Boolean(acct.charges_enabled),
    details_submitted: Boolean(acct.details_submitted),
  };
}

/** Fund the expert's connected balance, then pay it out to them. */
export async function pay(accountId: string, amountCents: number) {
  const instant = PAYOUT_METHOD === "instant";
  // Cover the instant-payout fee (~1.5%) so the expert nets the full amount.
  const buffer = instant ? Math.max(50, Math.ceil(amountCents * 0.02)) : 0;

  const transfer = await stripe("/transfers", {
    amount: amountCents + buffer,
    currency: "usd",
    destination: accountId,
  });

  let payout: StripeObject;
  try {
    payout = await stripe(
      "/payouts",
      {
        amount: amountCents,
        currency: "usd",
        ...(instant ? { method: "instant" } : {}),
      },
      accountId,
    );
  } catch (error) {
    if (!instant) throw error;
    // Fall back to a standard payout if instant isn't available.
    payout = await stripe(
      "/payouts",
      { amount: amountCents, currency: "usd" },
      accountId,
    );
  }

  return {
    transferId: transfer.id as string,
    payoutId: payout.id as string,
  };
}

export function verifyWebhook(
  payload: string,
  signatureHeader: string,
  secret: string,
) {
  if (!secret) return true; // no secret set (dev) -> accept
  const parts = Object.fromEntries(
    signatureHeader
      .split(",")
      .map((kv) => kv.split("=", 2) as [string, string]),
  );
  const timestamp = parts["t"];
  const sig = parts["v1"];
  if (!timestamp || !sig) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}
