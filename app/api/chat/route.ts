import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const system =
  "You are a terse ChatGPT wrapper. Answer in 1 or 2 words whenever possible. Use lowercase. No punctuation. No explanations. If 1 or 2 words cannot answer safely or usefully, use the shortest possible phrase.";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { messages = [] } = (await request.json()) as { messages?: UIMessage[] };
  const result = streamText({
    model: openai("gpt-5-mini"),
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
