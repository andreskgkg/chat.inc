// Thin PostgREST client for Supabase (service-role, server-only).
// Avoids adding a dependency; talks to the auto-generated REST API.

const URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

const KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  ""
).trim();

export function supabaseReady() {
  return Boolean(URL && KEY);
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function handle(res: Response) {
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function base(table: string) {
  return `${URL}/rest/v1/${table}`;
}

export async function sbSelect<T>(table: string, query = ""): Promise<T[]> {
  if (!supabaseReady()) return [];
  const res = await fetch(`${base(table)}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  return ((await handle(res)) as T[]) ?? [];
}

export async function sbSelectOne<T>(
  table: string,
  query = "",
): Promise<T | null> {
  const rows = await sbSelect<T>(table, `${query}&limit=1`);
  return rows[0] ?? null;
}

export async function sbInsert<T>(table: string, row: object): Promise<T> {
  const res = await fetch(base(table), {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  const rows = (await handle(res)) as T[];
  return rows[0];
}

export async function sbUpdate<T>(
  table: string,
  query: string,
  patch: object,
): Promise<T[]> {
  const res = await fetch(`${base(table)}?${query}`, {
    method: "PATCH",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(patch),
  });
  return ((await handle(res)) as T[]) ?? [];
}

export async function sbUpsert<T>(
  table: string,
  row: object,
  onConflict: string,
): Promise<T> {
  const res = await fetch(`${base(table)}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: headers({
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify(row),
  });
  const rows = (await handle(res)) as T[];
  return rows[0];
}
