import { get, put } from "@vercel/blob";

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

const STORE_PATH = "chat-inc/outbox.json";

async function readStore(): Promise<OutboxStore> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { messages: [] };
  }

  const blob = await get(STORE_PATH, {
    access: "private",
    useCache: false,
  });

  if (!blob?.stream) {
    return { messages: [] };
  }

  const raw = await new Response(blob.stream).text();
  const parsed = JSON.parse(raw) as OutboxStore;
  return { messages: parsed.messages ?? [] };
}

async function writeStore(data: OutboxStore) {
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

export async function enqueueOutbox(phone: string, text: string) {
  const store = await readStore();
  const message: OutboxMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phone,
    text,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  store.messages.push(message);
  // Keep the file small.
  store.messages = store.messages.slice(-200);
  await writeStore(store);
  return message;
}

export async function claimOutbox(limit = 10) {
  const store = await readStore();
  const now = new Date().toISOString();
  const claimed: OutboxMessage[] = [];

  for (const message of store.messages) {
    if (claimed.length >= limit) break;
    if (message.status !== "pending") continue;
    message.status = "claimed";
    message.claimedAt = now;
    claimed.push(message);
  }

  if (claimed.length) {
    await writeStore(store);
  }

  return claimed;
}

export async function completeOutbox(
  id: string,
  result: { ok: true } | { ok: false; error: string },
) {
  const store = await readStore();
  const message = store.messages.find((item) => item.id === id);
  if (!message) return null;

  if (result.ok) {
    message.status = "sent";
    message.sentAt = new Date().toISOString();
    message.error = undefined;
  } else {
    message.status = "failed";
    message.error = result.error;
  }

  await writeStore(store);
  return message;
}
