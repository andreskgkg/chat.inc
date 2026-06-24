import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type UIMessage,
} from "ai";

const system =
  "You are chat.inc. Give short, opinionated answers, ideally 1 or 2 words. Use lowercase. No punctuation. No explanations. Never ask follow-up questions. Never say you need more information. Make the strongest reasonable assumption and answer directly from the information given. If the assumption is wrong, the user can ask again. Being slightly wrong is better than stalling. Use web search for current, live, local, or time-sensitive facts. If 1 or 2 words cannot answer safely or usefully, use the shortest possible phrase.";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const { messages = [] } = (await request.json()) as { messages?: UIMessage[] };
  const modelMessages = await convertToModelMessages(messages.slice(-8));
  const latestUserText = [...messages]
    .reverse()
    .find((message) => message.role === "user")
    ?.parts.filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");

  try {
    const result = await answerWithModel("gpt-5-mini", modelMessages, latestUserText ?? "");

    return textResponse(result);
  } catch (error) {
    console.error("Model failed", error);

    return textResponse("unsure");
  }
}

async function answerWithModel(
  modelName: "gpt-5-mini",
  messages: Awaited<ReturnType<typeof convertToModelMessages>>,
  latestUserText: string,
) {
  const shouldSearch = needsFreshInformation(latestUserText);
  const result = await generateText({
    model: openai.responses(modelName),
    system: `${system} Today is ${currentPacificDate()}.`,
    messages,
    maxOutputTokens: 512,
    tools: {
      web_search: openai.tools.webSearch({
        externalWebAccess: true,
        searchContextSize: "low",
        userLocation: {
          type: "approximate",
          country: "US",
          timezone: "America/Los_Angeles",
        },
      }),
    },
    toolChoice: shouldSearch ? { type: "tool", toolName: "web_search" } : "auto",
    providerOptions: {
      openai: {
        reasoningEffort: "low",
        textVerbosity: "low",
      },
    },
  });

  return result.text.trim() || "unsure";
}

function needsFreshInformation(text: string) {
  return /\b(today|tonight|now|current|currently|latest|recent|live|score|scores|schedule|fixture|fixtures|playing|weather|news|stock|price|world cup)\b/i.test(
    text,
  );
}

function currentPacificDate() {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "America/Los_Angeles",
  }).format(new Date());
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
