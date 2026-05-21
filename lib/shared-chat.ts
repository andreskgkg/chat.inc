import { get, put } from "@vercel/blob";

export type SharedChatRole = "user" | "assistant";

export type SharedChatMessage = {
  id: string;
  role: SharedChatRole;
  text: string;
  createdAt: string;
};

const sharedChatPath = "shared-chat/messages.json";
const maxStoredMessages = 240;
const maxMessageLength = 2000;
const maxAppendAttempts = 4;

type SharedChatLog = {
  version: 1;
  messages: SharedChatMessage[];
};

type SharedChatSnapshot = {
  etag?: string;
  messages: SharedChatMessage[];
};

export async function readSharedMessages() {
  const { messages } = await readSharedChatSnapshot();

  return messages;
}

export async function appendSharedMessages(messagesToAppend: SharedChatMessage[]) {
  const sanitizedMessages = messagesToAppend.map(sanitizeMessage).filter(isSharedChatMessage);

  if (sanitizedMessages.length === 0) {
    return;
  }

  for (let attempt = 1; attempt <= maxAppendAttempts; attempt += 1) {
    const snapshot = await readSharedChatSnapshot();
    const messages = mergeMessages(snapshot.messages, sanitizedMessages);

    try {
      await put(
        sharedChatPath,
        JSON.stringify({ version: 1, messages } satisfies SharedChatLog),
        {
          access: "private",
          allowOverwrite: Boolean(snapshot.etag),
          cacheControlMaxAge: 60,
          contentType: "application/json",
          ifMatch: snapshot.etag,
        },
      );

      return;
    } catch (error) {
      if (attempt === maxAppendAttempts) {
        throw error;
      }
    }
  }
}

export function createSharedMessage(role: SharedChatRole, text: string, id?: string): SharedChatMessage {
  return {
    id: id || `${role}-${crypto.randomUUID()}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

async function readSharedChatSnapshot(): Promise<SharedChatSnapshot> {
  const blob = await get(sharedChatPath, {
    access: "private",
    useCache: false,
  });

  if (!blob || blob.statusCode !== 200) {
    return { messages: [] };
  }

  const text = await new Response(blob.stream).text();
  const parsed = JSON.parse(text) as Partial<SharedChatLog>;

  return {
    etag: blob.blob.etag,
    messages: Array.isArray(parsed.messages)
      ? parsed.messages.map(sanitizeMessage).filter(isSharedChatMessage)
      : [],
  };
}

function mergeMessages(currentMessages: SharedChatMessage[], nextMessages: SharedChatMessage[]) {
  const messagesById = new Map<string, SharedChatMessage>();

  for (const message of [...currentMessages, ...nextMessages]) {
    messagesById.set(message.id, message);
  }

  return [...messagesById.values()]
    .sort((firstMessage, secondMessage) =>
      firstMessage.createdAt.localeCompare(secondMessage.createdAt),
    )
    .slice(-maxStoredMessages);
}

function sanitizeMessage(message: Partial<SharedChatMessage> | undefined | null) {
  if (!message || (message.role !== "user" && message.role !== "assistant")) {
    return null;
  }

  const text = typeof message.text === "string" ? message.text.trim() : "";

  if (!text) {
    return null;
  }

  return {
    id:
      typeof message.id === "string" && message.id.trim()
        ? message.id
        : `${message.role}-${crypto.randomUUID()}`,
    role: message.role,
    text: text.slice(0, maxMessageLength),
    createdAt:
      typeof message.createdAt === "string" && message.createdAt.trim()
        ? message.createdAt
        : new Date().toISOString(),
  } satisfies SharedChatMessage;
}

function isSharedChatMessage(
  message: SharedChatMessage | null,
): message is SharedChatMessage {
  return message !== null;
}
