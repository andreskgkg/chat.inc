/**
 * Durable JSON store for leads/outbox.
 * Prefers GitHub repo contents (GITHUB_TOKEN), then Supabase Storage.
 */

type GithubEnv = {
  token: string;
  repo: string;
};

class GithubConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubConflictError";
  }
}

function githubEnv(): GithubEnv | null {
  const token = process.env.GITHUB_TOKEN?.trim() || "";
  const repo =
    process.env.CHAT_INC_DATA_REPO?.trim() ||
    process.env.GITHUB_HISTORY_REPO?.trim() ||
    "andreskgkg/chat.inc";
  if (!token) return null;
  return { token, repo };
}

function supabaseEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .trim()
    .replace(/\\n/g, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "chat-inc",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readGithubWithMeta<T>(
  path: string,
  fallback: T,
): Promise<{ data: T; sha?: string }> {
  const env = githubEnv();
  if (!env) return { data: fallback };

  const response = await fetch(
    `https://api.github.com/repos/${env.repo}/contents/data/runtime/${path}`,
    {
      headers: githubHeaders(env.token),
      cache: "no-store",
    },
  );

  if (response.status === 404) return { data: fallback };
  if (!response.ok) {
    console.warn("github read", response.status, await response.text());
    return { data: fallback };
  }

  const body = (await response.json()) as {
    content?: string;
    encoding?: string;
    sha?: string;
  };
  if (!body.content) return { data: fallback, sha: body.sha };
  const json = Buffer.from(body.content, "base64").toString("utf8");
  return { data: JSON.parse(json) as T, sha: body.sha };
}

async function writeGithubWithSha<T>(
  path: string,
  data: T,
  sha?: string,
): Promise<void> {
  const env = githubEnv();
  if (!env) {
    throw new Error("Missing GITHUB_TOKEN for chat.inc storage");
  }

  const apiPath = `https://api.github.com/repos/${env.repo}/contents/data/runtime/${path}`;
  const content = Buffer.from(JSON.stringify(data, null, 2), "utf8").toString(
    "base64",
  );

  const response = await fetch(apiPath, {
    method: "PUT",
    headers: {
      ...githubHeaders(env.token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `chore: update ${path}`,
      content,
      sha,
    }),
  });

  if (response.ok) return;

  if (response.status === 409) {
    throw new GithubConflictError(await response.text());
  }

  throw new Error(
    `GitHub write failed (${response.status}): ${await response.text()}`,
  );
}

async function readGithub<T>(path: string, fallback: T): Promise<T> {
  const { data } = await readGithubWithMeta(path, fallback);
  return data;
}

async function writeGithub<T>(path: string, data: T): Promise<void> {
  const { sha } = await readGithubWithMeta(path, data);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await writeGithubWithSha(path, data, sha);
      return;
    } catch (error) {
      if (error instanceof GithubConflictError && attempt < 5) {
        const latest = await readGithubWithMeta(path, data);
        // Blind overwrite with fresh sha — callers that need merge should use updateJsonFile.
        await sleep(40 * (attempt + 1) + Math.floor(Math.random() * 40));
        try {
          await writeGithubWithSha(path, data, latest.sha);
          return;
        } catch (retryError) {
          if (retryError instanceof GithubConflictError) continue;
          throw retryError;
        }
      }
      throw error;
    }
  }
  throw new Error(`GitHub write failed after retries: ${path}`);
}

async function readSupabase<T>(path: string, fallback: T): Promise<T> {
  const env = supabaseEnv();
  if (!env) return fallback;

  const response = await fetch(
    `${env.url}/storage/v1/object/authenticated/chat-inc/${path}`,
    {
      headers: {
        Authorization: `Bearer ${env.key}`,
        apikey: env.key,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) return fallback;
  if (!response.ok) {
    console.warn("supabase read", response.status, await response.text());
    return fallback;
  }

  return (await response.json()) as T;
}

async function writeSupabase<T>(path: string, data: T): Promise<void> {
  const env = supabaseEnv();
  if (!env) {
    throw new Error("Missing Supabase credentials for chat.inc storage");
  }

  await fetch(`${env.url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.key}`,
      apikey: env.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: "chat-inc", name: "chat-inc", public: false }),
  });

  const body = JSON.stringify(data);
  const response = await fetch(
    `${env.url}/storage/v1/object/chat-inc/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.key}`,
        apikey: env.key,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body,
    },
  );

  if (!response.ok) {
    const put = await fetch(`${env.url}/storage/v1/object/chat-inc/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${env.key}`,
        apikey: env.key,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body,
    });
    if (!put.ok) {
      throw new Error(
        `Supabase write failed (${put.status}): ${await put.text()}`,
      );
    }
  }
}

export async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  if (githubEnv()) return readGithub(path, fallback);
  return readSupabase(path, fallback);
}

export async function writeJsonFile<T>(path: string, data: T): Promise<void> {
  if (githubEnv()) {
    await writeGithub(path, data);
    return;
  }
  await writeSupabase(path, data);
}

/** Read → update → write with conflict retries (safe under concurrent writers). */
export async function updateJsonFile<T>(
  path: string,
  fallback: T,
  updater: (current: T) => T,
): Promise<T> {
  if (!githubEnv()) {
    const current = await readSupabase(path, fallback);
    const next = updater(current);
    await writeSupabase(path, next);
    return next;
  }

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, sha } = await readGithubWithMeta(path, fallback);
    const next = updater(structuredClone(data));
    try {
      await writeGithubWithSha(path, next, sha);
      return next;
    } catch (error) {
      if (error instanceof GithubConflictError && attempt < 7) {
        await sleep(50 * (attempt + 1) + Math.floor(Math.random() * 50));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`GitHub update failed after retries: ${path}`);
}
