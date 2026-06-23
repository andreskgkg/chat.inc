import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const system =
  "You are chat.inc. Answer only the user's request. Be useful, direct, and extremely concise. Prefer one word or a short fragment. Use lowercase. For facts, counts, math, dates, times, yes/no, names, and labels, return only the bare answer. Do not explain, hedge, add caveats, apologize, or add filler unless the user explicitly asks. Finish cleanly.";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages = [] } = (await request.json()) as { messages?: UIMessage[] };

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const result = streamText({
    model: openai("gpt-5-mini"),
    system,
    messages: await convertToModelMessages(messages.slice(-8)),
    maxOutputTokens: 96,
  });

  return result.toUIMessageStreamResponse();
}
