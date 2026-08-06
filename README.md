# chat.inc

Anonymous expert network built on text.

## Setup

```bash
npm install
cp .env.example .env.local
```

Required for the phone CTA:

- `CLAW_API_KEY` — Claw Messenger API key
- `BLOB_READ_WRITE_TOKEN` — stores leads

Optional:

- `CLAW_WEBHOOK_SECRET` — shared secret for inbound webhook auth

Point Claw Messenger inbound/webhook delivery (if enabled) to:

```text
https://chat.inc/api/claw/inbound
```

Flow:

1. Visitor enters phone → we text asking for LinkedIn or X
2. They reply → we text a paid sample question

```bash
npm run dev
```
