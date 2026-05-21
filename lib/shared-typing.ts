export type SharedTypingStatus = {
  clientId: string;
  updatedAt: string;
};

type PresenceRecord = {
  updatedAt: string;
};

const defaultHistoryRepo = "andreskgkg/chat.inc";
const defaultPresenceIssueNumber = "2";
const typingWindowMs = 5000;

type TypingState = {
  source?: string;
  version?: number;
  clients?: Record<string, PresenceRecord>;
  typing?: Record<string, SharedTypingStatus>;
};

type GitHubIssue = {
  body: string | null;
};

export async function setSharedTypingStatus(clientId: string, active: boolean) {
  const sanitizedClientId = sanitizeClientId(clientId);

  if (!sanitizedClientId) {
    return;
  }

  const issue = await githubFetch<GitHubIssue>(presenceIssuePath());
  const state = parseTypingState(issue.body);

  pruneInactiveTyping(state);

  if (active) {
    state.typing[sanitizedClientId] = {
      clientId: sanitizedClientId,
      updatedAt: new Date().toISOString(),
    };
  } else {
    delete state.typing[sanitizedClientId];
  }

  await writeTypingState(state);
}

export async function isSomeoneElseTyping(clientId: string) {
  const sanitizedClientId = sanitizeClientId(clientId);
  const issue = await githubFetch<GitHubIssue>(presenceIssuePath());
  const state = parseTypingState(issue.body);

  pruneInactiveTyping(state);

  return Object.values(state.typing).some((status) => {
    return status.clientId !== sanitizedClientId;
  });
}

function parseTypingState(body: string | null): Required<TypingState> {
  try {
    const parsed = JSON.parse(body || "{}") as TypingState;

    return {
      source: parsed.source || "chat.inc",
      version: 1,
      clients: sanitizePresenceMap(parsed.clients),
      typing: sanitizeTypingMap(parsed.typing),
    };
  } catch {
    return {
      source: "chat.inc",
      version: 1,
      clients: {},
      typing: {},
    };
  }
}

function sanitizePresenceMap(statuses: TypingState["clients"]) {
  const sanitizedStatuses: Record<string, PresenceRecord> = {};

  for (const [clientId, status] of Object.entries(statuses || {})) {
    const sanitizedClientId = sanitizeClientId(clientId);

    if (sanitizedClientId && typeof status.updatedAt === "string") {
      sanitizedStatuses[sanitizedClientId] = {
        updatedAt: status.updatedAt,
      };
    }
  }

  return sanitizedStatuses;
}

function sanitizeTypingMap(statuses: TypingState["typing"]) {
  const sanitizedStatuses: Record<string, SharedTypingStatus> = {};

  for (const status of Object.values(statuses || {})) {
    const sanitizedStatus = sanitizeTypingStatus(status);

    if (sanitizedStatus) {
      sanitizedStatuses[sanitizedStatus.clientId] = sanitizedStatus;
    }
  }

  return sanitizedStatuses;
}

function pruneInactiveTyping(state: Required<TypingState>) {
  const activeAfter = Date.now() - typingWindowMs;

  for (const [clientId, status] of Object.entries(state.typing)) {
    if (new Date(status.updatedAt).getTime() < activeAfter) {
      delete state.typing[clientId];
    }
  }
}

function sanitizeTypingStatus(status: Partial<SharedTypingStatus> | null | undefined) {
  if (!status || typeof status.updatedAt !== "string") {
    return null;
  }

  const clientId = sanitizeClientId(status.clientId);

  if (!clientId) {
    return null;
  }

  return {
    clientId,
    updatedAt: status.updatedAt,
  } satisfies SharedTypingStatus;
}

async function writeTypingState(state: Required<TypingState>) {
  await githubFetch(presenceIssuePath(), {
    body: JSON.stringify({
      body: JSON.stringify(state),
    }),
    method: "PATCH",
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
    throw new Error(`GitHub typing request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function presenceIssuePath() {
  return `/repos/${historyRepo()}/issues/${presenceIssueNumber()}`;
}

function historyRepo() {
  return process.env.GITHUB_HISTORY_REPO || defaultHistoryRepo;
}

function presenceIssueNumber() {
  return process.env.GITHUB_PRESENCE_ISSUE_NUMBER || defaultPresenceIssueNumber;
}

function sanitizeClientId(clientId: unknown) {
  return typeof clientId === "string"
    ? clientId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120)
    : "";
}
