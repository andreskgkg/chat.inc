import { del, get, list, put } from "@vercel/blob";

export type SharedTypingStatus = {
  clientId: string;
  active: boolean;
  updatedAt: string;
};

const typingPrefix = "shared-chat/typing/";
const typingWindowMs = 5000;
const maxTypingStatuses = 500;

export async function setSharedTypingStatus(clientId: string, active: boolean) {
  const sanitizedClientId = sanitizeClientId(clientId);

  if (!sanitizedClientId) {
    return;
  }

  if (!active) {
    await del(typingPath(sanitizedClientId), {
      token: getBlobToken(),
    }).catch(() => undefined);
    return;
  }

  await put(
    typingPath(sanitizedClientId),
    JSON.stringify({
      clientId: sanitizedClientId,
      active: true,
      updatedAt: new Date().toISOString(),
    } satisfies SharedTypingStatus),
    {
      access: "public",
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
      token: getBlobToken(),
    },
  );
}

export async function isSomeoneElseTyping(clientId: string) {
  const sanitizedClientId = sanitizeClientId(clientId);
  const blobs = await list({
    limit: maxTypingStatuses,
    prefix: typingPrefix,
    token: getBlobToken(),
  });
  const statuses = await Promise.all(
    blobs.blobs.map(async (blob) => {
      try {
        const storedStatus = await get(blob.pathname, {
          access: "public",
          token: getBlobToken(),
          useCache: false,
        });

        if (!storedStatus || storedStatus.statusCode !== 200) {
          return null;
        }

        const text = await new Response(storedStatus.stream).text();

        return sanitizeTypingStatus(JSON.parse(text) as Partial<SharedTypingStatus>);
      } catch {
        return null;
      }
    }),
  );
  const activeAfter = Date.now() - typingWindowMs;

  return statuses.some((status) => {
    if (!status || status.clientId === sanitizedClientId || !status.active) {
      return false;
    }

    return new Date(status.updatedAt).getTime() >= activeAfter;
  });
}

function sanitizeTypingStatus(status: Partial<SharedTypingStatus> | null | undefined) {
  if (!status || status.active !== true || typeof status.updatedAt !== "string") {
    return null;
  }

  const clientId = sanitizeClientId(status.clientId);

  if (!clientId) {
    return null;
  }

  return {
    clientId,
    active: true,
    updatedAt: status.updatedAt,
  } satisfies SharedTypingStatus;
}

function typingPath(clientId: string) {
  return `${typingPrefix}${clientId}.json`;
}

function sanitizeClientId(clientId: unknown) {
  return typeof clientId === "string"
    ? clientId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120)
    : "";
}

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}
