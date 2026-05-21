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

type NormalizedVoteState = {
  source: string;
  version: number;
  votes: Record<string, Required<VoteRecord>>;
};

type GitHubIssueComment = {
  body: string | null;
  created_at: string;
};

type VoteCommentBody = {
  source?: string;
  version?: number;
  vote?: {
    active?: boolean;
    clientId?: string;
    createdAt?: string;
    messageId?: string;
  };
};

export async function readVotes(clientId?: string): Promise<VotePayload> {
  const [state, messages] = await Promise.all([readVoteState(), readSharedMessages()]);

  return votePayloadFromState(state, messages, sanitizeClientId(clientId));
}

export async function toggleVote(messageId: string, clientId: string) {
  const sanitizedMessageId = sanitizeMessageId(messageId);
  const sanitizedClientId = sanitizeClientId(clientId);

  if (!sanitizedMessageId || !sanitizedClientId) {
    return readVotes(clientId);
  }

  const [state, messages] = await Promise.all([readVoteState(), readSharedMessages()]);
  const record = state.votes[sanitizedMessageId] || { voters: [] };
  const voterSet = new Set(record.voters);
  const active = !voterSet.has(sanitizedClientId);

  if (active) {
    voterSet.add(sanitizedClientId);
  } else {
    voterSet.delete(sanitizedClientId);
  }

  if (voterSet.size === 0) {
    delete state.votes[sanitizedMessageId];
  } else {
    state.votes[sanitizedMessageId] = {
      voters: [...voterSet],
    };
  }

  await createVoteComment(
    voteCommentBody({
      active,
      clientId: sanitizedClientId,
      messageId: sanitizedMessageId,
    }),
  );

  return votePayloadFromState(state, messages, sanitizedClientId);
}

async function readVoteState(): Promise<NormalizedVoteState> {
  const comments = await readVoteComments();

  return stateFromVoteComments(comments);
}

async function readVoteComments() {
  const comments: GitHubIssueComment[] = [];

  for (let page = 1; ; page += 1) {
    const pageComments = await githubFetch<GitHubIssueComment[]>(
      `${votesIssuePath()}/comments?per_page=100&page=${page}`,
    );

    comments.push(...pageComments);

    if (pageComments.length < 100) {
      return comments;
    }
  }
}

async function createVoteComment(body: string) {
  await githubFetch(`${votesIssuePath()}/comments`, {
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
    throw new Error(`GitHub votes request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function stateFromVoteComments(comments: GitHubIssueComment[]): NormalizedVoteState {
  const state: NormalizedVoteState = {
    source: "chat.inc",
    version: 1,
    votes: {},
  };

  for (const comment of comments) {
    const vote = commentToVote(comment);

    if (!vote) {
      continue;
    }

    const record = state.votes[vote.messageId] || { voters: [] };
    const voterSet = new Set(record.voters);

    if (vote.active) {
      voterSet.add(vote.clientId);
    } else {
      voterSet.delete(vote.clientId);
    }

    if (voterSet.size === 0) {
      delete state.votes[vote.messageId];
    } else {
      state.votes[vote.messageId] = {
        voters: [...voterSet],
      };
    }
  }

  return state;
}

function commentToVote(comment: GitHubIssueComment) {
  try {
    const parsed = JSON.parse(comment.body || "{}") as VoteCommentBody;
    const messageId = sanitizeMessageId(parsed.vote?.messageId);
    const clientId = sanitizeClientId(parsed.vote?.clientId);

    if (!messageId || !clientId || typeof parsed.vote?.active !== "boolean") {
      return null;
    }

    return {
      active: parsed.vote.active,
      clientId,
      createdAt: parsed.vote.createdAt || comment.created_at,
      messageId,
    };
  } catch {
    return null;
  }
}

function voteCounts(state: NormalizedVoteState) {
  return Object.fromEntries(
    Object.entries(state.votes).map(([messageId, record]) => [
      messageId,
      record.voters.length,
    ]),
  );
}

function votePayloadFromState(
  state: NormalizedVoteState,
  messages: Awaited<ReturnType<typeof readSharedMessages>>,
  clientId: string,
): VotePayload {
  const votes = voteCounts(state);
  const userVotes = Object.entries(state.votes)
    .filter(([, record]) => record.voters.includes(clientId))
    .map(([messageId]) => messageId);
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

function voteCommentBody(vote: { active: boolean; clientId: string; messageId: string }) {
  return JSON.stringify({
    source: "chat.inc",
    version: 1,
    vote: {
      ...vote,
      createdAt: new Date().toISOString(),
    },
  } satisfies VoteCommentBody);
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
