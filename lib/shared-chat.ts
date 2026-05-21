export type SharedChatRole = "user" | "assistant";

export type SharedChatMessage = {
  id: string;
  role: SharedChatRole;
  text: string;
  createdAt: string;
};

const defaultHistoryRepo = "andreskgkg/chat.inc";
const historyCommentPageSize = 100;
const maxMessageLength = 2000;

export async function readSharedMessages() {
  const comments = await readHistoryComments();
  const messages = comments.map(commentToMessage);

  return messages
    .filter(isSharedChatMessage)
    .sort((firstMessage, secondMessage) =>
      firstMessage.createdAt.localeCompare(secondMessage.createdAt),
    );
}

export async function appendSharedMessages(messagesToAppend: SharedChatMessage[]) {
  const sanitizedMessages = messagesToAppend.map(sanitizeMessage).filter(isSharedChatMessage);

  if (sanitizedMessages.length === 0) {
    return;
  }

  await Promise.all(
    sanitizedMessages.map((message) => createHistoryComment(historyCommentBody(message))),
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

type GitHubIssueComment = {
  body: string | null;
  created_at: string;
};

type HistoryCommentBody = {
  source?: string;
  version?: number;
  message?: Partial<SharedChatMessage>;
};

async function readHistoryComments() {
  const comments: GitHubIssueComment[] = [];

  for (let page = 1; ; page += 1) {
    const pageComments = await githubFetch<GitHubIssueComment[]>(
      `/repos/${historyRepo()}/issues/${historyIssueNumber()}/comments?per_page=${historyCommentPageSize}&page=${page}`,
    );

    comments.push(...pageComments);

    if (pageComments.length < historyCommentPageSize) {
      return comments;
    }
  }
}

async function createHistoryComment(body: string) {
  await githubFetch(`/repos/${historyRepo()}/issues/${historyIssueNumber()}/comments`, {
    body: JSON.stringify({ body }),
    method: "POST",
  });
}

async function githubFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("Missing GITHUB_TOKEN environment variable.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub history request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function commentToMessage(comment: GitHubIssueComment) {
  try {
    const parsed = JSON.parse(comment.body || "") as HistoryCommentBody;
    const message = sanitizeMessage(parsed.message);

    return message
      ? {
          ...message,
          createdAt: message.createdAt || comment.created_at,
        }
      : null;
  } catch {
    return null;
  }
}

function historyCommentBody(message: SharedChatMessage) {
  return JSON.stringify({
    source: "chat.inc",
    version: 1,
    message,
  } satisfies HistoryCommentBody);
}

function historyRepo() {
  return process.env.GITHUB_HISTORY_REPO || defaultHistoryRepo;
}

function historyIssueNumber() {
  const issueNumber = process.env.GITHUB_HISTORY_ISSUE_NUMBER;

  if (!issueNumber) {
    throw new Error("Missing GITHUB_HISTORY_ISSUE_NUMBER environment variable.");
  }

  return issueNumber;
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
