"use client";

import { FormEvent, useState } from "react";

export function JoinForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  if (done) {
    return <p className="join-note">You’re on the list. We’ll be in touch.</p>;
  }

  return (
    <form className="join" onSubmit={submit}>
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
        required
        aria-label="Email"
      />
      <button className="btn btn-primary" type="submit">
        Become an Expert
      </button>
    </form>
  );
}
