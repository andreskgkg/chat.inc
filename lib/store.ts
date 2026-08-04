import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Comment, Prediction, StoreData, VoteValue } from "./types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

const seed: StoreData = {
  predictions: [
    {
      id: "seed-spacex-robinhood",
      text: "SpaceX will acquire Robinhood",
      author: "andres",
      createdAt: new Date().toISOString(),
      votes: {},
      comments: [],
    },
  ],
};

async function ensureDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as StoreData;

    if (!Array.isArray(parsed.predictions)) {
      return structuredClone(seed);
    }

    return parsed;
  } catch {
    const initial = structuredClone(seed);
    await writeStore(initial);
    return initial;
  }
}

async function writeStore(data: StoreData) {
  await ensureDir();
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

export async function listPredictions() {
  const store = await readStore();
  return [...store.predictions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createPrediction(text: string) {
  const store = await readStore();
  const prediction: Prediction = {
    id: randomUUID(),
    text: text.trim(),
    author: "andres",
    createdAt: new Date().toISOString(),
    votes: {},
    comments: [],
  };

  store.predictions.unshift(prediction);
  await writeStore(store);
  return prediction;
}

export async function votePrediction(
  predictionId: string,
  voterId: string,
  value: VoteValue | 0,
) {
  const store = await readStore();
  const prediction = store.predictions.find((item) => item.id === predictionId);

  if (!prediction) {
    return null;
  }

  if (value === 0) {
    delete prediction.votes[voterId];
  } else {
    prediction.votes[voterId] = value;
  }

  await writeStore(store);
  return prediction;
}

export async function addComment(
  predictionId: string,
  author: string,
  body: string,
) {
  const store = await readStore();
  const prediction = store.predictions.find((item) => item.id === predictionId);

  if (!prediction) {
    return null;
  }

  const comment: Comment = {
    id: randomUUID(),
    predictionId,
    author: author.trim() || "anonymous",
    body: body.trim(),
    createdAt: new Date().toISOString(),
    votes: {},
  };

  prediction.comments.push(comment);
  await writeStore(store);
  return comment;
}

export async function voteComment(
  commentId: string,
  voterId: string,
  value: VoteValue | 0,
) {
  const store = await readStore();

  for (const prediction of store.predictions) {
    const comment = prediction.comments.find((item) => item.id === commentId);

    if (!comment) continue;

    if (value === 0) {
      delete comment.votes[voterId];
    } else {
      comment.votes[voterId] = value;
    }

    await writeStore(store);
    return { comment, predictionId: prediction.id };
  }

  return null;
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return false;
  }

  return password === expected;
}
