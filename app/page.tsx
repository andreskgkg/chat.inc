"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Prediction, VoteValue } from "@/lib/types";
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
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    setVoterId(getVisitorId());
    void loadPredictions();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("modal-open", composerOpen);
    return () => document.body.classList.remove("modal-open");
  }, [composerOpen]);

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

  async function createPrediction(text: string) {
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
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
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">…</p> : null}
      {!loading && predictions.length === 0 ? <p className="muted">nothing yet</p> : null}

      <section className="feed" aria-label="predictions">
        {predictions.map((prediction) => {
          const myVote = voterId ? prediction.votes[voterId] : undefined;

          return (
            <article className="prediction" key={prediction.id}>
              <VoteRail
                value={myVote}
                total={score(prediction.votes)}
                onVote={(next) => {
                  const current = prediction.votes[voterId];
                  void votePrediction(prediction.id, current === next ? 0 : next);
                }}
              />
              <p className="prediction-text">{prediction.text}</p>
            </article>
          );
        })}
      </section>

      <div className="fab-wrap">
        <button type="button" className="fab" onClick={() => setComposerOpen(true)}>
          add prediction
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
}) {
  return (
    <div className="vote-rail">
      <button
        type="button"
        className={`vote-btn ${value === 1 ? "active" : ""}`}
        aria-label="Upvote"
        onClick={() => onVote(1)}
      >
        +
      </button>
      <div className={`score ${value ? "voted" : ""}`}>{total}</div>
      <button
        type="button"
        className={`vote-btn ${value === -1 ? "active" : ""}`}
        aria-label="Downvote"
        onClick={() => onVote(-1)}
      >
        −
      </button>
    </div>
  );
}

function ComposerModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim() || pending) return;

    setPending(true);
    setError("");

    try {
      await onCreate(text.trim());
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
        <div className="sheet-handle" aria-hidden="true" />
        <form className="composer-form" onSubmit={submit}>
          <textarea
            className="field-area"
            placeholder="SpaceX will acquire Robinhood"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={280}
            required
            autoFocus
          />
          {error ? <p className="error">{error}</p> : null}
          <div className="form-actions">
            <button className="ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={!text.trim() || pending}>
              {pending ? "…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
