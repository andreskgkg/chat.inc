# chat.inc

Predictions. Visitors comment and vote.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `ADMIN_PASSWORD` in `.env.local`.

```bash
npm run dev
```

## Deploy

Set `ADMIN_PASSWORD` in Vercel. On serverless, data is kept in memory for the warm instance (file writes may not persist).
