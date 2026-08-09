import { updateJsonFile } from "@/lib/json-store";

export type OutboxMessage = {
  id: string;
  phone: string;
  text: string;
  createdAt: string;
  status: "pending" | "claimed" | "sent" | "failed";
  claimedAt?: string;
  sentAt?: string;
  error?: string;
};

type OutboxStore = {
  messages: OutboxMessage[];
};

const STORE_PATH = "outbox.json";
const EMPTY: OutboxStore = { messages: [] };

function makeMessage(phone: string, text: string): OutboxMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phone,
    text,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}

export async function enqueueOutbox(phone: string, text: string) {
  const message = makeMessage(phone, text);
  await updateJsonFile(STORE_PATH, EMPTY, (store) => {
    const messages = [...(store.messages ?? []), message].slice(-200);
    return { messages };
  });
  return message;
}

export async function enqueueOutboxMany(phone: string, texts: string[]) {
  const created = texts.map((text) => makeMessage(phone, text));
  await updateJsonFile(STORE_PATH, EMPTY, (store) => {
    const messages = [...(store.messages ?? []), ...created].slice(-200);
    return { messages };
  });
  return created;
}

export async function claimOutbox(limit = 10) {
  const claimed: OutboxMessage[] = [];
  const now = new Date().toISOString();

  await updateJsonFile(STORE_PATH, EMPTY, (store) => {
    claimed.length = 0;
    const messages = (store.messages ?? []).map((message) => {
      if (claimed.length >= limit || message.status !== "pending") {
        return message;
      }
      const next = { ...message, status: "claimed" as const, claimedAt: now };
      claimed.push(next);
      return next;
    });
    return { messages };
  });

  return claimed;
}

export async function completeOutbox(
  id: string,
  result: { ok: true } | { ok: false; error: string },
) {
  let updated: OutboxMessage | null = null;

  await updateJsonFile(STORE_PATH, EMPTY, (store) => {
    const messages = (store.messages ?? []).map((message) => {
      if (message.id !== id) return message;
      updated = result.ok
        ? {
            ...message,
            status: "sent",
            sentAt: new Date().toISOString(),
            error: undefined,
          }
        : {
            ...message,
            status: "failed",
            error: result.error,
          };
      return updated;
    });
    return { messages };
  });

  return updated;
}
