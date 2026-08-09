import { randomUUID } from "crypto";
import { readJsonFile, updateJsonFile } from "@/lib/json-store";
import type { Prediction, StoreData, VoteValue } from "./types";

const STORE_PATH = "store.json";

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
  const parsed = await readJsonFile<StoreData>(STORE_PATH, structuredClone(seed));
  const normalized = normalize(parsed);

  if (!Array.isArray(normalized.predictions)) {
    throw new Error("invalid store");
  }

  return normalized;
}

export async function listPredictions() {
  const store = await readStore();
  return [...store.predictions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createPrediction(text: string) {
  const prediction: Prediction = {
    id: randomUUID(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
    votes: {},
  };

  await updateJsonFile(STORE_PATH, structuredClone(seed), (store) => {
    const normalized = normalize(store);
    normalized.predictions.unshift(prediction);
    return normalized;
  });

  return prediction;
}

export async function votePrediction(
  predictionId: string,
  voterId: string,
  value: VoteValue | 0,
) {
  let updated: Prediction | null = null;

  await updateJsonFile(STORE_PATH, structuredClone(seed), (store) => {
    const normalized = normalize(store);
    const prediction = normalized.predictions.find(
      (item) => item.id === predictionId,
    );
    if (!prediction) return normalized;

    if (value === 0) {
      delete prediction.votes[voterId];
    } else {
      prediction.votes[voterId] = value;
    }
    updated = prediction;
    return normalized;
  });

  return updated;
}
