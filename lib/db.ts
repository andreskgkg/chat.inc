// Domain data access for chat.inc (people, messages, questions, payouts).
import {
  sbInsert,
  sbSelect,
  sbSelectOne,
  sbUpdate,
  sbUpsert,
} from "@/lib/supabase";

export type PersonStatus =
  | "awaiting_identity"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "active"
  | "done";

export type Person = {
  id: string;
  phone: string;
  name: string | null;
  linkedin: string | null;
  identity: string | null;
  status: PersonStatus;
  stripe_account_id: string | null;
  payout_ready: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  person_id: string | null;
  phone: string;
  direction: "in" | "out";
  body: string;
  provider: string | null;
  provider_id: string | null;
  status: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Question = {
  id: string;
  person_id: string;
  text: string;
  amount_cents: number;
  status: "sent" | "answered" | "paid" | "skipped";
  answer: string | null;
  sent_at: string;
  answered_at: string | null;
  paid_at: string | null;
};

export type Payout = {
  id: string;
  person_id: string;
  question_id: string | null;
  amount_cents: number;
  status: "pending" | "paid" | "failed";
  stripe_transfer_id: string | null;
  stripe_payout_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

const enc = encodeURIComponent;

// ---- people ---------------------------------------------------------------

export function getPersonByPhone(phone: string) {
  return sbSelectOne<Person>("people", `select=*&phone=eq.${enc(phone)}`);
}

export function getPersonById(id: string) {
  return sbSelectOne<Person>("people", `select=*&id=eq.${enc(id)}`);
}

export function listPeople(status?: PersonStatus) {
  const filter = status ? `&status=eq.${enc(status)}` : "";
  return sbSelect<Person>(
    "people",
    `select=*${filter}&order=updated_at.desc`,
  );
}

export function listPendingApprovals() {
  return listPeople("pending_approval");
}

export function createPerson(phone: string) {
  return sbUpsert<Person>(
    "people",
    { phone, status: "awaiting_identity" },
    "phone",
  );
}

export async function updatePerson(id: string, patch: Partial<Person>) {
  const rows = await sbUpdate<Person>("people", `id=eq.${enc(id)}`, patch);
  return rows[0] ?? null;
}

// ---- messages -------------------------------------------------------------

export function addMessage(row: {
  person_id?: string | null;
  phone: string;
  direction: "in" | "out";
  body: string;
  provider?: string;
  provider_id?: string | null;
  status?: string | null;
  is_admin?: boolean;
}) {
  return sbInsert<Message>("messages", {
    provider: "sendblue",
    is_admin: false,
    ...row,
  });
}

export function listMessages(personId: string) {
  return sbSelect<Message>(
    "messages",
    `select=*&person_id=eq.${enc(personId)}&order=created_at.asc`,
  );
}

// ---- questions ------------------------------------------------------------

export function createQuestion(row: {
  person_id: string;
  text: string;
  amount_cents: number;
}) {
  return sbInsert<Question>("questions", { ...row, status: "sent" });
}

export function getOpenQuestion(personId: string) {
  return sbSelectOne<Question>(
    "questions",
    `select=*&person_id=eq.${enc(personId)}&status=eq.sent&order=sent_at.desc`,
  );
}

export function listQuestions(personId: string) {
  return sbSelect<Question>(
    "questions",
    `select=*&person_id=eq.${enc(personId)}&order=sent_at.desc`,
  );
}

export async function updateQuestion(id: string, patch: Partial<Question>) {
  const rows = await sbUpdate<Question>("questions", `id=eq.${enc(id)}`, patch);
  return rows[0] ?? null;
}

// ---- payouts --------------------------------------------------------------

export function createPayout(row: {
  person_id: string;
  question_id?: string | null;
  amount_cents: number;
  status?: Payout["status"];
}) {
  return sbInsert<Payout>("payouts", { status: "pending", ...row });
}

export async function updatePayout(id: string, patch: Partial<Payout>) {
  const rows = await sbUpdate<Payout>("payouts", `id=eq.${enc(id)}`, patch);
  return rows[0] ?? null;
}

export function listPayouts(personId: string) {
  return sbSelect<Payout>(
    "payouts",
    `select=*&person_id=eq.${enc(personId)}&order=created_at.desc`,
  );
}

// ---- settings -------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const row = await sbSelectOne<{ key: string; value: string }>(
    "settings",
    `select=*&key=eq.${enc(key)}`,
  );
  return row?.value ?? null;
}

export async function getDefaultAmountCents(): Promise<number> {
  const raw = await getSetting("default_amount_cents");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 2500;
}
