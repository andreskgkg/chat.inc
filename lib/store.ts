import { randomUUID } from "crypto";
import { get, put } from "@vercel/blob";
import type { Prediction, StoreData, VoteValue } from "./types";

const STORE_PATH = "chat-inc/store.json";

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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }

  const blob = await get(STORE_PATH, {
    access: "private",
    useCache: false,
  });

  if (!blob?.stream) {
    const initial = structuredClone(seed);
    await writeStore(initial);
    return initial;
  }

  const raw = await new Response(blob.stream).text();
  const parsed = normalize(JSON.parse(raw) as StoreData);

  if (!Array.isArray(parsed.predictions)) {
    throw new Error("invalid store");
  }

  return parsed;
}

async function writeStore(data: StoreData) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }

  await put(STORE_PATH, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
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
