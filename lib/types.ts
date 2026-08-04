export type VoteValue = 1 | -1;

export type Comment = {
  id: string;
  predictionId: string;
  author: string;
  body: string;
  createdAt: string;
  votes: Record<string, VoteValue>;
};

export type Prediction = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  votes: Record<string, VoteValue>;
  comments: Comment[];
};

export type StoreData = {
  predictions: Prediction[];
};

export function score(votes: Record<string, VoteValue>) {
  return Object.values(votes).reduce((sum, value) => sum + value, 0);
}
