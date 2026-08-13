// Simple single-admin auth for the /admin dashboard (password -> signed cookie).
import crypto from "node:crypto";
import { cookies } from "next/headers";

const PASSWORD = (process.env.ADMIN_PASSWORD || "").trim();
export const ADMIN_COOKIE = "cinc_admin";

export function adminConfigured() {
  return Boolean(PASSWORD);
}

/** Stable session token derived from the password. */
export function adminToken() {
  return crypto
    .createHash("sha256")
    .update(`chatinc:${PASSWORD}`)
    .digest("hex");
}

export function checkPassword(input: string) {
  if (!PASSWORD) return false;
  const a = Buffer.from(input || "");
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isAdmin() {
  if (!PASSWORD) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}
