import { readJsonFile, updateJsonFile } from "@/lib/json-store";

export type LeadStatus =
  | "awaiting_identity"
  | "pending_approval"
  | "q1_sent"
  | "q1_answered"
  | "awaiting_more"
  | "q2_sent"
  | "q2_answered"
  | "q3_sent"
  | "q3_answered"
  | "done"
  | "rejected";

export type Lead = {
  phone: string;
  createdAt: string;
  status: LeadStatus;
  identity?: string;
  linkedin?: string;
  answers?: {
    q1?: string;
    q2?: string;
    q3?: string;
  };
  followUps?: string[];
  pendingPay?: {
    question: "q1" | "q2" | "q3";
    amount: number;
    answer: string;
  };
  updatedAt: string;
};

type LeadStore = {
  leads: Record<string, Lead>;
};

const STORE_PATH = "leads.json";

async function readStore(): Promise<LeadStore> {
  const parsed = await readJsonFile<LeadStore>(STORE_PATH, { leads: {} });
  return { leads: parsed.leads ?? {} };
}

export async function upsertLead(lead: Lead) {
  await updateJsonFile<LeadStore>(STORE_PATH, { leads: {} }, (store) => ({
    leads: { ...(store.leads ?? {}), [lead.phone]: lead },
  }));
  return lead;
}

export async function getLead(phone: string) {
  const store = await readStore();
  return store.leads[phone] ?? null;
}

export async function findLeadByLinkedIn(linkedin: string) {
  const needle = normalizeLinkedIn(linkedin);
  if (!needle) return null;

  const store = await readStore();
  return (
    Object.values(store.leads).find((lead) => {
      const candidate = normalizeLinkedIn(lead.linkedin || lead.identity || "");
      return candidate && candidate === needle;
    }) ?? null
  );
}

/** Most recently updated lead waiting for admin approve/reject. */
export async function findLatestPendingApproval() {
  const store = await readStore();
  return (
    Object.values(store.leads)
      .filter((lead) => lead.status === "pending_approval")
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )[0] ?? null
  );
}

export function normalizeLinkedIn(input: string) {
  const match = input.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i,
  );
  if (!match) return "";
  return match[0]
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

export function extractLinkedIn(input: string) {
  const match = input.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?/i,
  );
  if (!match) return "";
  const raw = match[0];
  return raw.startsWith("http")
    ? raw.replace(/\/$/, "")
    : `https://${raw.replace(/\/$/, "")}`;
}
