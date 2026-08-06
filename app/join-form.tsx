"use client";

import { FormEvent, useState } from "react";

export function JoinForm({ className = "" }: { className?: string }) {
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!phone.trim() || pending) return;

    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Could not text you.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not text you.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <p className="join-note">
        Check your texts — we’ll ask for your LinkedIn or X, then send your first paid
        question.
      </p>
    );
  }

  return (
    <form className={`join ${className}`.trim()} onSubmit={submit}>
      <input
        type="tel"
        name="phone"
        placeholder="(415) 555-0198"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        autoComplete="tel"
        inputMode="tel"
        required
        aria-label="Phone number"
      />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "…" : "get started"}
      </button>
      {error ? <p className="join-error">{error}</p> : null}
    </form>
  );
}
