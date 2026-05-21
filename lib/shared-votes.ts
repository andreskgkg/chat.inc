import { readSharedMessages } from "@/lib/shared-chat";

export type VoteSummary = {
  messageId: string;
  text: string;
  votes: number;
};

export type VotePayload = {
  top: VoteSummary[];
  userVotes: string[];
  votes: Record<string, number>;
};

const defaultHistoryRepo = "andreskgkg/chat.inc";
const defaultVotesIssueNumber = "3";
const maxTopMessages = 8;

type VoteRecord = {
  voters?: string[];
};

type VoteState = {
  source?: string;
  version?: number;
  votes?: Record<string, VoteRecord>;
};

type NormalizedVoteState = {
  source: string;
  version: number;
  votes: Record<string, Required<VoteRecord>>;
};

type GitHubIssue = {
  body: string | null;
};

export async function readVotes(clientId?: string): Promise<VotePayload> {
  const [state, messages] = await Promise.all([readVoteState(), readSharedMessages()]);
  const votes = voteCounts(state);
  const userVotes = clientId
    ? Object.entries(state.votes)
        .filter(([, record]) => record.voters.includes(sanitizeClientId(clientId)))
        .map(([messageId]) => messageId)
    : [];
  const top = messages
    .filter((message) => message.role === "assistant" && votes[message.id] > 0)
    .map((message) => ({
      messageId: message.id,
      text: message.text,
      votes: votes[message.id],
    }))
    .sort((firstMessage, secondMessage) => secondMessage.votes - firstMessage.votes)
    .slice(0, maxTopMessages);

  return {
    top,
    userVotes,
    votes,
  };
}

export async function toggleVote(messageId: string, clientId: string) {
  const sanitizedMessageId = sanitizeMessageId(messageId);
  const sanitizedClientId = sanitizeClientId(clientId);

  if (!sanitizedMessageId || !sanitizedClientId) {
    return readVotes(clientId);
  }

  const state = await readVoteState();
  const record = state.votes[sanitizedMessageId] || { voters: [] };
  const voterSet = new Set(record.voters);

  if (voterSet.has(sanitizedClientId)) {
    voterSet.delete(sanitizedClientId);
  } else {
    voterSet.add(sanitizedClientId);
  }

  if (voterSet.size === 0) {
    delete state.votes[sanitizedMessageId];
  } else {
    state.votes[sanitizedMessageId] = {
      voters: [...voterSet],
    };
  }

  await writeVoteState(state);

  return readVotes(clientId);
}

async function readVoteState(): Promise<NormalizedVoteState> {
  const issue = await githubFetch<GitHubIssue>(votesIssuePath());

  return parseVoteState(issue.body);
}

async function writeVoteState(state: NormalizedVoteState) {
  await githubFetch(votesIssuePath(), {
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
    throw new Error(`GitHub votes request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function parseVoteState(body: string | null): NormalizedVoteState {
  try {
    const parsed = JSON.parse(body || "{}") as VoteState;

    return {
      source: parsed.source || "chat.inc",
      version: 1,
      votes: normalizeVotes(parsed.votes),
    };
  } catch {
    return {
      source: "chat.inc",
      version: 1,
      votes: {},
    };
  }
}

function normalizeVotes(votes: VoteState["votes"]) {
  const normalizedVotes: NormalizedVoteState["votes"] = {};

  for (const [messageId, record] of Object.entries(votes || {})) {
    const sanitizedMessageId = sanitizeMessageId(messageId);

    if (!sanitizedMessageId || !Array.isArray(record.voters)) {
      continue;
    }

    normalizedVotes[sanitizedMessageId] = {
      voters: [...new Set(record.voters.map(sanitizeClientId).filter(Boolean))],
    };
  }

  return normalizedVotes;
}

function voteCounts(state: NormalizedVoteState) {
  return Object.fromEntries(
    Object.entries(state.votes).map(([messageId, record]) => [
      messageId,
      record.voters.length,
    ]),
  );
}

function votesIssuePath() {
  return `/repos/${historyRepo()}/issues/${votesIssueNumber()}`;
}

function historyRepo() {
  return process.env.GITHUB_HISTORY_REPO || defaultHistoryRepo;
}

function votesIssueNumber() {
  return process.env.GITHUB_VOTES_ISSUE_NUMBER || defaultVotesIssueNumber;
}

function sanitizeMessageId(messageId: unknown) {
  return typeof messageId === "string"
    ? messageId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 140)
    : "";
}

function sanitizeClientId(clientId: unknown) {
  return typeof clientId === "string"
    ? clientId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120)
    : "";
}
