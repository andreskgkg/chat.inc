import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const system =
  "You are chat.inc. Give short, opinionated answers, ideally 1 or 2 words. Use lowercase. No punctuation. No explanations. Assume the most likely intent instead of asking follow-up questions. Being slightly wrong is better than stalling. If 1 or 2 words cannot answer safely or usefully, use the shortest possible phrase.";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { messages = [] } = (await request.json()) as { messages?: UIMessage[] };
  const result = streamText({
    model: openai("gpt-5.5-mini"),
    system,
    messages: await convertToModelMessages(messages.slice(-8)),
    maxOutputTokens: 128,
    providerOptions: {
      openai: {
        reasoningEffort: "minimal",
        textVerbosity: "low",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
