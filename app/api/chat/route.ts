import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
} from "ai";

const system =
  "You are chat.inc. Give short, opinionated answers, ideally 1 or 2 words. Use lowercase. No punctuation. No explanations. Never ask follow-up questions. Never say you need more information. Make the strongest reasonable assumption and answer directly from the information given. If the assumption is wrong, the user can ask again. Being slightly wrong is better than stalling. If 1 or 2 words cannot answer safely or usefully, use the shortest possible phrase.";

export const maxDuration = 30;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { messages = [] } = (await request.json()) as { messages?: UIMessage[] };
  const modelMessages = await convertToModelMessages(messages.slice(-8));

  try {
    const result = await answerWithModel("gpt-5.5-mini", modelMessages);

    return textResponse(result);
  } catch (error) {
    console.error("Primary model failed", error);
  }

  try {
    const result = await answerWithModel("gpt-5-mini", modelMessages);

    return textResponse(result);
  } catch (error) {
    console.error("Fallback model failed", error);

    return textResponse("unsure");
  }
}

async function answerWithModel(modelName: string, messages: Awaited<ReturnType<typeof convertToModelMessages>>) {
  const result = await generateText({
    model: openai(modelName),
    system,
    messages,
    maxOutputTokens: 128,
    providerOptions: {
      openai: {
        reasoningEffort: "minimal",
        textVerbosity: "low",
      },
    },
  });

  return result.text.trim() || "unsure";
}

function textResponse(text: string) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        const id = "answer";

        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: text });
        writer.write({ type: "text-end", id });
      },
    }),
  });
}
