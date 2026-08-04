export type VoteValue = 1 | -1;

export type Prediction = {
  id: string;
  text: string;
  createdAt: string;
  votes: Record<string, VoteValue>;
};

export type StoreData = {
  predictions: Prediction[];
};

export function score(votes: Record<string, VoteValue>) {
  return Object.values(votes).reduce((sum, value) => sum + value, 0);
}
