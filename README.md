# chat.inc

Andres posts predictions. Visitors comment and upvote/downvote.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `ADMIN_PASSWORD` in `.env.local` — that password unlocks the **New prediction** button.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- Predictions are authored only by Andres (password-gated).
- Anyone can comment and vote on predictions or comments.
- Votes are tied to a browser id in `localStorage`.
- Data is stored in `data/store.json`.

## Deploy

Works with `next start` on a host with a writable filesystem. On Vercel serverless, file writes do not persist across instances — use a database or KV store before relying on production votes/comments there.
