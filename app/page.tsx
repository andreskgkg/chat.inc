"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Comment, Prediction, VoteValue } from "@/lib/types";
import { score } from "@/lib/types";
import { getVisitorId } from "@/lib/visitor";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    throw new Error(response.ok ? "Empty response." : `Request failed (${response.status}).`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Bad response." : `Request failed (${response.status}).`);
  }
}

export default function Home() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voterId, setVoterId] = useState("");
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    setVoterId(getVisitorId());
    void loadPredictions();
  }, []);

  async function loadPredictions() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/predictions");
      const data = await readJson<{ predictions?: Prediction[]; error?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || "Could not load predictions.");
      }

      setPredictions(data.predictions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load predictions.");
    } finally {
      setLoading(false);
    }
  }

  async function votePrediction(predictionId: string, next: VoteValue | 0) {
    if (!voterId) return;

    const response = await fetch(`/api/predictions/${predictionId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId, value: next }),
    });

    const data = await readJson<{ prediction?: Prediction; error?: string }>(response);

    if (!response.ok || !data.prediction) {
      setError(data.error || "Vote failed.");
      return;
    }

    setPredictions((current) =>
      current.map((item) => (item.id === predictionId ? data.prediction! : item)),
    );
  }

  async function voteComment(commentId: string, next: VoteValue | 0) {
    if (!voterId) return;

    const response = await fetch(`/api/comments/${commentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId, value: next }),
    });

    const data = await readJson<{
      comment?: Comment;
      predictionId?: string;
      error?: string;
    }>(response);

    if (!response.ok || !data.comment || !data.predictionId) {
      setError(data.error || "Vote failed.");
      return;
    }

    setPredictions((current) =>
      current.map((prediction) => {
        if (prediction.id !== data.predictionId) return prediction;

        return {
          ...prediction,
          comments: prediction.comments.map((comment) =>
            comment.id === commentId ? data.comment! : comment,
          ),
        };
      }),
    );
  }

  async function addComment(predictionId: string, author: string, body: string) {
    const response = await fetch(`/api/predictions/${predictionId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, body }),
    });

    const data = await readJson<{ comment?: Comment; error?: string }>(response);

    if (!response.ok || !data.comment) {
      throw new Error(data.error || "Could not post comment.");
    }

    setPredictions((current) =>
      current.map((prediction) =>
        prediction.id === predictionId
          ? { ...prediction, comments: [...prediction.comments, data.comment!] }
          : prediction,
      ),
    );
    setOpenComments((current) => ({ ...current, [predictionId]: true }));
  }

  async function createPrediction(author: string, text: string) {
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    });

    const data = await readJson<{ prediction?: Prediction; error?: string }>(response);

    if (!response.ok || !data.prediction) {
      throw new Error(data.error || "Could not create prediction.");
    }

    setPredictions((current) => [data.prediction!, ...current]);
    setComposerOpen(false);
  }

  return (
    <main className="page">
      <h1 className="brand">chat.inc</h1>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="loading">loading…</p> : null}
      {!loading && predictions.length === 0 ? <p className="empty">no predictions yet</p> : null}

      <section className="feed" aria-label="predictions">
        {predictions.map((prediction) => {
          const commentsOpen = openComments[prediction.id] ?? false;
          const myVote = voterId ? prediction.votes[voterId] : undefined;

          return (
            <article key={prediction.id}>
              <div className="prediction-top">
                <VoteRail
                  value={myVote}
                  total={score(prediction.votes)}
                  onVote={(next) => {
                    const current = prediction.votes[voterId];
                    void votePrediction(prediction.id, current === next ? 0 : next);
                  }}
                />

                <div className="prediction-body">
                  <h2>{prediction.text}</h2>
                  <div className="meta">
                    <span>{prediction.author}</span>
                    <span>{formatDate(prediction.createdAt)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((current) => ({
                          ...current,
                          [prediction.id]: !commentsOpen,
                        }))
                      }
                    >
                      {prediction.comments.length}{" "}
                      {prediction.comments.length === 1 ? "comment" : "comments"}
                    </button>
                  </div>
                </div>
              </div>

              {commentsOpen ? (
                <div className="comments">
                  {prediction.comments.length > 0 ? (
                    <ul className="comment-list">
                      {prediction.comments
                        .slice()
                        .sort((a, b) => score(b.votes) - score(a.votes))
                        .map((comment) => (
                          <li className="comment" key={comment.id}>
                            <VoteRail
                              compact
                              value={voterId ? comment.votes[voterId] : undefined}
                              total={score(comment.votes)}
                              onVote={(next) => {
                                const current = comment.votes[voterId];
                                void voteComment(comment.id, current === next ? 0 : next);
                              }}
                            />
                            <div className="comment-copy">
                              <div className="who">
                                {comment.author} · {formatDate(comment.createdAt)}
                              </div>
                              <p>{comment.body}</p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : null}

                  <CommentForm
                    onSubmit={async (author, body) => {
                      await addComment(prediction.id, author, body);
                    }}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <div className="fab-wrap">
        <button type="button" className="fab" onClick={() => setComposerOpen(true)}>
          new prediction
        </button>
      </div>

      {composerOpen ? (
        <ComposerModal
          onClose={() => setComposerOpen(false)}
          onCreate={createPrediction}
        />
      ) : null}
    </main>
  );
}

function VoteRail({
  value,
  total,
  onVote,
}: {
  value?: VoteValue;
  total: number;
  onVote: (value: VoteValue) => void;
  compact?: boolean;
}) {
  return (
    <div className="vote-rail">
      <button
        type="button"
        className={`vote-btn ${value === 1 ? "active-up" : ""}`}
        aria-label="Upvote"
        onClick={() => onVote(1)}
      >
        ▲
      </button>
      <div className="score">{total}</div>
      <button
        type="button"
        className={`vote-btn ${value === -1 ? "active-down" : ""}`}
        aria-label="Downvote"
        onClick={() => onVote(-1)}
      >
        ▼
      </button>
    </div>
  );
}

function CommentForm({
  onSubmit,
}: {
  onSubmit: (author: string, body: string) => Promise<void>;
}) {
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim() || pending) return;

    setPending(true);
    setError("");

    try {
      await onSubmit(author, body);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={submit}>
      <div className="comment-composer">
        <input
          className="comment-name"
          placeholder="Your name"
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          maxLength={40}
          aria-label="Name"
        />
        <textarea
          className="comment-body"
          placeholder="Add a comment…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          rows={2}
          required
        />
        <div className="comment-footer">
          <span className="comment-hint">{body.length}/500</span>
          <button className="comment-submit" type="submit" disabled={!body.trim() || pending}>
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}

function ComposerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (author: string, text: string) => Promise<void>;
}) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || pending) return;

    setPending(true);
    setError("");

    try {
      await onCreate(author, text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create prediction.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label="New prediction">
        <h3>new prediction</h3>

        <form className="composer-form" onSubmit={submit}>
          <input
            className="field"
            placeholder="name"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            maxLength={40}
            autoFocus
          />
          <textarea
            className="field-area"
            placeholder="SpaceX will acquire Robinhood"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={280}
            required
          />
          {error ? <p className="error">{error}</p> : null}
          <div className="form-actions">
            <button className="ghost" type="button" onClick={onClose}>
              cancel
            </button>
            <button className="primary" type="submit" disabled={!text.trim() || pending}>
              {pending ? "…" : "post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
