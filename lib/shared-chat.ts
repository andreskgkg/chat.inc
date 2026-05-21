import { get, list, put } from "@vercel/blob";

export type SharedChatRole = "user" | "assistant";

export type SharedChatMessage = {
  id: string;
  role: SharedChatRole;
  text: string;
  createdAt: string;
};

const sharedMessagesPrefix = "shared-chat/messages/";
const maxStoredMessages = 240;
const maxMessageLength = 2000;

export async function readSharedMessages() {
  const blobs = await list({
    limit: maxStoredMessages,
    prefix: sharedMessagesPrefix,
  });
  const messages = await Promise.all(
    blobs.blobs.map(async (blob) => {
      const storedMessage = await get(blob.pathname, {
        access: "private",
        useCache: false,
      });

      if (!storedMessage || storedMessage.statusCode !== 200) {
        return null;
      }

      const text = await new Response(storedMessage.stream).text();

      return sanitizeMessage(JSON.parse(text) as Partial<SharedChatMessage>);
    }),
  );

  return messages
    .filter(isSharedChatMessage)
    .sort((firstMessage, secondMessage) =>
      firstMessage.createdAt.localeCompare(secondMessage.createdAt),
    )
    .slice(-maxStoredMessages);
}

export async function appendSharedMessages(messagesToAppend: SharedChatMessage[]) {
  const sanitizedMessages = messagesToAppend.map(sanitizeMessage).filter(isSharedChatMessage);

  if (sanitizedMessages.length === 0) {
    return;
  }

  await Promise.all(
    sanitizedMessages.map((message) =>
      put(messagePath(message), JSON.stringify(message), {
        access: "private",
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: "application/json",
      }),
    ),
  );
}

export function createSharedMessage(role: SharedChatRole, text: string, id?: string): SharedChatMessage {
  return {
    id: id || `${role}-${crypto.randomUUID()}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
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

function messagePath(message: SharedChatMessage) {
  return `${sharedMessagesPrefix}${safePathSegment(message.id)}.json`;
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

function isSharedChatMessage(
  message: SharedChatMessage | null,
): message is SharedChatMessage {
  return message !== null;
}
