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
      <div className={`join join-done-wrap ${className}`.trim()}>
        <div className="join-done" role="status">
          Amazing, texting you now!
        </div>
      </div>
    );
  }

  return (
    <form className={`join ${className}`.trim()} onSubmit={submit}>
      <div className="join-shell">
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
        <button
          type="submit"
          className="join-submit"
          disabled={pending || !phone.trim()}
          aria-busy={pending}
          aria-label={pending ? "Sending" : undefined}
        >
          <span className="join-submit-label">Get started</span>
          <span className="typing-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
      {error ? <p className="join-error">{error}</p> : null}
    </form>
  );
}
