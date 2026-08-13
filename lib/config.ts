export function appUrl() {
  const raw = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://chat.inc"
  ).trim();
  return raw.replace(/\/$/, "");
}
