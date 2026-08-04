import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Prediction, StoreData, VoteValue } from "./types";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

const seed: StoreData = {
  predictions: [
    {
      id: "seed-spacex-robinhood",
      text: "SpaceX will acquire Robinhood",
      createdAt: "2026-08-04T16:00:00.000Z",
      votes: {},
    },
  ],
};

type GlobalStore = typeof globalThis & {
  __chatIncStore?: StoreData;
};

function memory(): GlobalStore {
  return globalThis as GlobalStore;
}

function normalize(data: StoreData): StoreData {
  return {
    predictions: (data.predictions ?? []).map((prediction) => ({
      id: prediction.id,
      text: prediction.text,
      createdAt: prediction.createdAt,
      votes: prediction.votes ?? {},
    })),
  };
}

async function readStore(): Promise<StoreData> {
  const cached = memory().__chatIncStore;
  if (cached) return cached;

  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = normalize(JSON.parse(raw) as StoreData);

    if (!Array.isArray(parsed.predictions)) {
      throw new Error("invalid store");
    }

    memory().__chatIncStore = parsed;
    return parsed;
  } catch {
    const initial = structuredClone(seed);
    memory().__chatIncStore = initial;
    await writeStore(initial).catch(() => undefined);
    return initial;
  }
}

async function writeStore(data: StoreData) {
  memory().__chatIncStore = data;

  try {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Vercel/serverless filesystems are often read-only; memory still works.
  }
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
    createdAt: new Date().toISOString(),
    votes: {},
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
