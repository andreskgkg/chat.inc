# chat.inc

A tiny ChatGPT-style website that streams one-sentence answers with the Vercel AI SDK.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy this repository as a Next.js project on Vercel.

1. Import the repo into Vercel.
2. Add `OPENAI_API_KEY` in the Vercel project environment variables.
3. Deploy the project.
4. Add `chat.inc` as a production domain in Vercel.
5. Update the DNS records for `chat.inc` to point to Vercel, replacing the current redirect.

## How Responses Stay Short

The API route in `app/api/chat/route.ts` uses the Vercel AI SDK with OpenAI, sends a system instruction asking for exactly one short sentence, and caps generated output with `maxOutputTokens`.
