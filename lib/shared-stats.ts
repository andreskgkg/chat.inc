import { readSharedMessages } from "@/lib/shared-chat";

export type ChatStats = {
  peopleConnected: number;
  messagesSent: number;
  daysRunning: number;
};

const defaultHistoryRepo = "andreskgkg/chat.inc";
const defaultPresenceIssueNumber = "2";
const launchDate = new Date("2026-05-21T00:00:00-07:00");
const activeWindowMs = 60_000;

type PresenceRecord = {
  updatedAt: string;
};

type PresenceState = {
  source?: string;
  version?: number;
  clients?: Record<string, PresenceRecord>;
};

type GitHubIssue = {
  body: string | null;
};

export async function getChatStats(clientId?: string, active?: boolean): Promise<ChatStats> {
  const [presence, messages] = await Promise.all([
    updatePresence(clientId, active),
    readSharedMessages().catch(() => []),
  ]);

  return {
    peopleConnected: countActiveClients(presence),
    messagesSent: messages.length,
    daysRunning: daysSinceLaunch(),
  };
}

async function updatePresence(clientId?: string, active?: boolean) {
  const issue = await githubFetch<GitHubIssue>(presenceIssuePath());
  const state = parsePresenceState(issue.body);
  const sanitizedClientId = sanitizeClientId(clientId);

  pruneInactiveClients(state);

  if (sanitizedClientId) {
    if (active) {
      state.clients[sanitizedClientId] = {
        updatedAt: new Date().toISOString(),
      };
    } else if (active === false) {
      delete state.clients[sanitizedClientId];
    }

    await githubFetch(presenceIssuePath(), {
      body: JSON.stringify({
        body: JSON.stringify(state),
      }),
      method: "PATCH",
    });
  }

  return state;
}

function parsePresenceState(body: string | null): Required<PresenceState> {
  try {
    const parsed = JSON.parse(body || "{}") as PresenceState;

    return {
      source: parsed.source || "chat.inc",
      version: 1,
      clients: parsed.clients || {},
    };
  } catch {
    return {
      source: "chat.inc",
      version: 1,
      clients: {},
    };
  }
}

function pruneInactiveClients(state: Required<PresenceState>) {
  const activeAfter = Date.now() - activeWindowMs;

  for (const [clientId, record] of Object.entries(state.clients)) {
    if (new Date(record.updatedAt).getTime() < activeAfter) {
      delete state.clients[clientId];
    }
  }
}

function countActiveClients(state: Required<PresenceState>) {
  pruneInactiveClients(state);

  return Object.keys(state.clients).length;
}

function daysSinceLaunch() {
  const elapsedMs = Date.now() - launchDate.getTime();

  return Math.max(1, Math.floor(elapsedMs / 86_400_000) + 1);
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
    throw new Error(`GitHub stats request failed with ${response.status}.`);
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
