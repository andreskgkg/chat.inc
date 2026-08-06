import { get, put } from "@vercel/blob";

export type LeadStatus = "awaiting_identity" | "question_sent";

export type Lead = {
  phone: string;
  createdAt: string;
  status: LeadStatus;
  identity?: string;
  updatedAt: string;
};

type LeadStore = {
  leads: Record<string, Lead>;
};

const STORE_PATH = "chat-inc/leads.json";

async function readStore(): Promise<LeadStore> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { leads: {} };
  }

  const blob = await get(STORE_PATH, {
    access: "private",
    useCache: false,
  });

  if (!blob?.stream) {
    return { leads: {} };
  }

  const raw = await new Response(blob.stream).text();
  const parsed = JSON.parse(raw) as LeadStore;
  return { leads: parsed.leads ?? {} };
}

async function writeStore(data: LeadStore) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }

  await put(STORE_PATH, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function upsertLead(lead: Lead) {
  const store = await readStore();
  store.leads[lead.phone] = lead;
  await writeStore(store);
  return lead;
}

export async function getLead(phone: string) {
  const store = await readStore();
  return store.leads[phone] ?? null;
}
